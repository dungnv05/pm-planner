import fallbackSnapshot from '../../data/linear-snapshot.json'
import type { ActualWork, Cycle, LinearSnapshot, Project } from '../types'

const SNAPSHOT_OVERRIDE_KEY = 'pm-resource-planner:linear-snapshot'
/** `linear-snapshot-20260821T054038Z.json` or `linear-snapshot-cycle-9-20260821T061800Z.json` */
const SNAPSHOT_TS_RE = /linear-snapshot-(?:.+-)?(\d{8}T\d{6}Z)\.json$/

export function isLinearSnapshot(value: unknown): value is LinearSnapshot {
  if (!value || typeof value !== 'object') return false
  const o = value as LinearSnapshot
  return (
    Array.isArray(o.members) &&
    Array.isArray(o.projects) &&
    Array.isArray(o.cycles) &&
    Array.isArray(o.actualWork) &&
    !!o.team &&
    typeof o.team === 'object'
  )
}

function linearField(value: unknown, key: 'name' | 'type'): string {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object') {
    const inner = (value as Record<string, unknown>)[key]
    if (typeof inner === 'string' && inner) return inner
  }
  return ''
}

/** Loop/skill sometimes stores Linear `{ name, type }` instead of strings. */
function normalizeProject(p: Project): Project {
  const rawStatus = p.status as unknown
  const status = linearField(rawStatus, 'name') || 'Unknown'
  const statusType =
    linearField(p.statusType, 'type') || linearField(rawStatus, 'type') || 'planned'
  return { ...p, status, statusType }
}

function normalizeCycle(c: Cycle, now = Date.now()): Cycle {
  const start = Date.parse(c.startsAt)
  const end = Date.parse(c.endsAt)
  const inWindow =
    Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end
  const isCurrent = Boolean(c.isCurrent) || inWindow
  const isCompleted = !isCurrent && Number.isFinite(end) && end < now
  return { ...c, isCurrent, isCompleted }
}

export function normalizeSnapshot(snapshot: LinearSnapshot): LinearSnapshot {
  const now = Date.now()
  const cycles = (snapshot.cycles ?? []).map((c) => normalizeCycle(c, now))
  const ongoing = new Set(cycles.filter((c) => c.isCurrent).map((c) => c.id))
  return {
    ...snapshot,
    projects: (snapshot.projects ?? []).map(normalizeProject),
    cycles,
    actualWork: (snapshot.actualWork ?? []).filter((r) => !ongoing.has(r.cycleId)),
  }
}

function actualWorkCycleCount(rows: ActualWork[] | undefined): number {
  return new Set((rows ?? []).map((r) => r.cycleId)).size
}

function groupActualWork(rows: ActualWork[]): Map<string, ActualWork[]> {
  const byCycle = new Map<string, ActualWork[]>()
  for (const row of rows) {
    const list = byCycle.get(row.cycleId)
    if (list) list.push(row)
    else byCycle.set(row.cycleId, [row])
  }
  return byCycle
}

/**
 * Loop often ships 1-row stubs for older cycles. Never replace a cycle with a
 * thinner set, unless the file is a 1–2 cycle patch (intentional refresh).
 */
function mergeActualWork(incoming: ActualWork[], base: ActualWork[]): ActualWork[] {
  const inBy = groupActualWork(incoming)
  const baseBy = groupActualWork(base)
  const thinPatch = inBy.size > 0 && inBy.size <= 2
  const ids = new Set([...inBy.keys(), ...baseBy.keys()])
  const out: ActualWork[] = []
  for (const id of ids) {
    const next = inBy.get(id) ?? []
    const prev = baseBy.get(id) ?? []
    if (thinPatch && inBy.has(id)) {
      out.push(...next)
      continue
    }
    out.push(...(next.length >= prev.length && next.length > 0 ? next : prev))
  }
  return out
}

function usableActualWork(rows: unknown): ActualWork[] {
  if (!Array.isArray(rows)) return []
  const out: ActualWork[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    if (
      typeof r.cycleId === 'string' &&
      typeof r.memberId === 'string' &&
      typeof r.projectId === 'string' &&
      typeof r.issueCount === 'number'
    ) {
      out.push({
        cycleId: r.cycleId,
        memberId: r.memberId,
        projectId: r.projectId,
        issueCount: r.issueCount,
      })
    }
  }
  return out
}

function upsertCycles(incoming: Cycle[] | undefined, base: Cycle[], now: number): Cycle[] {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return base.map((c) => normalizeCycle(c, now))
  }
  const incomingById = new Map<string, Cycle>()
  for (const c of incoming) {
    if (c && typeof c.id === 'string') {
      incomingById.set(c.id, normalizeCycle(c, now))
    }
  }
  const seen = new Set<string>()
  const out: Cycle[] = []
  for (const c of base) {
    const next = incomingById.get(c.id)
    out.push(next ?? normalizeCycle(c, now))
    seen.add(c.id)
  }
  for (const [id, c] of incomingById) {
    if (!seen.has(id)) out.push(c)
  }
  return out
}

