import { addMonths, monthKey, startOfMonth } from './dates'

export type FiscalHalfId = 'FH' | 'SH'
export type FiscalRangeMode = FiscalHalfId | 'FY'

export interface FiscalHalf {
  /** Calendar year the FY ends in, e.g. 2027 for FY27. */
  fy: number
  half: FiscalHalfId
  /** e.g. FY27_FH */
  label: string
  /** Six YYYY-MM keys in order. */
  months: string[]
}

export interface FiscalRange {
  fy: number
  mode: FiscalRangeMode
  /** e.g. FY27_FH, FY27_SH, FY27 */
  label: string
  months: string[]
}

function fyYear(d: Date): number {
  return d.getMonth() >= 7 ? d.getFullYear() + 1 : d.getFullYear()
}

function fyHalf(d: Date): FiscalHalfId {
  const m = d.getMonth()
  return m >= 7 || m === 0 ? 'FH' : 'SH'
}

export function fyShortLabel(fy: number): string {
  return `FY${String(fy).slice(-2)}`
}

function fyLabel(fy: number, half: FiscalHalfId): string {
  return `${fyShortLabel(fy)}_` + half
}

export function fiscalYearFromDate(d: Date = new Date()): number {
  return fyYear(d)
}

/** Six calendar months of a FY half. FH = Aug–Jan; SH = Feb–Jul. */
export function monthsForHalf(fy: number, half: FiscalHalfId): string[] {
  const start =
    half === 'FH'
      ? new Date(fy - 1, 7, 1)
      : new Date(fy, 1, 1)
  const keys: string[] = []
  for (let i = 0; i < 6; i++) {
    keys.push(monthKey(addMonths(startOfMonth(start), i)))
  }
  return keys
}

/** FY quarter starts: Aug, Nov, Feb, May. */
export function isFiscalQuarterStart(monthKeyStr: string): boolean {
  const m = Number(monthKeyStr.slice(5, 7))
  return m === 2 || m === 5 || m === 8 || m === 11
}

/** FY half containing `d` (defaults to today). FY starts in August. */
export function fiscalHalfFromDate(d: Date = new Date()): FiscalHalf {
  const fy = fyYear(d)
  const half = fyHalf(d)
  return {
    fy,
    half,
    label: fyLabel(fy, half),
    months: monthsForHalf(fy, half),
  }
}

/** Twelve calendar months of a FY. Aug (fy-1) through Jul (fy). */
export function monthsForFiscalYear(fy: number): string[] {
  const start = new Date(fy - 1, 7, 1)
  const keys: string[] = []
  for (let i = 0; i < 12; i++) {
    keys.push(monthKey(addMonths(startOfMonth(start), i)))
  }
  return keys
}

export function fiscalRange(fy: number, mode: FiscalRangeMode): FiscalRange {
  if (mode === 'FY') {
    return { fy, mode, label: fyShortLabel(fy), months: monthsForFiscalYear(fy) }
  }
  return {
    fy,
    mode,
    label: fyLabel(fy, mode),
    months: monthsForHalf(fy, mode),
  }
}

/** Default range is the current FY half. Pass `FY` for the full year. */
export function fiscalRangeFromDate(
  d: Date = new Date(),
  mode?: FiscalRangeMode,
): FiscalRange {
  const fy = fyYear(d)
  return fiscalRange(fy, mode ?? fyHalf(d))
}

export function shiftFiscalRange(range: FiscalRange, steps: number): FiscalRange {
  if (range.mode === 'FY') return fiscalRange(range.fy + steps, 'FY')
  const ordinal = range.fy * 2 + (range.mode === 'SH' ? 1 : 0) + steps
  const fy = Math.floor(ordinal / 2)
  const mode: FiscalHalfId = ((ordinal % 2) + 2) % 2 === 0 ? 'FH' : 'SH'
  return fiscalRange(fy, mode)
}
