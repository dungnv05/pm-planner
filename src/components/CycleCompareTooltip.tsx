import type { Cycle, Member, Project } from '../types'
import { compareCycle, type CycleCompareRow } from '../lib/comparePlanActual'
import { formatPct } from '../lib/capacity'
import type { ActualWork, Assignment } from '../types'

interface Props {
  cycle: Cycle
  members: Member[]
  projects: Project[]
  assignments: Assignment[]
  actualWork: ActualWork[]
  onClose: () => void
}

export function CycleComparePanel({
  cycle,
  members,
  projects,
  assignments,
  actualWork,
  onClose,
}: Props) {
  const projectIds = projects.map((p) => p.id)
  const rows: CycleCompareRow[] = compareCycle(
    cycle,
    members,
    projectIds,
    assignments,
    actualWork,
  )
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h3>
          Cycle {cycle.number} compare
          <span style={{ fontWeight: 400, color: 'var(--ink-muted)', marginLeft: 8, fontSize: '0.85rem' }}>
            {new Date(cycle.startsAt).toLocaleDateString()} –{' '}
            {new Date(cycle.endsAt).toLocaleDateString()}
          </span>
        </h3>
        {rows.length === 0 ? (
          <p className="empty-hint">No plan or actual work in this cycle.</p>
        ) : (
          <table className="compare-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Project</th>
                <th>Plan</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap((row) =>
                row.projects.map((p, i) => (
                  <tr key={`${row.memberId}-${p.projectId}`}>
                    <td>{i === 0 ? row.memberName : ''}</td>
                    <td>{projectName(p.projectId)}</td>
                    <td>{p.plan > 0.001 ? formatPct(p.plan) : '—'}</td>
                    <td>{p.actual > 0.001 ? formatPct(p.actual) : '—'}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
