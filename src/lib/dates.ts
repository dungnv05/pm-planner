/** Date helpers: weeks start Monday (ISO). All date strings are YYYY-MM-DD unless noted. */

const DAY_MS = 24 * 60 * 60 * 1000

export function parseISODate(iso: string): Date {
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  return d
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Monday of the week containing `d` (local). */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = copy.getDay() // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7)
}

export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Inclusive list of week Mondays from startWeek to endWeek. */
export function weeksInclusive(startWeek: string, endWeek: string): string[] {
  const weeks: string[] = []
  let cur = startOfWeek(parseISODate(startWeek))
  const end = startOfWeek(parseISODate(endWeek))
  while (cur.getTime() <= end.getTime()) {
    weeks.push(toISODate(cur))
    cur = addWeeks(cur, 1)
  }
  return weeks
}

/** Build week Mondays covering `monthCount` months from windowStart. */
export function buildWindowWeeks(windowStart: string, monthCount = 12): string[] {
  const start = startOfWeek(parseISODate(windowStart))
  const endMonth = addMonths(startOfMonth(start), monthCount)
  const lastWeek = startOfWeek(addDays(endMonth, -1))
  return weeksInclusive(toISODate(start), toISODate(lastWeek))
}

/** Calendar month keys (YYYY-MM) covering the window. */
export function buildWindowMonths(windowStart: string, monthCount = 12): string[] {
  const start = startOfMonth(parseISODate(windowStart))
  const keys: string[] = []
  for (let i = 0; i < monthCount; i++) {
    keys.push(monthKey(addMonths(start, i)))
  }
  return keys
}

export function monthsInWindow(weeks: string[]): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const w of weeks) {
    const k = monthKey(parseISODate(w))
    if (!seen.has(k)) {
      seen.add(k)
      keys.push(k)
    }
  }
  return keys
}

export function firstMondayOfMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return toISODate(startOfWeek(new Date(y, m - 1, 1)))
}

export function lastMondayInMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return toISODate(startOfWeek(endOfMonth(new Date(y, m - 1, 1))))
}

export function monthIndex(months: string[], weekOrMonth: string): number {
  const key = weekOrMonth.length === 7 ? weekOrMonth : monthKey(parseISODate(weekOrMonth))
  return months.indexOf(key)
}

/** Fraction of a calendar week (Mon–Sun) that falls inside a month. */
export function weekOverlapInMonth(weekMonday: string, month: string): number {
  const mon = parseISODate(weekMonday)
  const sun = addDays(mon, 6)
  const [y, m] = month.split('-').map(Number)
  const mStart = new Date(y, m - 1, 1)
  const mEnd = endOfMonth(mStart)
  const overlapStart = Math.max(mon.getTime(), mStart.getTime())
  const overlapEnd = Math.min(sun.getTime(), mEnd.getTime())
  if (overlapEnd < overlapStart) return 0
  const days = Math.round((overlapEnd - overlapStart) / DAY_MS) + 1
  return days / 7
}

/** Fraction of assignment weeks that fall inside [rangeStart, rangeEnd) ISO datetimes. */
export function assignmentOverlapInRange(
  startWeek: string,
  endWeek: string,
  rangeStartIso: string,
  rangeEndIso: string,
): number {
  const weeks = weeksInclusive(startWeek, endWeek)
  if (weeks.length === 0) return 0
  const rStart = parseISODate(rangeStartIso).getTime()
  const rEnd = parseISODate(rangeEndIso).getTime()
  let weight = 0
  for (const w of weeks) {
    const mon = parseISODate(w).getTime()
    const sun = addDays(parseISODate(w), 6).getTime() + DAY_MS - 1
    const overlapStart = Math.max(mon, rStart)
    const overlapEnd = Math.min(sun, rEnd - 1)
    if (overlapEnd >= overlapStart) {
      weight += (overlapEnd - overlapStart + 1) / (7 * DAY_MS)
    }
  }
  return weight / weeks.length
}

export function defaultWindowStart(from: Date = new Date()): string {
  const monthStart = startOfMonth(from)
  return toISODate(startOfWeek(monthStart))
}

export function weekIndex(weeks: string[], weekMonday: string): number {
  return weeks.indexOf(weekMonday)
}

export function clampWeekToWindow(week: string, weeks: string[]): string {
  if (weeks.length === 0) return week
  if (weeks.includes(week)) return week
  const t = parseISODate(week).getTime()
  if (t <= parseISODate(weeks[0]).getTime()) return weeks[0]
  if (t >= parseISODate(weeks[weeks.length - 1]).getTime()) return weeks[weeks.length - 1]
  // nearest
  let best = weeks[0]
  let bestDiff = Infinity
  for (const w of weeks) {
    const d = Math.abs(parseISODate(w).getTime() - t)
    if (d < bestDiff) {
      bestDiff = d
      best = w
    }
  }
  return best
}
