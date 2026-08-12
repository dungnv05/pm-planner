import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Assignment, Member } from '../types'
import { formatPct } from '../lib/capacity'
import { firstMondayOfMonth, lastMondayInMonth } from '../lib/dates'
import {
  PLAN_BAR_H,
  type TimelineScale,
  colWidth,
  dateToColIndex,
} from '../lib/timeline'

interface Props {
  assignment: Assignment
  member?: Member
  weeks: string[]
  months: string[]
  scale: TimelineScale
  laneTop: number
  onMove: (id: string, startWeek: string, endWeek: string) => void
  onEdit: (assignment: Assignment) => void
  onRemove: (id: string) => void
}

export function AssignmentBar({
  assignment,
  member,
  weeks,
  months,
  scale,
  laneTop,
  onMove,
  onEdit,
  onRemove,
}: Props) {
  const cw = colWidth(scale)
  const start = dateToColIndex(assignment.startWeek, scale, weeks, months)
  const end = dateToColIndex(assignment.endWeek, scale, weeks, months)
  if (start < 0 || end < 0 || end < start) return null

  const left = start * cw
  const width = (end - start + 1) * cw - 4
  const label = member?.displayName || member?.name || 'Member'
  const cols = scale === 'week' ? weeks : months

  const snapColsToWeeks = (si: number, ei: number) => {
    if (scale === 'week') {
      return { startWeek: weeks[si], endWeek: weeks[ei] }
    }
    return {
      startWeek: firstMondayOfMonth(months[si]),
      endWeek: lastMondayInMonth(months[ei]),
    }
  }

  const onResize = (edge: 'left' | 'right', e: ReactPointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const originX = e.clientX
    const originStart = start
    const originEnd = end
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    const onMovePtr = (ev: PointerEvent) => {
      const delta = Math.round((ev.clientX - originX) / cw)
      if (edge === 'left') {
        const ns = Math.max(0, Math.min(originEnd, originStart + delta))
        const next = snapColsToWeeks(ns, originEnd)
        onMove(assignment.id, next.startWeek, next.endWeek)
      } else {
        const ne = Math.min(cols.length - 1, Math.max(originStart, originEnd + delta))
        const next = snapColsToWeeks(originStart, ne)
        onMove(assignment.id, next.startWeek, next.endWeek)
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMovePtr)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMovePtr)
    window.addEventListener('pointerup', onUp)
  }

  const onDragBar = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize')) return
    e.preventDefault()
    const originX = e.clientX
    const originStart = start
    const originEnd = end
    const span = originEnd - originStart
    const onMovePtr = (ev: PointerEvent) => {
      const delta = Math.round((ev.clientX - originX) / cw)
      let ns = originStart + delta
      let ne = ns + span
      if (ns < 0) {
        ns = 0
        ne = span
      }
      if (ne >= cols.length) {
        ne = cols.length - 1
        ns = ne - span
      }
      const next = snapColsToWeeks(ns, ne)
      onMove(assignment.id, next.startWeek, next.endWeek)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMovePtr)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMovePtr)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="assignment-bar"
      style={{ left, width, top: laneTop, height: PLAN_BAR_H }}
      title={`${label} · Plan ${formatPct(assignment.allocation)} (double-click to edit)`}
      onPointerDown={onDragBar}
      onDoubleClick={() => onEdit(assignment)}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') onRemove(assignment.id)
      }}
      tabIndex={0}
    >
      <span className="resize left" onPointerDown={(e) => onResize('left', e)} />
      <span className="bar-label">
        {label} · {formatPct(assignment.allocation)}
      </span>
      <button
        type="button"
        className="bar-remove"
        title="Remove plan"
        aria-label="Remove plan"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove(assignment.id)
        }}
      >
        ×
      </button>
      <span className="resize right" onPointerDown={(e) => onResize('right', e)} />
    </div>
  )
}
