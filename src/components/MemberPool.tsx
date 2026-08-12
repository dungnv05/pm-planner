import type { Member } from '../types'
import { capacityColor, formatPct } from '../lib/capacity'

interface Props {
  members: Member[]
  focusMonth: string
  capacityByMember: Record<string, number>
  onDragStart: (memberId: string) => void
}

export function MemberPool({ members, focusMonth, capacityByMember, onDragStart }: Props) {
  const active = members.filter((m) => m.active)

  return (
    <aside className="member-pool">
      <h2>Members · {focusMonth}</h2>
      {active.map((m) => {
        const cap = capacityByMember[m.id] ?? 0
        const initials = (m.displayName || m.name).slice(0, 2).toUpperCase()
        return (
          <div
            key={m.id}
            className="member-card"
            draggable
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
            <span className="cap-chip" style={{ background: capacityColor(cap) }}>
              {formatPct(cap)}
            </span>
          </div>
        )
      })}
    </aside>
  )
}
