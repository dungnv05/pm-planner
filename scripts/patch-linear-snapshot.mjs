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
  const cycles = (
    Array.isArray(incoming.cycles) && incoming.cycles.length > 0
      ? incoming.cycles
      : base.cycles
  ).map((c) => normalizeCycle(c, now))
  const ongoing = new Set(cycles.filter((c) => c.isCurrent).map((c) => c.id))
  const fresh = usableActualWork(incoming.actualWork).filter(
    (r) => !ongoing.has(r.cycleId),
  )
  const refreshIds = new Set(fresh.map((r) => r.cycleId))
  const kept = refreshIds.size
    ? base.actualWork.filter((r) => !refreshIds.has(r.cycleId))
    : base.actualWork
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
    actualWork: [...kept, ...fresh],
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
