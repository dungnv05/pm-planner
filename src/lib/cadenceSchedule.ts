import type { CadenceScheduleSettings } from '../types'

const STORAGE_KEY = 'pm-resource-planner:cadence-schedule'

export const ICT_TZ = 'Asia/Ho_Chi_Minh'

export const WEEKDAY_OPTIONS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
] as const

export const DEFAULT_CADENCE_SCHEDULE: CadenceScheduleSettings = {
  daily: { time: '09:30', weekdays: [1, 2, 3, 4, 5] },
  weekly: { time: '10:00', weekdays: [4] },
  monthly: { time: '10:00', days: [28], leadDays: 3 },
  notificationsEnabled: false,
}

export interface IctStamp {
  y: number
  m: number
  d: number
  hour: number
  minute: number
  /** ISO weekday 1=Mon … 7=Sun */
  weekday: number
  dayKey: string
  monthKey: string
  minutes: number
}

function num(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find((p) => p.type === type)?.value)
}

const WEEKDAY_MON1: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

export function ictStamp(now = new Date()): IctStamp {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ICT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(now)
  const y = num(parts, 'year')
  const m = num(parts, 'month')
  const d = num(parts, 'day')
  const hour = num(parts, 'hour')
  const minute = num(parts, 'minute')
  const wdRaw = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const weekday = WEEKDAY_MON1[wdRaw] ?? 1
  return {
    y,
    m,
    d,
    hour,
    minute,
    weekday,
    dayKey: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    monthKey: `${y}-${String(m).padStart(2, '0')}`,
    minutes: hour * 60 + minute,
  }
}

export function parseHm(time: string): number {
  const [h, min] = time.split(':').map(Number)
  return (h || 0) * 60 + (min || 0)
}

export function atOrAfterTime(stamp: IctStamp, time: string): boolean {
  return stamp.minutes >= parseHm(time)
}

export function is2359(stamp: IctStamp): boolean {
  return stamp.hour === 23 && stamp.minute === 59
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function validMonthDays(y: number, m: number, days: number[]): number[] {
  const last = lastDayOfMonth(y, m)
  return [...new Set(days.filter((d) => d >= 1 && d <= last))].sort((a, b) => a - b)
}

export function earliestValidDay(y: number, m: number, days: number[]): number {
  const valid = validMonthDays(y, m, days)
  return valid[0] ?? lastDayOfMonth(y, m)
}

export function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + delta
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
}

/** YYYY-MM-DD of T-3 (leadDays) before the earliest selected day in that month. */
export function monthlyT3Date(
  y: number,
  m: number,
  days: number[],
  leadDays: number,
): string {
  const due = earliestValidDay(y, m, days)
  const utc = Date.UTC(y, m - 1, due)
  const t3 = new Date(utc)
  t3.setUTCDate(t3.getUTCDate() - Math.max(0, leadDays))
  const yy = t3.getUTCFullYear()
  const mm = String(t3.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(t3.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function monthKeyFromParts(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`
}

/**
 * Monthly cycle key YYYY-MM: [T-3 of month M, T-3 of month M+1).
 * Completions stay until the next month's T-3.
 */
export function monthlyCycleKey(
  monthly: CadenceScheduleSettings['monthly'],
  now = new Date(),
): string {
  const stamp = ictStamp(now)
  const lead = monthly.leadDays ?? 3
  const candidates = [-1, 0, 1].map((delta) => shiftMonth(stamp.y, stamp.m, delta))
  for (const { y, m } of candidates) {
    const start = monthlyT3Date(y, m, monthly.days, lead)
    const nxt = shiftMonth(y, m, 1)
    const end = monthlyT3Date(nxt.y, nxt.m, monthly.days, lead)
    if (stamp.dayKey >= start && stamp.dayKey < end) {
      return monthKeyFromParts(y, m)
    }
  }
  return stamp.monthKey
}

export function thisMonthT3(
  monthly: CadenceScheduleSettings['monthly'],
  now = new Date(),
): string {
  const cycle = monthlyCycleKey(monthly, now)
  const [y, m] = cycle.split('-').map(Number)
  return monthlyT3Date(y, m, monthly.days, monthly.leadDays ?? 3)
}

export function thisMonthDueDay(
  monthly: CadenceScheduleSettings['monthly'],
  now = new Date(),
): string {
  const cycle = monthlyCycleKey(monthly, now)
  const [y, m] = cycle.split('-').map(Number)
  const due = earliestValidDay(y, m, monthly.days)
  return `${cycle}-${String(due).padStart(2, '0')}`
}

export function lastSelectedWeekdayThisIsoWeek(selected: number[]): number | null {
  if (selected.length === 0) return null
  return Math.max(...selected)
}

export function isLastSelectedWeekdayToday(
  selected: number[],
  now = new Date(),
): boolean {
  const stamp = ictStamp(now)
  const last = lastSelectedWeekdayThisIsoWeek(selected)
  return last != null && stamp.weekday === last
}

export function loadCadenceSchedule(): CadenceScheduleSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CADENCE_SCHEDULE }
    const parsed = JSON.parse(raw) as Partial<CadenceScheduleSettings>
    return {
      daily: {
        time: parsed.daily?.time || DEFAULT_CADENCE_SCHEDULE.daily.time,
        weekdays:
          parsed.daily?.weekdays?.length
            ? parsed.daily.weekdays
            : DEFAULT_CADENCE_SCHEDULE.daily.weekdays,
      },
      weekly: {
        time: parsed.weekly?.time || DEFAULT_CADENCE_SCHEDULE.weekly.time,
        weekdays:
          parsed.weekly?.weekdays?.length
            ? parsed.weekly.weekdays
            : DEFAULT_CADENCE_SCHEDULE.weekly.weekdays,
      },
      monthly: {
        time: parsed.monthly?.time || DEFAULT_CADENCE_SCHEDULE.monthly.time,
        days:
          parsed.monthly?.days?.length
            ? parsed.monthly.days
            : DEFAULT_CADENCE_SCHEDULE.monthly.days,
        leadDays:
          typeof parsed.monthly?.leadDays === 'number'
            ? parsed.monthly.leadDays
            : DEFAULT_CADENCE_SCHEDULE.monthly.leadDays,
      },
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
    }
  } catch {
    return { ...DEFAULT_CADENCE_SCHEDULE }
  }
}

export function saveCadenceSchedule(settings: CadenceScheduleSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function toggleNumber(list: number[], value: number): number[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value].sort((a, b) => a - b)
}
