import type { ActualWork, Assignment, Cycle, Member } from '../types'
import { actualAllocationFor } from '../lib/actualWorkload'
import { formatPct, memberPlanInCycle } from '../lib/capacity'
import {
  actualVsPlanColor,
  actualVsPlanLabel,
  actualVsPlanTone,
  formatCompare,
} from '../lib/comparePlanActual'
import {
  ACTUAL_BAR_H,
  PLAN_BAR_H,
  type TimelineScale,
  colWidth,
  cycleColSpan,
} from '../lib/timeline'

interface Props {
  projectId: string
  memberId: string
  cycles: Cycle[]
  weeks: string[]
  months: string[]
  scale: TimelineScale
  laneTop: number
  members: Member[]
  actualWork: ActualWork[]
  assignments: Assignment[]
}

export function ActualWorkloadLayer({
  projectId,
  memberId,
  cycles,
  weeks,
  months,
  scale,
  laneTop,
  members,
  actualWork,
  assignments,
}: Props) {
  const completed = cycles.filter((c) => c.isCompleted)
  const member = members.find((m) => m.id === memberId)
  const name = member?.displayName || member?.name || 'Member'
  const cw = colWidth(scale)
  const top = laneTop + PLAN_BAR_H + 2

  return (
    <>
      {completed.map((cycle) => {
        const alloc = actualAllocationFor(cycle.id, memberId, projectId, actualWork)
        if (alloc <= 0) return null

        const span = cycleColSpan(cycle, scale, weeks, months)
        if (!span) return null

        const left = span.start * cw + 1
        const width = Math.max((span.end - span.start + 1) * cw - 4, cw / 2)
        const issueCount =
          actualWork.find(
            (w) =>
              w.cycleId === cycle.id &&
              w.memberId === memberId &&
              w.projectId === projectId,
          )?.issueCount ?? 0
        const plan = memberPlanInCycle(
          memberId,
          projectId,
          cycle.startsAt,
          cycle.endsAt,
          assignments,
        )
        const tone = actualVsPlanTone(plan, alloc)
        const color = actualVsPlanColor(tone)

        return (
          <div
            key={`${cycle.id}-${memberId}`}
            className={`actual-bar tone-${tone}`}
            style={{
              left,
              width,
              top,
              height: ACTUAL_BAR_H,
              backgroundColor: color,
              borderColor: color,
            }}
            title={`${name} · Cycle ${cycle.number} · ${formatCompare(plan, alloc)} · ${actualVsPlanLabel(tone)} · ${issueCount} issues`}
          >
            <span className="bar-label">
              C{cycle.number} · {formatPct(alloc)}
            </span>
          </div>
        )
      })}
    </>
  )
}