/** Merge a Loop patch (members/projects+milestones + 1 cycle + that cycle’s actualWork) onto a full snapshot. */
export function mergeImportedSnapshot(
  incoming: unknown,
  base: LinearSnapshot,
): LinearSnapshot {
  if (!incoming || typeof incoming !== 'object') {
    throw new Error('JSON is not an object')
  }
  const o = incoming as Partial<LinearSnapshot>
  const members =
    Array.isArray(o.members) && o.members.length > 0 ? o.members : base.members
  const projects =
    Array.isArray(o.projects) && o.projects.length > 0 ? o.projects : base.projects
  const now = Date.now()
  const cycles = upsertCycles(
    Array.isArray(o.cycles) ? o.cycles : undefined,
    base.cycles,
    now,
  )
  const ongoing = new Set(cycles.filter((c) => c.isCurrent).map((c) => c.id))
  const fresh = usableActualWork(o.actualWork).filter((r) => !ongoing.has(r.cycleId))
  const actualWork = mergeActualWork(fresh, base.actualWork).filter(
    (r) => !ongoing.has(r.cycleId),
  )
  const merged: LinearSnapshot = {
    syncedAt: o.syncedAt || new Date().toISOString(),
    syncMode: o.syncMode || 'recent',
    team:
      o.team && typeof o.team === 'object'
        ? { ...base.team, ...o.team }
        : base.team,
    members,
    projects,
    cycles,
    actualWork,
  }
  if (!isLinearSnapshot(merged)) {
    throw new Error('Merged JSON is not a valid Linear snapshot')
  }
  return normalizeSnapshot(merged)
}

export function looksLikeLinearSnapshotPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (Array.isArray(o.assignments) && !Array.isArray(o.members) && !Array.isArray(o.actualWork)) {
    return false
  }
  return (
    (!!o.team && typeof o.team === 'object') ||
    Array.isArray(o.members) ||
    Array.isArray(o.cycles) ||
    Array.isArray(o.actualWork)
  )
}

/** Why Import rejected a JSON object (null/missing arrays). */
export function linearSnapshotImportError(value: unknown): string | null {
  if (isLinearSnapshot(value)) return null
  if (looksLikeLinearSnapshotPayload(value)) return null
  if (!value || typeof value !== 'object') return 'JSON is not an object'
  const o = value as Record<string, unknown>
  const bad: string[] = []
  if (!o.team || typeof o.team !== 'object') bad.push('team')
  if (!Array.isArray(o.members)) bad.push('members[]')
  if (!Array.isArray(o.projects)) bad.push('projects[]')
  if (!Array.isArray(o.cycles)) bad.push('cycles[]')
  if (!Array.isArray(o.actualWork)) bad.push('actualWork[]')
  if (bad.length) {
    return `Not a Linear snapshot: ${bad.join(', ')} missing or not an array (Loop often sends projects: null — Import now merges that as a patch)`
  }
  return 'JSON must be a Linear snapshot or assignments.json'
}

export function saveSnapshotOverride(snapshot: LinearSnapshot): void {
  localStorage.setItem(
    SNAPSHOT_OVERRIDE_KEY,
    JSON.stringify(normalizeSnapshot(snapshot)),
  )
}

function timestampFromPath(path: string): string | null {
  const match = path.match(SNAPSHOT_TS_RE)
  return match?.[1] ?? null
}

function unwrapModule(
  mod: LinearSnapshot | { default: LinearSnapshot },
): LinearSnapshot {
  return 'default' in mod ? mod.default : mod
}

function loadDiskSnapshot(): LinearSnapshot {
  const modules = import.meta.glob('../../data/snapshots/linear-snapshot-*.json', {
    eager: true,
  }) as Record<string, LinearSnapshot | { default: LinearSnapshot }>

  let latestPath: string | null = null
  let latestTs = ''

  for (const path of Object.keys(modules)) {
    const ts = timestampFromPath(path)
    if (ts && ts > latestTs) {
      latestTs = ts
      latestPath = path
    }
  }

  if (latestPath) {
    return normalizeSnapshot(unwrapModule(modules[latestPath]))
  }

  return normalizeSnapshot(fallbackSnapshot as LinearSnapshot)
}

/** Base for merging a Loop patch: prefer localStorage only if it still has richer actuals. */
export function loadMergeBaseSnapshot(): LinearSnapshot {
  const disk = loadDiskSnapshot()
  try {
    const raw = localStorage.getItem(SNAPSHOT_OVERRIDE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (isLinearSnapshot(parsed) && actualWorkCycleCount(parsed.actualWork) >= 3) {
        const local = normalizeSnapshot(parsed)
        if (local.actualWork.length >= disk.actualWork.length) return local
      }
    }
  } catch {
    /* ignore */
  }
  return disk
}

/** Imported snapshot in localStorage, else newest `data/snapshots/linear-snapshot-*.json`, else committed `data/linear-snapshot.json`. */
export function loadLatestSnapshot(): LinearSnapshot {
  const disk = loadDiskSnapshot()
  try {
    const raw = localStorage.getItem(SNAPSHOT_OVERRIDE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (isLinearSnapshot(parsed)) {
        const local = normalizeSnapshot(parsed)
        if (local.actualWork.length >= disk.actualWork.length) return local
        const healed = mergeImportedSnapshot(local, disk)
        if (healed.actualWork.length > local.actualWork.length) {
          saveSnapshotOverride(healed)
        }
        return healed
      }
    }
  } catch {
    /* ignore corrupt override */
  }

  return disk
}
