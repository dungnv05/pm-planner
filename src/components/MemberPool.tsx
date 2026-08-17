import type { Member } from '../types'
import { formatPct, halfCapacityColor } from '../lib/capacity'

interface Props {
  members: Member[]
  fyLabel: string
  capacityByMember: Record<string, number>
  selectedMemberIds: string[]
  onToggleMember: (memberId: string) => void
  onClearFilter: () => void
  onDragStart: (memberId: string) => void
}

export function MemberPool({
  members,
  fyLabel,
  capacityByMember,
  selectedMemberIds,
  onToggleMember,
  onClearFilter,
  onDragStart,
}: Props) {
  const active = members.filter((m) => m.active)
  const filtering = selectedMemberIds.length > 0

  return (
    <aside className="member-pool">
      <h2>Members · {fyLabel}</h2>
      {filtering && (
        <button type="button" className="btn clear-filter" onClick={onClearFilter}>
          Clear filter ({selectedMemberIds.length})
        </button>
      )}
      <p className="filter-hint">Click to filter · drag to plan</p>
      {active.map((m) => {
        const cap = capacityByMember[m.id] ?? 0
        const initials = (m.displayName || m.name).slice(0, 2).toUpperCase()
        const selected = selectedMemberIds.includes(m.id)
        return (
          <div
            key={m.id}
            className={`member-card${selected ? ' selected' : ''}${filtering && !selected ? ' dimmed' : ''}`}
            draggable
            onClick={() => onToggleMember(m.id)}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/member-id', m.id)
              e.dataTransfer.effectAllowed = 'copy'
              onDragStart(m.id)
            }}
          >
            {m.avatarUrl ? (
              <img className="avatar" src={m.avatarUrl} alt="" />
            ) : (
              <div className="avatar">{initials}</div>
            )}
            <span className="member-name" title={m.email}>
              {m.displayName || m.name}
            </span>
            <span className="cap-chip" style={{ background: halfCapacityColor(cap) }}>
              {formatPct(cap)}
            </span>
          </div>
        )
      })}
    </aside>
  )
}
