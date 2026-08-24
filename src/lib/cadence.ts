import cadenceFile from '../../data/cadence.json'
import type {
  CadenceFile,
  CadenceItem,
  CadencePassId,
  CadenceProgress,
  CadenceScheduleSettings,
} from '../types'
import { generateReleaseItems } from './cadenceRelease'
import {
  atOrAfterTime,
  ictStamp,
  is2359,
  isLastSelectedWeekdayToday,
  loadCadenceSchedule,
  monthlyCycleKey,
  thisMonthDueDay,
  thisMonthT3,
} from './cadenceSchedule'
import { loadLatestSnapshot } from './loadSnapshot'

const STORAGE_KEY = 'pm-resource-planner:cadence-checks'

export const cadence = cadenceFile as CadenceFile

export function emptyCadenceProgress(): CadenceProgress {
  return { checked: {}, lastNotified: {}, lastResetDay: '' }
}

export function loadCadenceProgress(): CadenceProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyCadenceProgress()
    const parsed = JSON.parse(raw) as CadenceProgress
    if (!parsed || typeof parsed.checked !== 'object') return emptyCadenceProgress()
    return {
      checked: parsed.checked ?? {},
      lastNotified: parsed.lastNotified ?? {},
      lastResetDay: parsed.lastResetDay ?? '',
    }
  } catch {
    return emptyCadenceProgress()
  }
}

