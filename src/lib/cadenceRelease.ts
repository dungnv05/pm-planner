import cadenceFile from '../../data/cadence.json'
import type { CadenceFile, CadenceItem, Project } from '../types'
import { holidays } from './holidays'
import { milestoneStatusTone } from './roadmap'

const RELEASE_NAME_RE = /release|go-?live|\bship\b/i

function addCalendarDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function isoWeekdayMon1(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return dow === 0 ? 7 : dow
}

export function isVnHolidayIso(iso: string): boolean {
  return holidays.some((h) => h.country === 'VN' && iso >= h.start && iso <= h.end)
}

export function isBusinessDayIso(iso: string): boolean {
  const wd = isoWeekdayMon1(iso)
  if (wd >= 6) return false
  return !isVnHolidayIso(iso)
}

export function subtractBusinessDays(iso: string, n: number): string {
  if (n <= 0) return iso
  let cursor = iso
  let left = n
  while (left > 0) {
    cursor = addCalendarDaysIso(cursor, -1)
    if (isBusinessDayIso(cursor)) left -= 1
  }
  return cursor
}

export function generateReleaseItems(projects: Project[], todayIso: string): CadenceItem[] {
  const templates = (cadenceFile as CadenceFile).releaseTemplates ?? []
  const out: CadenceItem[] = []

  for (const project of projects) {
    if (project.statusType === 'completed' || project.statusType === 'canceled') continue
    for (const milestone of project.milestones ?? []) {
      if (!milestone.targetDate) continue
      if (!RELEASE_NAME_RE.test(milestone.name)) continue
      const pct = Number.parseInt(milestone.progress, 10)
      if (!Number.isNaN(pct) && pct >= 100) continue
      if (milestoneStatusTone(milestone.progress, milestone.targetDate) === 'done') continue

      const t0 = milestone.targetDate
      if (t0 < todayIso) continue

      for (const template of templates) {
        const dueDate = subtractBusinessDays(t0, template.offset)
        if (dueDate > t0) continue
        if (todayIso < dueDate) continue
        out.push({
          id: `release-${project.id}-${milestone.id}-t${template.offset}`,
          pass: 'release',
          doc: template.doc,
          href: project.url || template.href,
          title: `${template.title} · ${project.name}`,
          what: `${milestone.name} (${t0}). ${template.what}`,
          fields: template.fields,
          dueDate,
          t0Date: t0,
          offset: template.offset,
          projectName: project.name,
          milestoneName: milestone.name,
        })
      }
    }
  }

  return out.sort((a, b) => {
    const da = a.dueDate ?? ''
    const db = b.dueDate ?? ''
    if (da !== db) return da.localeCompare(db)
    return (a.offset ?? 0) - (b.offset ?? 0)
  })
}

export function releaseItemsDueToday(items: CadenceItem[], todayIso: string): CadenceItem[] {
  return items.filter((i) => i.dueDate === todayIso)
}
