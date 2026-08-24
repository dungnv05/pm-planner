import { useMemo, useState } from 'react'
import { loadLatestSnapshot } from '../lib/loadSnapshot'
import { RoadmapBoard } from '../components/RoadmapBoard'
import { CapacityLegend } from '../components/CapacityLegend'
import { ProjectStatusFilter, defaultSelectedStatuses } from '../components/ProjectStatusFilter'
import { MilestoneNameFilter } from '../components/MilestoneNameFilter'
import { AppShell } from '../layout/AppShell'
import {
  type FiscalRangeMode,
  fiscalRange,
  fiscalRangeFromDate,
  shiftFiscalRange,
} from '../lib/fiscalYear'
import { packRoadmapProjects, uniqueMilestoneNames } from '../lib/roadmap'
import { buildWindowWeeks, currentWeekMonday } from '../lib/dates'
import {
  ROADMAP_WEEK_COL_MAX,
  ROADMAP_WEEK_COL_MIN,
  ROADMAP_WEEK_COL_STEP,
  clampRoadmapWeekColW,
} from '../lib/timeline'

export function RoadmapPage() {
  const snapshot = loadLatestSnapshot()
  const todayWeek = currentWeekMonday()
  const [range, setRange] = useState(() => fiscalRangeFromDate(new Date(), 'FY'))
  const [centerNonce, setCenterNonce] = useState(0)
  const [weekColW, setWeekColW] = useState(ROADMAP_WEEK_COL_MIN)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() =>
    defaultSelectedStatuses(snapshot.projects ?? []),
  )
  const milestoneNames = useMemo(
    () => uniqueMilestoneNames(snapshot.projects ?? []),
    [snapshot.projects],
  )
  const [selectedNames, setSelectedNames] = useState<string[]>(() =>
    uniqueMilestoneNames(snapshot.projects ?? []),
  )

  const months = range.months
  const weeks = useMemo(
    () => buildWindowWeeks(`${months[0]}-01`, months.length),
    [months],
  )

  const projects = useMemo(() => {
    const list = (snapshot.projects ?? []).filter((p) => selectedStatuses.includes(p.status))
    const allowed = new Set(selectedNames)
    return packRoadmapProjects(list, weeks, allowed)
  }, [snapshot.projects, selectedStatuses, selectedNames, weeks])

  const zoomBy = (steps: number) => {
    setWeekColW((w) => clampRoadmapWeekColW(w + steps * ROADMAP_WEEK_COL_STEP))
  }

  const setMode = (mode: FiscalRangeMode) => {
    setRange(fiscalRange(range.fy, mode))
  }

  const goToday = () => {
    setRange(fiscalRangeFromDate(new Date(), range.mode === 'FY' ? 'FY' : undefined))
    setCenterNonce((n) => n + 1)
  }

  return (
    <AppShell
      title={`Roadmap · ${range.label}`}
      actions={
        <>
          <button type="button" className="btn" onClick={() => setRange(shiftFiscalRange(range, -1))}>
            ← Prev
          </button>
          <button type="button" className="btn" onClick={goToday}>
            Today
          </button>
          <button type="button" className="btn" onClick={() => setRange(shiftFiscalRange(range, 1))}>
            Next →
          </button>
          <div className="scale-toggle" role="group" aria-label="Zoom week width">
            <button
              type="button"
              className="btn"
              aria-label="Zoom out"
              disabled={weekColW <= ROADMAP_WEEK_COL_MIN}
              onClick={() => zoomBy(-1)}
            >
              −
            </button>
            <button
              type="button"
              className="btn"
              aria-label="Zoom in"
              disabled={weekColW >= ROADMAP_WEEK_COL_MAX}
              onClick={() => zoomBy(1)}
            >
              +
            </button>
          </div>
          <div className="scale-toggle" role="group" aria-label="Fiscal range">
            <button
              type="button"
              className={`btn ${range.mode === 'FH' ? 'btn-primary' : ''}`}
              onClick={() => setMode('FH')}
            >
              FH
            </button>
            <button
              type="button"
              className={`btn ${range.mode === 'SH' ? 'btn-primary' : ''}`}
              onClick={() => setMode('SH')}
            >
              SH
            </button>
            <button
              type="button"
              className={`btn ${range.mode === 'FY' ? 'btn-primary' : ''}`}
              onClick={() => setMode('FY')}
            >
              Full FY
            </button>
          </div>
          <ProjectStatusFilter
            projects={snapshot.projects ?? []}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
          />
          <MilestoneNameFilter
            names={milestoneNames}
            selected={selectedNames}
            onChange={setSelectedNames}
          />
        </>
      }
      footer={<CapacityLegend variant="roadmap" />}
    >
      <div className="roadmap-layout">
        <RoadmapBoard
          weeks={weeks}
          months={months}
          projects={projects}
          todayWeek={todayWeek}
          centerNonce={centerNonce}
          weekColW={weekColW}
          onWeekColWChange={setWeekColW}
        />
      </div>
    </AppShell>
  )
}
