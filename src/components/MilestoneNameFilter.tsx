import { useEffect, useRef, useState } from 'react'

interface Props {
  names: string[]
  selected: string[]
  onChange: (next: string[]) => void
}

export function MilestoneNameFilter({ names, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const allSelected = names.length > 0 && names.every((n) => selected.includes(n))
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

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((x) => x !== name) : [...selected, name])
  }

  const label = noneSelected
    ? 'Milestones: none'
    : allSelected
      ? 'Milestones: all'
      : selected.length === 1
        ? `Milestones: ${selected[0]}`
        : `Milestones (${selected.length})`

  return (
    <div className="status-filter milestone-filter" ref={rootRef}>
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
              onClick={() => onChange(names)}
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
          {names.map((name) => {
            const checked = selected.includes(name)
            return (
              <label key={name} className={`status-filter-option${checked ? ' selected' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(name)} />
                {name}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
