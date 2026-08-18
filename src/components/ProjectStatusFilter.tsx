import { useEffect, useMemo, useRef, useState } from 'react'
import type { Project } from '../types'

const HIDDEN_BY_DEFAULT = new Set(['completed', 'canceled'])

const STATUS_ORDER = [
  'backlog',
  'planned',
  'started',
  'completed',
  'canceled',
]

export function defaultSelectedStatuses(projects: Project[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of projects) {
    if (HIDDEN_BY_DEFAULT.has(p.statusType) || seen.has(p.status)) continue
    seen.add(p.status)
    out.push(p.status)
  }
  return out
}

function uniqueStatuses(projects: Project[]): { status: string; statusType: string }[] {
  const byStatus = new Map<string, string>()
  for (const p of projects) {
    if (!byStatus.has(p.status)) byStatus.set(p.status, p.statusType)
  }
  return [...byStatus.entries()]
    .map(([status, statusType]) => ({ status, statusType }))
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.statusType)
      const bi = STATUS_ORDER.indexOf(b.statusType)
      const ao = ai === -1 ? STATUS_ORDER.length : ai
      const bo = bi === -1 ? STATUS_ORDER.length : bi
      if (ao !== bo) return ao - bo
      return a.status.localeCompare(b.status)
    })
}

interface Props {
  projects: Project[]
  selected: string[]
  onChange: (next: string[]) => void
}

export function ProjectStatusFilter({ projects, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options = useMemo(() => uniqueStatuses(projects), [projects])
  const allStatuses = options.map((o) => o.status)
  const allSelected = allStatuses.length > 0 && allStatuses.every((s) => selected.includes(s))
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

  const toggle = (status: string) => {
    onChange(
      selected.includes(status)
        ? selected.filter((s) => s !== status)
        : [...selected, status],
    )
  }

  const label = noneSelected
    ? 'Status: none'
    : allSelected
      ? 'Status: all'
      : selected.length === 1
        ? `Status: ${selected[0]}`
        : `Status (${selected.length})`

  return (
    <div className="status-filter" ref={rootRef}>
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
              onClick={() => onChange(allStatuses)}
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
          {options.map(({ status }) => {
            const checked = selected.includes(status)
            return (
              <label key={status} className={`status-filter-option${checked ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(status)}
                />
                {status}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
