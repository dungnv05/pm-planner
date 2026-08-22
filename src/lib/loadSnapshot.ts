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

/** Merge a Loop patch (members/projects+milestones/cycles + 1-cycle actualWork) onto a full snapshot. Incoming projects replace previous milestones. */
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
  const cycles = (
    Array.isArray(o.cycles) && o.cycles.length > 0 ? o.cycles : base.cycles
  ).map((c) => normalizeCycle(c, now))
  const ongoing = new Set(cycles.filter((c) => c.isCurrent).map((c) => c.id))
  const fresh = usableActualWork(o.actualWork).filter((r) => !ongoing.has(r.cycleId))
  const refreshIds = new Set(fresh.map((r) => r.cycleId))
  const kept = refreshIds.size
    ? base.actualWork.filter((r) => !refreshIds.has(r.cycleId))
    : base.actualWork
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
    actualWork: [...kept, ...fresh],
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

/** Base for merging a Loop patch: prefer localStorage only if it still has multi-cycle actuals. */
export function loadMergeBaseSnapshot(): LinearSnapshot {
  try {
    const raw = localStorage.getItem(SNAPSHOT_OVERRIDE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (isLinearSnapshot(parsed) && actualWorkCycleCount(parsed.actualWork) >= 3) {
        return normalizeSnapshot(parsed)
      }
    }
  } catch {
    /* ignore */
  }
  return loadDiskSnapshot()
}

/** Imported snapshot in localStorage, else newest `data/snapshots/linear-snapshot-*.json`, else committed `data/linear-snapshot.json`. */
export function loadLatestSnapshot(): LinearSnapshot {
  try {
    const raw = localStorage.getItem(SNAPSHOT_OVERRIDE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (isLinearSnapshot(parsed)) return normalizeSnapshot(parsed)
    }
  } catch {
    /* ignore corrupt override */
  }

  return loadDiskSnapshot()
}
