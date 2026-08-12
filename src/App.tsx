import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import snapshotData from '../data/linear-snapshot.json'
import assignmentsSeed from '../data/assignments.json'
import type { Assignment, AssignmentsFile, LinearSnapshot, Member, Project } from './types'
import { MemberPool } from './components/MemberPool'
import { TimelineBoard } from './components/TimelineBoard'
import { AllocationPicker } from './components/AllocationPicker'
import { CapacityLegend } from './components/CapacityLegend'
import { CycleComparePanel } from './components/CycleCompareTooltip'
import { buildCapacityMap } from './lib/capacity'
import {
  addMonths,
  buildWindowMonths,
  buildWindowWeeks,
  defaultWindowStart,
  monthKey,
  toISODate,
  startOfMonth,
  parseISODate,
} from './lib/dates'
import type { TimelineScale } from './lib/timeline'
import {
  emptyAssignments,
  exportAssignmentsJson,
  importAssignmentsJson,
  loadAssignmentsFromStorage,
  saveAssignmentsToStorage,
} from './lib/storage'
import type { Cycle } from './types'
import './styles/app.css'

function uid(): string {
  return crypto.randomUUID()
}

export default function App() {
  const snapshot = snapshotData as LinearSnapshot
  const seed = assignmentsSeed as AssignmentsFile

  const [assignmentsFile, setAssignmentsFile] = useState<AssignmentsFile>(() =>
    loadAssignmentsFromStorage(
      seed.assignments?.length
        ? seed
        : { ...emptyAssignments(), windowStart: seed.windowStart || defaultWindowStart() },
    ),
  )
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [scale, setScale] = useState<TimelineScale>('week')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [pendingDrop, setPendingDrop] = useState<{
    memberId: string
    projectId: string
    week: string
    editId?: string
    initial?: number
  } | null>(null)
  const [compareCycle, setCompareCycle] = useState<Cycle | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const MONTH_COUNT = 12
  const windowStart = assignmentsFile.windowStart || defaultWindowStart()
  const weeks = useMemo(() => buildWindowWeeks(windowStart, MONTH_COUNT), [windowStart])
  const months = useMemo(() => buildWindowMonths(windowStart, MONTH_COUNT), [windowStart])
  const focusMonth = useMemo(() => {
    const current = monthKey(new Date())
    if (months.includes(current)) return current
    return months[Math.floor(months.length / 2)] ?? current
  }, [months])

  const members: Member[] = snapshot.members ?? []
  const projects: Project[] = useMemo(() => {
    const list = snapshot.projects ?? []
    if (showAllProjects) return list
    return list.filter((p) => p.statusType !== 'completed' && p.statusType !== 'canceled')
  }, [snapshot.projects, showAllProjects])

  const capacityMap = useMemo(
    () => buildCapacityMap(
      members.map((m) => m.id),
      months,
      assignmentsFile.assignments,
    ),
    [members, months, assignmentsFile.assignments],
  )

  const capacityFocus = useMemo(() => {
    const out: Record<string, number> = {}
    for (const m of members) out[m.id] = capacityMap[m.id]?.[focusMonth] ?? 0
    return out
  }, [members, capacityMap, focusMonth])

  useEffect(() => {
    saveAssignmentsToStorage(assignmentsFile)
  }, [assignmentsFile])

  const updateAssignments = useCallback((updater: (prev: Assignment[]) => Assignment[]) => {
    setAssignmentsFile((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      assignments: updater(prev.assignments),
    }))
  }, [])

  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id)
    return m?.displayName || m?.name || id
  }
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name
    ?? snapshot.projects.find((p) => p.id === id)?.name
    ?? id

  const shiftWindow = (monthsDelta: number) => {
    const next = toISODate(startOfMonth(addMonths(parseISODate(windowStart), monthsDelta)))
    setAssignmentsFile((prev) => ({ ...prev, windowStart: next }))
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>PM Resource Planner</h1>
          <div className="meta">
            {snapshot.team?.name ?? 'ENPRVN'} · synced{' '}
            {snapshot.syncedAt
              ? new Date(snapshot.syncedAt).toLocaleString()
              : 'never — run linear-enprvn-sync skill'}
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => shiftWindow(-1)}>
            ← Prev
          </button>
          <button type="button" className="btn" onClick={() => shiftWindow(1)}>
            Next →
          </button>
          <div className="scale-toggle" role="group" aria-label="Timeline scale">
            <button
              type="button"
              className={`btn ${scale === 'week' ? 'btn-primary' : ''}`}
              onClick={() => setScale('week')}
            >
              By week
            </button>
            <button
              type="button"
              className={`btn ${scale === 'month' ? 'btn-primary' : ''}`}
              onClick={() => setScale('month')}
            >
              By month
            </button>
          </div>
          <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={showAllProjects}
              onChange={(e) => setShowAllProjects(e.target.checked)}
            />
            Show completed
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => exportAssignmentsJson(assignmentsFile)}
          >
            Export
          </button>
          <button type="button" className="btn" onClick={() => importRef.current?.click()}>
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const data = await importAssignmentsJson(file)
                setAssignmentsFile(data)
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Import failed')
              }
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <div className="layout">
        <MemberPool
          members={members}
          focusMonth={focusMonth}
          capacityByMember={capacityFocus}
          selectedMemberIds={selectedMemberIds}
          onToggleMember={(id) => {
            setSelectedMemberIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }}
          onClearFilter={() => setSelectedMemberIds([])}
          onDragStart={() => undefined}
        />
        <TimelineBoard
          weeks={weeks}
          months={months}
          scale={scale}
          projects={projects}
          members={members}
          assignments={assignmentsFile.assignments}
          cycles={snapshot.cycles ?? []}
          actualWork={snapshot.actualWork ?? []}
          selectedMemberIds={selectedMemberIds}
          onDropMember={(projectId, week, memberId) => {
            setPendingDrop({ memberId, projectId, week, initial: 1 })
          }}
          onMoveAssignment={(id, startWeek, endWeek) => {
            updateAssignments((list) =>
              list.map((a) => (a.id === id ? { ...a, startWeek, endWeek } : a)),
            )
          }}
          onEditAssignment={(a) => {
            setPendingDrop({
              memberId: a.memberId,
              projectId: a.projectId,
              week: a.startWeek,
              editId: a.id,
              initial: a.allocation,
            })
          }}
          onRemoveAssignment={(id) => {
            updateAssignments((list) => list.filter((a) => a.id !== id))
          }}
          onSelectCycle={setCompareCycle}
        />
      </div>

      <CapacityLegend />

      {pendingDrop && (
        <AllocationPicker
          memberName={memberName(pendingDrop.memberId)}
          projectName={projectName(pendingDrop.projectId)}
          initial={pendingDrop.initial}
          onCancel={() => setPendingDrop(null)}
          onConfirm={(allocation) => {
            if (pendingDrop.editId) {
              updateAssignments((list) =>
                list.map((a) =>
                  a.id === pendingDrop.editId ? { ...a, allocation } : a,
                ),
              )
            } else {
              const weekIdx = weeks.indexOf(pendingDrop.week)
              const endWeek =
                weekIdx >= 0
                  ? weeks[Math.min(weekIdx + (scale === 'month' ? 3 : 3), weeks.length - 1)]
                  : pendingDrop.week
              const next: Assignment = {
                id: uid(),
                memberId: pendingDrop.memberId,
                projectId: pendingDrop.projectId,
                startWeek: pendingDrop.week,
                endWeek,
                allocation,
              }
              updateAssignments((list) => [...list, next])
            }
            setPendingDrop(null)
          }}
        />
      )}

      {compareCycle && (
        <CycleComparePanel
          cycle={compareCycle}
          members={members}
          projects={snapshot.projects}
          assignments={assignmentsFile.assignments}
          actualWork={snapshot.actualWork ?? []}
          onClose={() => setCompareCycle(null)}
        />
      )}
    </div>
  )
}