export function saveCadenceProgress(progress: CadenceProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function periodKeyFor(
  pass: CadencePassId,
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): string {
  const def = cadence.passes.find((p) => p.id === pass)
  switch (def?.reset) {
    case 'day':
      return ictStamp(now).dayKey
    case 'week':
      return ictWeekKey(now)
    case 'month':
      return monthlyCycleKey(settings.monthly, now)
    default:
      return 'sticky'
  }
}

/** ISO week from the ICT calendar date. */
export function ictWeekKey(now = new Date()): string {
  const { y, m, d } = ictStamp(now)
  const utc = Date.UTC(y, m - 1, d)
  const date = new Date(utc)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function ictDayKey(now = new Date()): string {
  return ictStamp(now).dayKey
}

export function ictMonthKey(now = new Date()): string {
  return ictStamp(now).monthKey
}

export function isItemChecked(
  item: CadenceItem,
  progress: CadenceProgress,
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): boolean {
  const stored = progress.checked[item.id]
  if (!stored) return false
  if (item.pass === 'release') return stored === 'sticky'
  return stored === periodKeyFor(item.pass, now, settings)
}

export function visibleCadenceItems(
  now = new Date(),
  projects = loadLatestSnapshot().projects ?? [],
): CadenceItem[] {
  const today = ictStamp(now).dayKey
  const release = generateReleaseItems(projects, today)
  return [...cadence.items.filter((i) => i.pass !== 'release'), ...release]
}

export function itemsForPass(
  pass: CadencePassId | 'all',
  now = new Date(),
): CadenceItem[] {
  const all = visibleCadenceItems(now)
  if (pass === 'all') return all
  return all.filter((i) => i.pass === pass)
}

export function passStats(
  pass: CadencePassId,
  progress: CadenceProgress,
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): { done: number; total: number } {
  const items = itemsForPass(pass, now)
  const done = items.filter((i) => isItemChecked(i, progress, now, settings)).length
  return { done, total: items.length }
}

export function clearPassChecks(
  progress: CadenceProgress,
  pass: CadencePassId,
  now = new Date(),
): CadenceProgress {
  const next: CadenceProgress = {
    ...progress,
    checked: { ...progress.checked },
    lastNotified: { ...(progress.lastNotified ?? {}) },
  }
  for (const item of itemsForPass(pass, now)) {
    delete next.checked[item.id]
  }
  return next
}

export function applyScheduledResets(
  progress: CadenceProgress,
  settings: CadenceScheduleSettings,
  now = new Date(),
): CadenceProgress {
  const stamp = ictStamp(now)
  let next: CadenceProgress = {
    ...progress,
    checked: { ...progress.checked },
    lastNotified: { ...(progress.lastNotified ?? {}) },
  }

  if (is2359(stamp) && next.lastResetDay !== stamp.dayKey) {
    next = clearPassChecks(next, 'daily', now)
    if (isLastSelectedWeekdayToday(settings.weekly.weekdays, now)) {
      next = clearPassChecks(next, 'weekly', now)
    }
    const today = stamp.dayKey
    for (const item of itemsForPass('release', now)) {
      if (item.t0Date && item.t0Date < today) {
        delete next.checked[item.id]
      }
    }
    next.lastResetDay = stamp.dayKey
  }

  return next
}

export type CadenceNotifyEvent = 'daily' | 'weekly' | 'monthly-t3' | 'monthly-due' | 'release'

export function dueNotifyEvents(
  progress: CadenceProgress,
  settings: CadenceScheduleSettings,
  now = new Date(),
): CadenceNotifyEvent[] {
  const stamp = ictStamp(now)
  const events: CadenceNotifyEvent[] = []

  if (
    settings.daily.weekdays.includes(stamp.weekday) &&
    atOrAfterTime(stamp, settings.daily.time)
  ) {
    const items = itemsForPass('daily', now)
    if (items.some((i) => !isItemChecked(i, progress, now, settings))) {
      events.push('daily')
    }
    const releaseDue = itemsForPass('release', now).filter(
      (i) => i.dueDate === stamp.dayKey && !isItemChecked(i, progress, now, settings),
    )
    if (releaseDue.length) events.push('release')
  }

  if (
    settings.weekly.weekdays.includes(stamp.weekday) &&
    atOrAfterTime(stamp, settings.weekly.time)
  ) {
    const items = itemsForPass('weekly', now)
    if (items.some((i) => !isItemChecked(i, progress, now, settings))) {
      events.push('weekly')
    }
  }

  const t3 = thisMonthT3(settings.monthly, now)
  const due = thisMonthDueDay(settings.monthly, now)
  if (stamp.dayKey === t3 && atOrAfterTime(stamp, settings.monthly.time)) {
    const items = itemsForPass('monthly', now)
    if (items.some((i) => !isItemChecked(i, progress, now, settings))) {
      events.push('monthly-t3')
    }
  } else if (stamp.dayKey === due && atOrAfterTime(stamp, settings.monthly.time)) {
    const items = itemsForPass('monthly', now)
    if (items.some((i) => !isItemChecked(i, progress, now, settings))) {
      events.push('monthly-due')
    }
  }

  return events
}

export function markNotified(
  progress: CadenceProgress,
  events: CadenceNotifyEvent[],
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): CadenceProgress {
  const lastNotified = { ...(progress.lastNotified ?? {}) }
  for (const event of events) {
    lastNotified[event] = notifyKey(event, now, settings)
  }
  return { ...progress, lastNotified }
}

export function notifyKey(
  event: CadenceNotifyEvent,
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): string {
  const stamp = ictStamp(now)
  switch (event) {
    case 'daily':
    case 'release':
      return stamp.dayKey
    case 'weekly':
      return ictWeekKey(now)
    case 'monthly-t3':
    case 'monthly-due':
      return `${monthlyCycleKey(settings.monthly, now)}:${event}`
  }
}

export function unreadNotifyEvents(
  progress: CadenceProgress,
  events: CadenceNotifyEvent[],
  now = new Date(),
  settings: CadenceScheduleSettings = loadCadenceSchedule(),
): CadenceNotifyEvent[] {
  const last = progress.lastNotified ?? {}
  return events.filter((e) => last[e] !== notifyKey(e, now, settings))
}

export function dueBannerPasses(
  progress: CadenceProgress,
  settings: CadenceScheduleSettings,
  now = new Date(),
): CadencePassId[] {
  const events = dueNotifyEvents(progress, settings, now)
  const passes: CadencePassId[] = []
  if (events.includes('daily')) passes.push('daily')
  if (events.includes('weekly')) passes.push('weekly')
  if (events.includes('monthly-t3') || events.includes('monthly-due')) {
    passes.push('monthly')
  }
  if (events.includes('release')) passes.push('release')
  return passes
}

const EVENT_LABEL: Record<CadenceNotifyEvent, string> = {
  daily: 'Daily Notion cadence',
  weekly: 'Weekly Notion cadence',
  'monthly-t3': 'Monthly cadence (T-3) — reset last month, work this month',
  'monthly-due': 'Monthly Notion cadence due',
  release: 'Release window tasks due',
}

export function notifyCadenceEvents(events: CadenceNotifyEvent[]): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (events.length === 0) return
  const body = events.map((e) => EVENT_LABEL[e]).join('\n')
  new Notification('EVN cadence', { body })
}
