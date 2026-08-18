import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import assignmentsSeed from '../../data/assignments.json'
import type { Assignment, AssignmentsFile, Member, Project } from '../types'
import { loadLatestSnapshot } from '../lib/loadSnapshot'
import { MemberPool } from '../components/MemberPool'
import { TimelineBoard } from '../components/TimelineBoard'
import { AllocationPicker } from '../components/AllocationPicker'
import { CapacityLegend } from '../components/CapacityLegend'
import { CycleComparePanel } from '../components/CycleCompareTooltip'
import { ProjectStatusFilter, defaultSelectedStatuses } from '../components/ProjectStatusFilter'
import { AppShell } from '../layout/AppShell'
import { buildHalfCapacityMap } from '../lib/capacity'
import { fiscalHalfFromDate } from '../lib/fiscalYear'
import {
  addMonths,
  buildWindowMonths,
  buildWindowWeeks,
  defaultWindowStart,
  toISODate,
  startOfMonth,
  parseISODate,
} from '../lib/dates'
import type { TimelineScale } from '../lib/timeline'
import {
  emptyAssignments,
  exportAssignmentsJson,
  importAssignmentsJson,
  loadAssignmentsFromStorage,
  saveAssignmentsToStorage,
} from '../lib/storage'
import type { Cycle } from '../types'

function uid(): string {
  return crypto.randomUUID()
}

export function PlannerPage() {
  const snapshot = loadLatestSnapshot()
  const seed = assignmentsSeed as AssignmentsFile

  const [assignmentsFile, setAssignmentsFile] = useState<AssignmentsFile>(() =>
    loadAssignmentsFromStorage(
      seed.assignments?.length
        ? seed
        : { ...emptyAssignments(), windowStart: seed.windowStart || defaultWindowStart() },
    ),
  )
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() =>
    defaultSelectedStatuses(snapshot.projects ?? []),
  )
  const [scale, setScale] = useState<TimelineScale>('week')
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[]>(() =>
    (snapshot.members ?? []).filter((m) => m.active).map((m) => m.id),
  )
  const [focusedMemberIds, setFocusedMemberIds] = useState<string[]>([])
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
  const fyHalf = useMemo(() => fiscalHalfFromDate(new Date()), [])

  const members: Member[] = snapshot.members ?? []
  const activeMemberIds = useMemo(
    () => members.filter((m) => m.active).map((m) => m.id),
    [members],
  )
  const focusedInView = focusedMemberIds.filter((id) => visibleMemberIds.includes(id))
  const allVisible =
    activeMemberIds.length > 0 &&
    activeMemberIds.length === visibleMemberIds.length &&
    activeMemberIds.every((id) => visibleMemberIds.includes(id))
  const timelineMemberIds = focusedInView.length > 0 ? focusedInView : visibleMemberIds
  const memberFilterActive = focusedInView.length > 0 || !allVisible
  const projects: Project[] = useMemo(() => {
    const list = snapshot.projects ?? []
    return list.filter((p) => selectedStatuses.includes(p.status))
  }, [snapshot.projects, selectedStatuses])

  const capacityByMember = useMemo(
    () => buildHalfCapacityMap(
      members.map((m) => m.id),
      fyHalf,
      assignmentsFile.assignments,
    ),
    [members, fyHalf, assignmentsFile.assignments],
  )

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
    <AppShell
      title="Resource planner"
      actions={
        <>
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
          <ProjectStatusFilter
            projects={snapshot.projects ?? []}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
          />
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
        </>
      }
      footer={<CapacityLegend />}
    >
      <div className="layout">
        <MemberPool
          members={members}
          fyLabel={fyHalf.label}
          capacityByMember={capacityByMember}
          visibleMemberIds={visibleMemberIds}
          focusedMemberIds={focusedInView}
          onChangeVisible={(next) => {
            setVisibleMemberIds(next)
            setFocusedMemberIds((prev) => prev.filter((id) => next.includes(id)))
          }}
          onToggleFocus={(id) => {
            setFocusedMemberIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }}
          onClearFocus={() => setFocusedMemberIds([])}
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
          selectedMemberIds={timelineMemberIds}
          memberFilterActive={memberFilterActive}
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
    </AppShell>
  )
}
