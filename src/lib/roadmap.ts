import type { Project } from '../types'
import { parseISODate, startOfWeek, toISODate } from './dates'

export interface RoadmapMilestone {
  projectId: string
  projectName: string
  projectUrl: string
  projectStatus: string
  milestoneId: string
  name: string
  targetDate: string
  progress: string
  weekMonday: string
}

export interface ProjectRoadmap {
  projectId: string
  projectName: string
  projectUrl: string
  projectStatus: string
  lanes: RoadmapMilestone[][]
}

export type MilestoneTone = 'done' | 'overdue' | 'due-soon' | 'open'

const DUE_SOON_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function milestoneStatusTone(
  progress: string,
  targetDate: string,
  today: Date = new Date(),
): MilestoneTone {
  const n = Number.parseInt(progress, 10)
  const pct = Number.isNaN(n) ? 0 : n
  if (pct >= 100) return 'done'
  const target = startOfLocalDay(parseISODate(targetDate))
  const now = startOfLocalDay(today)
  const diffDays = Math.round((target.getTime() - now.getTime()) / DAY_MS)
  // Linear empty milestones report 0%. Past due with 0% → treat as completed.
  if (diffDays < 0) return pct <= 0 ? 'done' : 'overdue'
  if (diffDays <= DUE_SOON_DAYS) return 'due-soon'
  return 'open'
}

export function milestoneStatusLabel(tone: MilestoneTone): string {
  switch (tone) {
    case 'done':
      return 'Done'
    case 'overdue':
      return 'Overdue'
    case 'due-soon':
      return 'Due within 7 days'
    case 'open':
      return 'Open'
  }
}

/** Mon=0 … Sun=6 */
export function weekdayIndexMondayFirst(iso: string): number {
  const day = parseISODate(iso).getDay()
  return day === 0 ? 6 : day - 1
}

function packLanes(items: RoadmapMilestone[]): RoadmapMilestone[][] {
  const lanes: { weeks: Set<string>; items: RoadmapMilestone[] }[] = []
  const sorted = [...items].sort((a, b) => a.targetDate.localeCompare(b.targetDate))
  for (const item of sorted) {
    let placed = false
    for (const lane of lanes) {
      if (!lane.weeks.has(item.weekMonday)) {
        lane.weeks.add(item.weekMonday)
        lane.items.push(item)
        placed = true
        break
      }
    }
    if (!placed) {
      lanes.push({ weeks: new Set([item.weekMonday]), items: [item] })
    }
  }
  return lanes.map((l) => l.items)
}

export function uniqueMilestoneNames(projects: Project[]): string[] {
  const names = new Set<string>()
  for (const p of projects) {
    for (const m of p.milestones ?? []) {
      if (m.name) names.add(m.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function weekMondayOf(iso: string): string {
  return toISODate(startOfWeek(parseISODate(iso)))
}

/** Projects that have dated milestones in the given week window, packed so same-week marks stack. */
export function packRoadmapProjects(
  projects: Project[],
  weekMondays: string[],
  allowedNames?: Set<string>,
): ProjectRoadmap[] {
  const weekSet = new Set(weekMondays)
  const out: ProjectRoadmap[] = []

  for (const project of projects) {
    const items: RoadmapMilestone[] = []
    for (const m of project.milestones ?? []) {
      if (!m.targetDate) continue
      if (allowedNames && !allowedNames.has(m.name)) continue
      const weekMonday = weekMondayOf(m.targetDate)
      if (!weekSet.has(weekMonday)) continue
      items.push({
        projectId: project.id,
        projectName: project.name,
        projectUrl: project.url,
        projectStatus: project.status,
        milestoneId: m.id,
        name: m.name,
        targetDate: m.targetDate,
        progress: m.progress,
        weekMonday,
      })
    }
    if (items.length === 0) continue
    out.push({
      projectId: project.id,
      projectName: project.name,
      projectUrl: project.url,
      projectStatus: project.status,
      lanes: packLanes(items),
    })
  }

  return out
}
