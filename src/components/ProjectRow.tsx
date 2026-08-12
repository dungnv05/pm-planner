import type { ActualWork, Assignment, Cycle, Member, Project } from '../types'
import { AssignmentBar } from './AssignmentBar'
import { ActualWorkloadLayer } from './ActualWorkloadLayer'
import { firstMondayOfMonth } from '../lib/dates'
import {
  LANE_H,
  type TimelineScale,
  colWidth,
  memberLanesForProject,
} from '../lib/timeline'

interface Props {
  project: Project
  weeks: string[]
  months: string[]
  scale: TimelineScale
  members: Member[]
  assignments: Assignment[]
  cycles: Cycle[]
  actualWork: ActualWork[]
  onDropMember: (projectId: string, weekMonday: string, memberId: string) => void
  onMoveAssignment: (id: string, startWeek: string, endWeek: string) => void
  onEditAssignment: (assignment: Assignment) => void
  onRemoveAssignment: (id: string) => void
}

export function ProjectRow({
  project,
  weeks,
  months,
  scale,
  members,
  assignments,
  cycles,
  actualWork,
  onDropMember,
  onMoveAssignment,
  onEditAssignment,
  onRemoveAssignment,
}: Props) {
  const cols = scale === 'week' ? weeks : months
  const cw = colWidth(scale)
  const completedIds = new Set(cycles.filter((c) => c.isCompleted).map((c) => c.id))
  const nameOf = (id: string) => {
    const m = members.find((x) => x.id === id)
    return m?.displayName || m?.name || id
  }
  const lanes = memberLanesForProject(
    project.id,
    assignments,
    actualWork,
    completedIds,
    nameOf,
  )
  const projectAssignments = assignments.filter((a) => a.projectId === project.id)
  const dropLanes = lanes.length > 0 ? lanes : ['__empty__']

  const colFromClientX = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.max(0, Math.min(cols.length - 1, Math.floor(x / cw)))
  }

  return (
    <div className="project-block">
      <div className="project-heading">
        <div className="project-heading-label">
          <strong title={project.name}>{project.name}</strong>
          <span className="status">{project.status}</span>
        </div>
        <div className="project-heading-spacer" />
      </div>

      {dropLanes.map((memberId) => {
        const isEmpty = memberId === '__empty__'
        const memberAssignments = isEmpty
          ? []
          : projectAssignments.filter((a) => a.memberId === memberId)

        return (
          <div key={memberId} className="member-lane-row" style={{ height: LANE_H }}>
            <div className="lane-label">
              {isEmpty ? (
                <span className="lane-placeholder">Drop member here</span>
              ) : (
                nameOf(memberId)
              )}
            </div>
            <div
              className={`lane-track scale-${scale}`}
              style={{
                width: cols.length * cw,
                height: LANE_H,
                backgroundSize: `${cw}px 100%`,
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('drop-active')
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drop-active')}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('drop-active')
                const id = e.dataTransfer.getData('text/member-id')
                if (!id) return
                const idx = colFromClientX(e.clientX, e.currentTarget)
                const week =
                  scale === 'week' ? weeks[idx] : firstMondayOfMonth(months[idx])
                onDropMember(project.id, week, id)
              }}
            >
              {!isEmpty &&
                memberAssignments.map((a) => (
                  <AssignmentBar
                    key={a.id}
                    assignment={a}
                    member={members.find((m) => m.id === a.memberId)}
                    weeks={weeks}
                    months={months}
                    scale={scale}
                    laneTop={4}
                    onMove={onMoveAssignment}
                    onEdit={onEditAssignment}
                    onRemove={onRemoveAssignment}
                  />
                ))}
              {!isEmpty && (
                <ActualWorkloadLayer
                  projectId={project.id}
                  memberId={memberId}
                  cycles={cycles}
                  weeks={weeks}
                  months={months}
                  scale={scale}
                  laneTop={4}
                  members={members}
                  actualWork={actualWork}
                  assignments={assignments}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
