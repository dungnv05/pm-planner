import type { ActualWork, Assignment, Cycle } from '../types'
import { parseISODate, toISODate, startOfWeek, weekIndex, monthKey } from './dates'

export type TimelineScale = 'week' | 'month'

export const WEEK_COL_W = 36
export const MONTH_COL_W = 108
export const LANE_H = 46
export const PLAN_BAR_H = 22
export const ACTUAL_BAR_H = 14
export const LANE_PAD_Y = 4

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
