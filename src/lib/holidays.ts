import holidaysFile from '../../data/holidays.json'
import { addDays, parseISODate, startOfWeek, toISODate, weeksInclusive } from './dates'
import type { TimelineScale } from './timeline'

export type HolidayCountry = 'JP' | 'VN'

export interface Holiday {
  id: string
  name: string
  country: HolidayCountry
  start: string
  end: string
  note?: string
}

export interface HolidayGroup {
  col: number
  holidays: Holiday[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export const holidays = holidaysFile.holidays as Holiday[]

function overlapDays(rangeStart: Date, rangeEnd: Date, startIso: string, endIso: string): number {
  const s = parseISODate(startIso)
  const e = parseISODate(endIso)
  const a = Math.max(rangeStart.getTime(), s.getTime())
  const b = Math.min(rangeEnd.getTime(), e.getTime())
  if (b < a) return 0
  return Math.round((b - a) / DAY_MS) + 1
}

/** Column with the most holiday days (ties keep the earlier column). */
function majorityColSpan(
  holiday: Holiday,
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): { start: number; end: number } | null {
  const cols = scale === 'week' ? weeks : months
  let best = -1
  let bestDays = 0
  for (let i = 0; i < cols.length; i++) {
    let days = 0
    if (scale === 'week') {
      const mon = parseISODate(weeks[i])
      days = overlapDays(mon, addDays(mon, 6), holiday.start, holiday.end)
    } else {
      const [y, m] = months[i].split('-').map(Number)
      days = overlapDays(new Date(y, m - 1, 1), new Date(y, m, 0), holiday.start, holiday.end)
    }
    if (days > bestDays) {
      bestDays = days
      best = i
    }
  }
  if (best < 0 || bestDays <= 0) return null
  return { start: best, end: best }
}

/** Monday of the week that contains most of this long holiday. */
export function majorityWeekMonday(holiday: Holiday): string {
  const weeks = weeksInclusive(
    toISODate(startOfWeek(parseISODate(holiday.start))),
    toISODate(startOfWeek(parseISODate(holiday.end))),
  )
  let best = weeks[0]
  let bestDays = 0
  for (const w of weeks) {
    const mon = parseISODate(w)
    const days = overlapDays(mon, addDays(mon, 6), holiday.start, holiday.end)
    if (days > bestDays) {
      bestDays = days
      best = w
    }
  }
  return best
}

/** Week Mondays excluded from FY-half workload (VN long holidays only; JP counts as work). */
export function longHolidayWeekMondays(): Set<string> {
  return new Set(
    holidays.filter((h) => h.country === 'VN').map(majorityWeekMonday),
  )
}

export function holidaysInWindow(
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): { holiday: Holiday; span: { start: number; end: number } }[] {
  const jp: { holiday: Holiday; span: { start: number; end: number } }[] = []
  const vn: { holiday: Holiday; span: { start: number; end: number } }[] = []
  for (const holiday of holidays) {
    const span = majorityColSpan(holiday, scale, weeks, months)
    if (!span) continue
    const row = { holiday, span }
    if (holiday.country === 'JP') jp.push(row)
    else vn.push(row)
  }
  return [...jp, ...vn]
}

/** Holidays sharing a column (JP + VN in the same week become one group). */
export function holidayGroupsInWindow(
  scale: TimelineScale,
  weeks: string[],
  months: string[],
): HolidayGroup[] {
  const byCol = new Map<number, Holiday[]>()
  for (const { holiday, span } of holidaysInWindow(scale, weeks, months)) {
    const list = byCol.get(span.start) ?? []
    list.push(holiday)
    byCol.set(span.start, list)
  }
  return [...byCol.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([col, group]) => ({ col, holidays: group }))
}

export function holidayTooltip(holiday: Holiday): string {
  const note = holiday.note ? ` (${holiday.note})` : ''
  return `${holiday.country} · ${holiday.name} · ${holiday.start} – ${holiday.end}${note}`
}
