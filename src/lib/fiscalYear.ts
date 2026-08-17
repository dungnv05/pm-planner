import { addMonths, monthKey, startOfMonth } from './dates'

export type FiscalHalfId = 'FH' | 'SH'

export interface FiscalHalf {
  /** Calendar year the FY ends in, e.g. 2027 for FY27. */
  fy: number
  half: FiscalHalfId
  /** e.g. FY27_FH */
  label: string
  /** Six YYYY-MM keys in order. */
  months: string[]
}

function fyYear(d: Date): number {
  return d.getMonth() >= 7 ? d.getFullYear() + 1 : d.getFullYear()
}

function fyHalf(d: Date): FiscalHalfId {
  const m = d.getMonth()
  return m >= 7 || m === 0 ? 'FH' : 'SH'
}

function fyLabel(fy: number, half: FiscalHalfId): string {
  return `FY${String(fy).slice(-2)}_` + half
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
