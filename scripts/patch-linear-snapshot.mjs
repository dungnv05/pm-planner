#!/usr/bin/env node
/**
 * Merge a Linear Loop patch JSON onto data/linear-snapshot.json.
 * Usage: node scripts/patch-linear-snapshot.mjs <patch.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const basePath = resolve(root, 'data/linear-snapshot.json')

function usableActualWork(rows) {
  if (!Array.isArray(rows)) return []
  return rows.filter(
    (r) =>
      r &&
      typeof r === 'object' &&
      typeof r.cycleId === 'string' &&
      typeof r.memberId === 'string' &&
      typeof r.projectId === 'string' &&
      typeof r.issueCount === 'number',
  )
}

function isSnapshot(o) {
  return (
    o &&
    typeof o === 'object' &&
    Array.isArray(o.members) &&
    Array.isArray(o.projects) &&
    Array.isArray(o.cycles) &&
    Array.isArray(o.actualWork) &&
    o.team &&
    typeof o.team === 'object'
  )
}

function cycleCount(rows) {
  return new Set((rows ?? []).map((r) => r.cycleId)).size
}

function linearField(value, key) {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object' && typeof value[key] === 'string' && value[key]) {
    return value[key]
  }
  return ''
}

function normalizeProject(p) {
  const status = linearField(p.status, 'name') || 'Unknown'
  const statusType =
    linearField(p.statusType, 'type') || linearField(p.status, 'type') || 'planned'
  return { ...p, status, statusType }
}

function normalizeCycle(c, now = Date.now()) {
  const start = Date.parse(c.startsAt)
  const end = Date.parse(c.endsAt)
  const inWindow =
    Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end
  const isCurrent = Boolean(c.isCurrent) || inWindow
  const isCompleted = !isCurrent && Number.isFinite(end) && end < now
  return { ...c, isCurrent, isCompleted }
}

function groupActualWork(rows) {
  const byCycle = new Map()
  for (const row of rows) {
    const list = byCycle.get(row.cycleId)
    if (list) list.push(row)
    else byCycle.set(row.cycleId, [row])
  }
  return byCycle
}

function mergeActualWork(incoming, base) {
  const inBy = groupActualWork(incoming)
  const baseBy = groupActualWork(base)
  const thinPatch = inBy.size > 0 && inBy.size <= 2
  const ids = new Set([...inBy.keys(), ...baseBy.keys()])
  const out = []
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

function upsertCycles(incoming, base, now) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return base.map((c) => normalizeCycle(c, now))
  }
  const incomingById = new Map()
  for (const c of incoming) {
    if (c && typeof c.id === 'string') {
      incomingById.set(c.id, normalizeCycle(c, now))
    }
  }
  const seen = new Set()
  const out = []
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

function merge(incoming, base) {
  if (!incoming || typeof incoming !== 'object') {
    throw new Error('Patch JSON is not an object')
  }
  const members =
    Array.isArray(incoming.members) && incoming.members.length > 0
      ? incoming.members
      : base.members
  const projects =
    Array.isArray(incoming.projects) && incoming.projects.length > 0
      ? incoming.projects
      : base.projects
  const now = Date.now()
  const cycles = upsertCycles(
    Array.isArray(incoming.cycles) ? incoming.cycles : undefined,
    base.cycles,
    now,
  )
  const ongoing = new Set(cycles.filter((c) => c.isCurrent).map((c) => c.id))
  const fresh = usableActualWork(incoming.actualWork).filter(
    (r) => !ongoing.has(r.cycleId),
  )
  const actualWork = mergeActualWork(fresh, base.actualWork).filter(
    (r) => !ongoing.has(r.cycleId),
  )
  const merged = {
    syncedAt: incoming.syncedAt || new Date().toISOString(),
    syncMode: 'recent',
    team:
      incoming.team && typeof incoming.team === 'object'
        ? { ...base.team, ...incoming.team }
        : base.team,
    members,
    projects: (projects ?? []).map(normalizeProject),
    cycles,
    actualWork,
  }
  if (!isSnapshot(merged)) {
    throw new Error('Merge did not produce a valid snapshot')
  }
  if (cycleCount(merged.actualWork) < 3) {
    throw new Error(
      `Merge would leave only ${cycleCount(merged.actualWork)} actualWork cycle(s); refusing to write`,
    )
  }
  return merged
}

const patchFile = process.argv[2]
if (!patchFile) {
  console.error('Usage: node scripts/patch-linear-snapshot.mjs <patch.json>')
  process.exit(1)
}

const base = JSON.parse(readFileSync(basePath, 'utf8'))
const patch = JSON.parse(readFileSync(resolve(patchFile), 'utf8'))
if (!isSnapshot(base)) {
  console.error('data/linear-snapshot.json is not a valid snapshot')
  process.exit(1)
}
const merged = merge(patch, base)
writeFileSync(basePath, `${JSON.stringify(merged, null, 2)}\n`)
console.log(
  JSON.stringify({
    wrote: 'data/linear-snapshot.json',
    syncedAt: merged.syncedAt,
    members: merged.members.length,
    projects: merged.projects.length,
    cycles: merged.cycles.length,
    actualWork: merged.actualWork.length,
    actualWorkCycles: cycleCount(merged.actualWork),
  }),
)
