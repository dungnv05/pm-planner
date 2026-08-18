import type { ActualWork, Assignment, Cycle } from '../types'
import { addDays, parseISODate, toISODate, startOfWeek, weekIndex, monthKey } from './dates'
import { isFiscalQuarterStart } from './fiscalYear'

export type TimelineScale = 'week' | 'month'

export const WEEK_COL_W = 52
export const MONTH_COL_W = 108
export const LANE_H = 38
export const PLAN_BAR_H = 18
export const ACTUAL_BAR_H = 12
export const LANE_PAD_Y = 3

export function colWidth(scale: TimelineScale): number {
  return scale === 'month' ? MONTH_COL_W : WEEK_COL_W
}

/** Map a date/week into a column index for the active scale. */
export function dateToColIndex(
  iso: string,
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): number {
  if (scale === 'week') {
    const monday = toISODate(startOfWeek(parseISODate(iso)))
    let idx = weekIndex(weeks, monday)
    if (idx >= 0) return idx
    const t = parseISODate(iso).getTime()
    idx = weeks.findIndex((w) => parseISODate(w).getTime() >= t)
    if (idx >= 0) return idx
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (parseISODate(weeks[i]).getTime() <= t) return i
    }
    return -1
  }
  const mk =
    iso.length === 7 ? iso : monthKey(parseISODate(iso.length === 7 ? `${iso}-01` : iso))
  return months.indexOf(mk)
}

export function cycleColSpan(
  cycle: Cycle,
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): { start: number; end: number } | null {
  const cols = scale === 'week' ? weeks : months
  if (cols.length === 0) return null
  let si = dateToColIndex(cycle.startsAt, scale, weeks, months)
  let ei = dateToColIndex(cycle.endsAt, scale, weeks, months)
  if (scale === 'week') {
    // end is exclusive-ish in Linear; prefer last week fully before endsAt
    ei = -1
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (parseISODate(weeks[i]).getTime() < parseISODate(cycle.endsAt).getTime()) {
        ei = i
        break
      }
    }
  } else {
    // month: if endsAt is 1st of month 00:00, previous month is last
    const end = parseISODate(cycle.endsAt)
    if (end.getDate() === 1 && end.getHours() <= 12) {
      const prev = new Date(end.getFullYear(), end.getMonth() - 1, 1)
      const mk = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      ei = months.indexOf(mk)
    }
  }
  if (si < 0 && scale === 'week') {
    si = weeks.findIndex((w) => parseISODate(w).getTime() >= parseISODate(cycle.startsAt).getTime())
  }
  if (si < 0 || ei < 0) return null
  return { start: si, end: Math.max(si, ei) }
}

/** Inclusive date range → column span, clipped to the visible window. */
export function rangeColSpan(
  startIso: string,
  endIso: string,
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): { start: number; end: number } | null {
  const rangeStart = parseISODate(startIso)
  const rangeEnd = parseISODate(endIso)
  if (rangeEnd.getTime() < rangeStart.getTime()) return null

  if (scale === 'week') {
    let start = -1
    let end = -1
    for (let i = 0; i < weeks.length; i++) {
      const mon = parseISODate(weeks[i])
      const sun = addDays(mon, 6)
      if (mon.getTime() <= rangeEnd.getTime() && sun.getTime() >= rangeStart.getTime()) {
        if (start < 0) start = i
        end = i
      }
    }
    if (start < 0) return null
    return { start, end }
  }

  let start = -1
  let end = -1
  for (let i = 0; i < months.length; i++) {
    const [y, m] = months[i].split('-').map(Number)
    const mStart = new Date(y, m - 1, 1)
    const mEnd = new Date(y, m, 0)
    if (mStart.getTime() <= rangeEnd.getTime() && mEnd.getTime() >= rangeStart.getTime()) {
      if (start < 0) start = i
      end = i
    }
  }
  if (start < 0) return null
  return { start, end }
}

/** First column index of each FY quarter that appears in the window. */
export function fiscalQuarterColIndexes(
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): number[] {
  const cols = scale === 'week' ? weeks : months
  const out: number[] = []
  let lastMonth: string | null = null
  for (let i = 0; i < cols.length; i++) {
    const mk = scale === 'week' ? monthKey(parseISODate(weeks[i])) : months[i]
    if (!isFiscalQuarterStart(mk) || mk === lastMonth) continue
    lastMonth = mk
    out.push(i)
  }
  return out
}

/** Stable lane order: members with plan first (by name), then actual-only. */
export function memberLanesForProject(
  projectId: string,
  assignments: Assignment[],
  actualWork: ActualWork[],
  completedCycleIds: Set<string>,
  memberName: (id: string) => string,
): string[] {
  const ids = new Set<string>()
  for (const a of assignments) {
    if (a.projectId === projectId) ids.add(a.memberId)
  }
  for (const w of actualWork) {
    if (w.projectId === projectId && completedCycleIds.has(w.cycleId)) {
      ids.add(w.memberId)
    }
  }
  return [...ids].sort((a, b) => memberName(a).localeCompare(memberName(b)))
}

export function trackHeight(laneCount: number): number {
  const n = Math.max(1, laneCount)
  return n * LANE_H + LANE_PAD_Y * 2
}
