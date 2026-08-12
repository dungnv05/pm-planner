import type { ActualWork, Assignment, Cycle, Member, Project } from '../types'
import { formatMonthLabel, parseISODate } from '../lib/dates'
import { ProjectRow } from './ProjectRow'
import {
  type TimelineScale,
  colWidth,
  cycleColSpan,
} from '../lib/timeline'

interface Props {
  weeks: string[]
  months: string[]
  scale: TimelineScale
  projects: Project[]
  members: Member[]
  assignments: Assignment[]
  cycles: Cycle[]
  actualWork: ActualWork[]
  selectedMemberIds: string[]
  onDropMember: (projectId: string, weekMonday: string, memberId: string) => void
  onMoveAssignment: (id: string, startWeek: string, endWeek: string) => void
  onEditAssignment: (assignment: Assignment) => void
  onRemoveAssignment: (id: string) => void
  onSelectCycle: (cycle: Cycle) => void
}

export function TimelineBoard({
  weeks,
  months,
  scale,
  projects,
  members,
  assignments,
  cycles,
  actualWork,
  selectedMemberIds,
  onDropMember,
  onMoveAssignment,
  onEditAssignment,
  onRemoveAssignment,
  onSelectCycle,
}: Props) {
  const cols = scale === 'week' ? weeks : months
  const cw = colWidth(scale)

  const monthSpans: { key: string; start: number; span: number }[] = []
  if (scale === 'week') {
    for (let i = 0; i < weeks.length; i++) {
      const key = `${parseISODate(weeks[i]).getFullYear()}-${String(parseISODate(weeks[i]).getMonth() + 1).padStart(2, '0')}`
      const last = monthSpans[monthSpans.length - 1]
      if (last && last.key === key) last.span += 1
      else monthSpans.push({ key, start: i, span: 1 })
    }
  } else {
    for (let i = 0; i < months.length; i++) {
      monthSpans.push({ key: months[i], start: i, span: 1 })
    }
  }

  const cyclesInWindow = cycles.filter(
    (c) => cycleColSpan(c, scale, weeks, months) !== null,
  )

  return (
    <div className="board-wrap">
      <div className="board">
        <div className="board-header">
          <div />
          <div>
            <div
              className="month-row"
              style={{ gridTemplateColumns: `repeat(${cols.length}, ${cw}px)` }}
            >
              {monthSpans.map((m) => (
                <div
                  key={m.key}
                  className="month-cell"
                  style={{ gridColumn: `span ${m.span}` }}
                >
                  {formatMonthLabel(m.key)}
                </div>
              ))}
            </div>
            {scale === 'week' && (
              <div
                className="week-row"
                style={{ gridTemplateColumns: `repeat(${cols.length}, ${cw}px)` }}
              >
                {weeks.map((w) => (
                  <div key={w} className="week-cell">
                    {parseISODate(w).getDate()}
                  </div>
                ))}
              </div>
            )}
            <div style={{ position: 'relative', height: 24, marginBottom: 4, width: cols.length * cw }}>
              {cyclesInWindow.map((c) => {
                const span = cycleColSpan(c, scale, weeks, months)
                if (!span) return null
                const cls = c.isCurrent
                  ? 'current'
                  : c.isCompleted
                    ? 'completed'
                    : 'upcoming'
                return (
                  <div
                    key={c.id}
                    className={`cycle-band ${cls}`}
                    style={{
                      position: 'absolute',
                      left: span.start * cw,
                      width: (span.end - span.start + 1) * cw - 2,
                      top: 0,
                    }}
                    onClick={() => c.isCompleted && onSelectCycle(c)}
                    title={
                      c.isCompleted
                        ? `Cycle ${c.number} (completed) — click to compare`
                        : `Cycle ${c.number}`
                    }
                  >
                    C{c.number}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="empty-hint">No projects to show. Sync Linear data or toggle filters.</p>
        ) : (
          projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              weeks={weeks}
              months={months}
              scale={scale}
              members={members}
              assignments={assignments}
              cycles={cycles}
              actualWork={actualWork}
              selectedMemberIds={selectedMemberIds}
              onDropMember={onDropMember}
              onMoveAssignment={onMoveAssignment}
              onEditAssignment={onEditAssignment}
              onRemoveAssignment={onRemoveAssignment}
            />
          ))
        )}
      </div>
    </div>
  )
}
