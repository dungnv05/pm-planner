import { useEffect, useRef, useState } from 'react'
import type { ActualWork, Assignment, Cycle, Member, Project } from '../types'
import { formatMonthLabel, parseISODate } from '../lib/dates'
import { isFiscalQuarterStart } from '../lib/fiscalYear'
import {
  holidayGroupsInWindow,
  holidaysInWindow,
  holidayTooltip,
} from '../lib/holidays'
import { ProjectRow } from './ProjectRow'
import {
  type TimelineScale,
  colWidth,
  cycleColSpan,
  fiscalQuarterColIndexes,
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
  memberFilterActive: boolean
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
  memberFilterActive,
  onDropMember,
  onMoveAssignment,
  onEditAssignment,
  onRemoveAssignment,
  onSelectCycle,
}: Props) {
  const cols = scale === 'week' ? weeks : months
  const cw = colWidth(scale)
  const trackWidth = cols.length * cw
  const quarterCols = fiscalQuarterColIndexes(scale, weeks, months)
  const holidaySpans = holidaysInWindow(scale, weeks, months)
  const holidayGroups = holidayGroupsInWindow(scale, weeks, months)
  const [openHolidayCol, setOpenHolidayCol] = useState<number | null>(null)
  const holidayRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openHolidayCol === null) return
    const onDown = (e: MouseEvent) => {
      if (holidayRowRef.current && !holidayRowRef.current.contains(e.target as Node)) {
        setOpenHolidayCol(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenHolidayCol(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openHolidayCol])

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
        <div className="board-overlays" style={{ width: trackWidth }} aria-hidden>
          {holidaySpans.map(({ holiday, span }) => (
            <div
              key={`wash-${holiday.id}`}
              className={`holiday-wash holiday-${holiday.country.toLowerCase()}`}
              style={{
                left: span.start * cw,
                width: (span.end - span.start + 1) * cw,
              }}
            />
          ))}
          {quarterCols.map((col) => (
            <div
              key={`q-${col}`}
              className="quarter-line"
              style={{ left: col * cw }}
            />
          ))}
        </div>
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
                  className={`month-cell${isFiscalQuarterStart(m.key) ? ' quarter-start' : ''}`}
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
                {weeks.map((w, i) => (
                  <div
                    key={w}
                    className={`week-cell${quarterCols.includes(i) ? ' quarter-start' : ''}`}
                  >
                    {parseISODate(w).getDate()}
                  </div>
                ))}
              </div>
            )}
            <div className="cycle-row-wrap" style={{ width: trackWidth }}>
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
                      left: span.start * cw,
                      width: (span.end - span.start + 1) * cw - 2,
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
            <div className="holiday-row-wrap" ref={holidayRowRef} style={{ width: trackWidth }}>
              {holidayGroups.map(({ col, holidays: group }) => {
                const countries = new Set(group.map((h) => h.country))
                const countryClass =
                  countries.size > 1
                    ? 'holiday-both'
                    : `holiday-${[...countries][0].toLowerCase()}`
                const open = openHolidayCol === col
                return (
                  <div
                    key={`h-${col}`}
                    className={`holiday-band ${countryClass}`}
                    style={{
                      left: col * cw,
                      width: cw - 2,
                    }}
                  >
                    <span className="holiday-band-label">Holidays</span>
                    <button
                      type="button"
                      className="holiday-q"
                      aria-label="Show holiday names"
                      aria-expanded={open}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenHolidayCol(open ? null : col)
                      }}
                    >
                      ?
                    </button>
                    {open && (
                      <div className="holiday-tooltip" role="tooltip">
                        {group.map((h) => (
                          <p key={h.id}>{holidayTooltip(h)}</p>
                        ))}
                      </div>
                    )}
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
              memberFilterActive={memberFilterActive}
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
