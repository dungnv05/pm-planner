import type { ActualWork, Assignment, Cycle, Member } from '../types'
import { memberActualByProject } from './actualWorkload'
import { formatPct, memberPlanInCycle } from './capacity'

export interface CycleCompareRow {
  memberId: string
  memberName: string
  planTotal: number
  actualTotal: number
  projects: {
    projectId: string
    plan: number
    actual: number
  }[]
}

export function compareCycle(
  cycle: Cycle,
  members: Member[],
  projectIds: string[],
  assignments: Assignment[],
  actualWork: ActualWork[],
): CycleCompareRow[] {
  const rows: CycleCompareRow[] = []

  for (const member of members) {
    const actualByProject = memberActualByProject(cycle.id, member.id, actualWork)
    const projects: CycleCompareRow['projects'] = []
    let planTotal = 0
    let actualTotal = 0

    const relevantProjects = new Set([
      ...projectIds.filter((pid) => {
        const plan = memberPlanInCycle(
          member.id,
          pid,
          cycle.startsAt,
          cycle.endsAt,
          assignments,
        )
        return plan > 0.001 || (actualByProject[pid] ?? 0) > 0
      }),
    ])

    for (const pid of relevantProjects) {
      const plan = memberPlanInCycle(
        member.id,
        pid,
        cycle.startsAt,
        cycle.endsAt,
        assignments,
      )
      const actual = actualByProject[pid] ?? 0
      if (plan < 0.001 && actual < 0.001) continue
      projects.push({ projectId: pid, plan, actual })
      planTotal += plan
      actualTotal += actual
    }

    if (projects.length === 0) continue
    rows.push({
      memberId: member.id,
      memberName: member.displayName || member.name,
      planTotal,
      actualTotal,
      projects,
    })
  }

  rows.sort((a, b) => a.memberName.localeCompare(b.memberName))
  return rows
}

export function formatCompare(plan: number, actual: number): string {
  const p = plan > 0.001 ? formatPct(plan) : '—'
  const a = actual > 0.001 ? formatPct(actual) : '—'
  return `Plan: ${p} · Actual: ${a}`
}
