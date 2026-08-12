import { useState } from 'react'
import { ALLOCATION_PRESETS } from '../types'

interface Props {
  memberName: string
  projectName: string
  initial?: number
  onConfirm: (allocation: number) => void
  onCancel: () => void
}

export function AllocationPicker({
  memberName,
  projectName,
  initial = 1,
  onConfirm,
  onCancel,
}: Props) {
  const nearest =
    ALLOCATION_PRESETS.find((p) => Math.abs(p.value - initial) < 0.02)?.value ?? initial
  const [selected, setSelected] = useState(nearest)
  const [custom, setCustom] = useState(String(Math.round(initial * 100)))

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Allocate workload</h3>
        <p style={{ marginTop: 0, color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
          {memberName} → {projectName}
        </p>
        <div className="alloc-grid">
          {ALLOCATION_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={Math.abs(selected - p.value) < 0.02 ? 'selected' : ''}
              onClick={() => {
                setSelected(p.value)
                setCustom(String(Math.round(p.value * 100)))
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', marginBottom: 12, fontSize: '0.85rem' }}>
          Custom %
          <input
            type="number"
            min={10}
            max={100}
            step={5}
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              const n = Number(e.target.value)
              if (!Number.isNaN(n) && n >= 10 && n <= 100) setSelected(n / 100)
            }}
            style={{ marginLeft: 8, width: 72 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(selected)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
