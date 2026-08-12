import type { ActualWork, Cycle } from '../types'

/** Equal-share actual % for member×project within a completed cycle. */
export function actualAllocationFor(
  cycleId: string,
  memberId: string,
  projectId: string,
  actualWork: ActualWork[],
): number {
  const memberProjects = actualWork.filter(
    (w) => w.cycleId === cycleId && w.memberId === memberId,
  )
  if (memberProjects.length === 0) return 0
  const hit = memberProjects.some((w) => w.projectId === projectId)
  if (!hit) return 0
  return 1 / memberProjects.length
}

/** Map projectId -> actual % for a member in a cycle. */
export function memberActualByProject(
  cycleId: string,
  memberId: string,
  actualWork: ActualWork[],
): Record<string, number> {
  const projects = actualWork.filter(
    (w) => w.cycleId === cycleId && w.memberId === memberId,
  )
  const n = projects.length
  const out: Record<string, number> = {}
  if (n === 0) return out
  for (const p of projects) {
    out[p.projectId] = 1 / n
  }
  return out
}

export function completedCycles(cycles: Cycle[]): Cycle[] {
  return cycles.filter((c) => c.isCompleted)
}

export function actualBarsForProject(
  projectId: string,
  cycle: Cycle,
  actualWork: ActualWork[],
): { memberId: string; allocation: number; issueCount: number }[] {
  if (!cycle.isCompleted) return []
  const rows = actualWork.filter(
    (w) => w.cycleId === cycle.id && w.projectId === projectId,
  )
  return rows.map((w) => ({
    memberId: w.memberId,
    allocation: actualAllocationFor(cycle.id, w.memberId, projectId, actualWork),
    issueCount: w.issueCount,
  }))
}
