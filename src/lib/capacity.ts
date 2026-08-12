import type { Assignment } from '../types'
import { monthKey, parseISODate, weekOverlapInMonth, weeksInclusive } from './dates'

/**
 * Monthly capacity for a member: average of (sum of allocations per week)
 * across weeks that overlap the month, weighted by overlap fraction.
 */
export function memberMonthCapacity(
  memberId: string,
  month: string,
  assignments: Assignment[],
): number {
  const weekAlloc = new Map<string, number>()
  const weekWeight = new Map<string, number>()

  for (const a of assignments) {
    if (a.memberId !== memberId) continue
    for (const w of weeksInclusive(a.startWeek, a.endWeek)) {
      const overlap = weekOverlapInMonth(w, month)
      if (overlap <= 0) continue
      weekWeight.set(w, overlap)
      weekAlloc.set(w, (weekAlloc.get(w) ?? 0) + a.allocation)
    }
  }

  if (weekWeight.size === 0) return 0

  let weightedSum = 0
  let weightTotal = 0
  for (const [w, overlap] of weekWeight) {
    weightedSum += (weekAlloc.get(w) ?? 0) * overlap
    weightTotal += overlap
  }
  return weightTotal === 0 ? 0 : weightedSum / weightTotal
}

export function buildCapacityMap(
  memberIds: string[],
  months: string[],
  assignments: Assignment[],
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  for (const id of memberIds) {
    out[id] = {}
    for (const m of months) {
      out[id][m] = memberMonthCapacity(id, m, assignments)
    }
  }
  return out
}

export type CapacityTone = 'under' | 'full' | 'over-light' | 'over-mid' | 'over-deep' | 'empty'

export function capacityTone(value: number): CapacityTone {
  if (value <= 0.001) return 'empty'
  if (value < 0.99) return 'under'
  if (value <= 1.01) return 'full'
  if (value <= 1.25) return 'over-light'
  if (value <= 1.5) return 'over-mid'
  return 'over-deep'
}

export function capacityColor(value: number): string {
  switch (capacityTone(value)) {
    case 'empty':
      return 'var(--cap-empty)'
    case 'under':
      return 'var(--cap-under)'
    case 'full':
      return 'var(--cap-full)'
    case 'over-light':
      return 'var(--cap-over-1)'
    case 'over-mid':
      return 'var(--cap-over-2)'
    case 'over-deep':
      return 'var(--cap-over-3)'
  }
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** Average plan allocation for member (optionally on one project) during a cycle. */
export function memberPlanInCycle(
  memberId: string,
  projectId: string | null,
  cycleStartsAt: string,
  cycleEndsAt: string,
  assignments: Assignment[],
): number {
  const weekAlloc = new Map<string, number>()
  const weekWeight = new Map<string, number>()
  const rStart = parseISODate(cycleStartsAt).getTime()
  const rEnd = parseISODate(cycleEndsAt).getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  for (const a of assignments) {
    if (a.memberId !== memberId) continue
    if (projectId && a.projectId !== projectId) continue
    for (const w of weeksInclusive(a.startWeek, a.endWeek)) {
      const mon = parseISODate(w)
      const sunEnd = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7).getTime()
      const monT = mon.getTime()
      const overlapStart = Math.max(monT, rStart)
      const overlapEnd = Math.min(sunEnd, rEnd)
      if (overlapEnd <= overlapStart) continue
      const frac = (overlapEnd - overlapStart) / weekMs
      weekWeight.set(w, Math.max(weekWeight.get(w) ?? 0, frac))
      weekAlloc.set(w, (weekAlloc.get(w) ?? 0) + a.allocation * frac)
    }
  }

  let sum = 0
  let wSum = 0
  for (const [w, wt] of weekWeight) {
    sum += weekAlloc.get(w) ?? 0
    wSum += wt
  }
  return wSum === 0 ? 0 : sum / wSum
}

export function focusMonthFromWeeks(weeks: string[], scrollIndex = 0): string {
  if (weeks.length === 0) return monthKey(new Date())
  const idx = Math.min(Math.max(0, scrollIndex), weeks.length - 1)
  return monthKey(parseISODate(weeks[idx]))
}
