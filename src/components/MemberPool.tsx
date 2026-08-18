import { useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '../types'
import { formatPct, halfCapacityColor } from '../lib/capacity'

export type MemberSort = 'name' | 'workload'

function memberLabel(m: Member): string {
  return m.displayName || m.name
}

interface FilterProps {
  members: Member[]
  selected: string[]
  onChange: (next: string[]) => void
}

function MemberFilter({ members, selected, onChange }: FilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const allIds = members.map((m) => m.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id))
  const noneSelected = selected.length === 0

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const selectedMember = members.find((m) => selected.includes(m.id))
  const label = noneSelected
    ? 'Members: none'
    : allSelected
      ? 'Members: all'
      : selected.length === 1 && selectedMember
        ? `Members: ${memberLabel(selectedMember)}`
        : `Members (${selected.length})`

  return (
    <div className="status-filter member-filter" ref={rootRef}>
      <button
        type="button"
        className={`btn${open ? ' btn-primary' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div className="status-filter-menu" role="listbox" aria-multiselectable="true">
          <div className="status-filter-actions">
            <button
              type="button"
              className="btn"
              onClick={() => onChange(allIds)}
              disabled={allSelected}
            >
              All
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onChange([])}
              disabled={noneSelected}
            >
              None
            </button>
          </div>
          {members.map((m) => {
            const checked = selected.includes(m.id)
            return (
              <label key={m.id} className={`status-filter-option${checked ? ' selected' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(m.id)} />
                {memberLabel(m)}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface Props {
  members: Member[]
  fyLabel: string
  capacityByMember: Record<string, number>
  visibleMemberIds: string[]
  focusedMemberIds: string[]
  onChangeVisible: (next: string[]) => void
  onToggleFocus: (memberId: string) => void
  onClearFocus: () => void
  onDragStart: (memberId: string) => void
}

export function MemberPool({
  members,
  fyLabel,
  capacityByMember,
  visibleMemberIds,
  focusedMemberIds,
  onChangeVisible,
  onToggleFocus,
  onClearFocus,
  onDragStart,
}: Props) {
  const [sort, setSort] = useState<MemberSort>('name')
  const active = useMemo(
    () => members.filter((m) => m.active).sort((a, b) => memberLabel(a).localeCompare(memberLabel(b))),
    [members],
  )
  const focusing = focusedMemberIds.length > 0

  const visible = useMemo(() => {
    const list = active.filter((m) => visibleMemberIds.includes(m.id))
    const sorted = [...list]
    if (sort === 'name') {
      sorted.sort((a, b) => memberLabel(a).localeCompare(memberLabel(b)))
    } else {
      sorted.sort((a, b) => {
        const diff = (capacityByMember[b.id] ?? 0) - (capacityByMember[a.id] ?? 0)
        if (Math.abs(diff) > 0.0001) return diff
        return memberLabel(a).localeCompare(memberLabel(b))
      })
    }
    return sorted
  }, [active, visibleMemberIds, sort, capacityByMember])

  return (
    <aside className="member-pool">
      <h2>Members · {fyLabel}</h2>
      <div className="member-toolbar">
        <div className="scale-toggle" role="group" aria-label="Sort members">
          <button
            type="button"
            className={`btn ${sort === 'name' ? 'btn-primary' : ''}`}
            onClick={() => setSort('name')}
          >
            Name
          </button>
          <button
            type="button"
            className={`btn ${sort === 'workload' ? 'btn-primary' : ''}`}
            onClick={() => setSort('workload')}
          >
            Workload
          </button>
        </div>
        <MemberFilter members={active} selected={visibleMemberIds} onChange={onChangeVisible} />
      </div>
      {focusing && (
        <button type="button" className="btn clear-filter" onClick={onClearFocus}>
          Clear filter ({focusedMemberIds.length})
        </button>
      )}
      <p className="filter-hint">Click to filter · drag to plan</p>
      {visible.map((m) => {
        const cap = capacityByMember[m.id] ?? 0
        const initials = memberLabel(m).slice(0, 2).toUpperCase()
        const selected = focusedMemberIds.includes(m.id)
        return (
          <div
            key={m.id}
            className={`member-card${selected ? ' selected' : ''}${focusing && !selected ? ' dimmed' : ''}`}
            draggable
            onClick={() => onToggleFocus(m.id)}
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
              {memberLabel(m)}
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
