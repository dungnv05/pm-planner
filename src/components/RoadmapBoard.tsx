import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatMonthLabel, parseISODate } from '../lib/dates'
import { isFiscalQuarterStart } from '../lib/fiscalYear'
import {
  milestoneStatusLabel,
  milestoneStatusTone,
  weekdayIndexMondayFirst,
  type ProjectRoadmap,
} from '../lib/roadmap'
import { HolidayBands, HolidayWashes } from './HolidayOverlay'
import {
  LANE_H,
  ROADMAP_WEEK_COL_WHEEL_STEP,
  clampRoadmapWeekColW,
  fiscalQuarterColIndexes,
} from '../lib/timeline'

const DIAMOND = 12

interface Props {
  weeks: string[]
  months: string[]
  projects: ProjectRoadmap[]
  todayWeek: string
  centerNonce: number
  weekColW: number
  onWeekColWChange: (next: number) => void
}

export function RoadmapBoard({
  weeks,
  months,
  projects,
  todayWeek,
  centerNonce,
  weekColW,
  onWeekColWChange,
}: Props) {
  const cw = weekColW
  const trackWidth = weeks.length * cw
  const quarterCols = fiscalQuarterColIndexes('week', weeks, months)
  const todayCol = weeks.indexOf(todayWeek)
  const wrapRef = useRef<HTMLDivElement>(null)
  const prevCw = useRef(cw)
  const wheelAnchor = useRef<{ pointerInWrap: number; contentAnchor: number } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const monthSpans: { key: string; start: number; span: number }[] = []
  for (let i = 0; i < weeks.length; i++) {
    const key = `${parseISODate(weeks[i]).getFullYear()}-${String(parseISODate(weeks[i]).getMonth() + 1).padStart(2, '0')}`
    const last = monthSpans[monthSpans.length - 1]
    if (last && last.key === key) last.span += 1
    else monthSpans.push({ key, start: i, span: 1 })
  }

  const weekIndex = (monday: string) => weeks.indexOf(monday)

  const trackOrigin = (el: HTMLElement) => {
    const styles = getComputedStyle(el)
    const labelW = Number.parseFloat(styles.getPropertyValue('--label-w')) || 220
    const padLeft = Number.parseFloat(styles.paddingLeft) || 0
    return padLeft + labelW
  }

  useLayoutEffect(() => {
    if (centerNonce === 0) return
    const el = wrapRef.current
    if (!el || todayCol < 0) return
    const origin = trackOrigin(el)
    const target = origin + todayCol * cw + cw / 2 - el.clientWidth / 2
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [centerNonce, todayCol, cw, weeks])

  useLayoutEffect(() => {
    const el = wrapRef.current
    const old = prevCw.current
    if (!el || old === cw) return
    const ratio = cw / old
    const origin = trackOrigin(el)
    const pointerInWrap = wheelAnchor.current?.pointerInWrap ?? el.clientWidth / 2
    const contentAnchor =
      wheelAnchor.current?.contentAnchor ?? el.scrollLeft + pointerInWrap - origin
    el.scrollLeft = origin + contentAnchor * ratio - pointerInWrap
    wheelAnchor.current = null
    prevCw.current = cw
  }, [cw])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const horizontal = e.shiftKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)
      if (horizontal) return
      e.preventDefault()
      const dir = e.deltaY > 0 ? -1 : 1
      const next = clampRoadmapWeekColW(cw + dir * ROADMAP_WEEK_COL_WHEEL_STEP)
      if (next === cw) return
      const origin = trackOrigin(el)
      const pointerInWrap = e.clientX - el.getBoundingClientRect().left
      wheelAnchor.current = {
        pointerInWrap,
        contentAnchor: el.scrollLeft + pointerInWrap - origin,
      }
      onWeekColWChange(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [cw, onWeekColWChange])

  useEffect(() => {
    if (openId === null) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('.milestone-wrap')) return
      setOpenId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openId])

  return (
    <div
      ref={wrapRef}
      className="board-wrap roadmap-board"
      style={{ ['--week-w' as string]: `${cw}px` }}
    >
      <div className="board">
        <div className="board-overlays" style={{ width: trackWidth }} aria-hidden>
          {todayCol >= 0 && (
            <div
              className="today-wash"
              style={{ left: todayCol * cw, width: cw }}
            />
          )}
          <HolidayWashes weeks={weeks} months={months} scale="week" colWidthPx={cw} />
          {quarterCols.map((col) => (
            <div
              key={`q-${col}`}
              className="quarter-line"
              style={{ left: col * cw }}
            />
          ))}
        </div>
        <div className="board-header">
          <div className="board-header-gutter" />
          <div>
            <div
              className="month-row"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, ${cw}px)` }}
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
            <div
              className="week-row"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, ${cw}px)` }}
            >
              {weeks.map((w, i) => (
                <div
                  key={w}
                  className={`week-cell${quarterCols.includes(i) ? ' quarter-start' : ''}${w === todayWeek ? ' today' : ''}`}
                >
                  {parseISODate(w).getDate()}
                </div>
              ))}
            </div>
            <HolidayBands weeks={weeks} months={months} scale="week" colWidthPx={cw} />
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="empty-hint">
            No dated milestones in this range. Sync Linear projects or toggle filters.
          </p>
        ) : (
          projects.map((project) => (
            <div key={project.projectId} className={`project-block${project.lanes.some((lane) => lane.some((m) => m.milestoneId === openId)) ? ' tooltip-open' : ''}`}>
              <div className="project-heading">
                <div className="project-heading-label">
                  <strong title={project.projectName}>{project.projectName}</strong>
                  <span className="status">{project.projectStatus}</span>
                </div>
                <div className="project-heading-spacer" />
              </div>
              {project.lanes.map((lane, laneIdx) => (
                <div
                  key={`${project.projectId}-${laneIdx}`}
                  className={`member-lane-row${lane.some((m) => m.milestoneId === openId) ? ' tooltip-open' : ''}`}
                  style={{ height: LANE_H }}
                >
                  <div className="lane-label">
                    {laneIdx === 0 ? 'Milestones' : ''}
                  </div>
                  <div
                    className="lane-track scale-week"
                    style={{
                      width: trackWidth,
                      height: LANE_H,
                      backgroundSize: `${cw}px 100%`,
                    }}
                  >
                    {lane.map((m) => {
                      const col = weekIndex(m.weekMonday)
                      if (col < 0) return null
                      const day = weekdayIndexMondayFirst(m.targetDate)
                      const tone = milestoneStatusTone(m.progress, m.targetDate)
                      const center = col * cw + ((day + 0.5) / 7) * cw
                      const open = openId === m.milestoneId
                      return (
                        <div
                          key={m.milestoneId}
                          className={`milestone-wrap${open ? ' open' : ''}`}
                          style={{
                            left: center - DIAMOND / 2,
                            top: (LANE_H - DIAMOND) / 2,
                          }}
                        >
                          <button
                            type="button"
                            className={`milestone-mark tone-${tone}`}
                            aria-expanded={open}
                            aria-label={`${m.projectName} · ${m.name}`}
                            onClick={() => setOpenId(open ? null : m.milestoneId)}
                          />
                          {open && (
                            <div className="milestone-tooltip" role="dialog">
                              <p className="milestone-tooltip-name">{m.name}</p>
                              <p>{m.projectName}</p>
                              <p>
                                {m.targetDate} · {m.progress} · {milestoneStatusLabel(tone)}
                              </p>
                              <a
                                className="btn btn-primary milestone-linear-link"
                                href={m.projectUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open in Linear
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
