import { useEffect, useRef, useState } from 'react'
import {
  holidayGroupsInWindow,
  holidaysInWindow,
  holidayTooltip,
} from '../lib/holidays'
import type { TimelineScale } from '../lib/timeline'

interface OverlayProps {
  weeks: string[]
  months: string[]
  scale: TimelineScale
  colWidthPx: number
}

export function HolidayWashes({ weeks, months, scale, colWidthPx }: OverlayProps) {
  const holidaySpans = holidaysInWindow(scale, weeks, months)
  return (
    <>
      {holidaySpans.map(({ holiday, span }) => (
        <div
          key={`wash-${holiday.id}`}
          className={`holiday-wash holiday-${holiday.country.toLowerCase()}`}
          style={{
            left: span.start * colWidthPx,
            width: (span.end - span.start + 1) * colWidthPx,
          }}
        />
      ))}
    </>
  )
}

export function HolidayBands({ weeks, months, scale, colWidthPx }: OverlayProps) {
  const holidayGroups = holidayGroupsInWindow(scale, weeks, months)
  const cols = scale === 'week' ? weeks : months
  const trackWidth = cols.length * colWidthPx
  const [openHolidayCol, setOpenHolidayCol] = useState<number | null>(null)
  const holidayRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openHolidayCol === null) return
    const onDown = (e: MouseEvent) => {
      if (holidayRowRef.current && !holidayRowRef.current.contains(e.target as Node)) {
        setOpenHolidayCol(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenHolidayCol(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openHolidayCol])

  return (
    <div className="holiday-row-wrap" ref={holidayRowRef} style={{ width: trackWidth }}>
      {holidayGroups.map(({ col, holidays: group }) => {
        const countries = new Set(group.map((h) => h.country))
        const countryClass =
          countries.size > 1
            ? 'holiday-both'
            : `holiday-${[...countries][0].toLowerCase()}`
        const open = openHolidayCol === col
        return (
          <div
            key={`h-${col}`}
            className={`holiday-band ${countryClass}`}
            style={{
              left: col * colWidthPx,
              width: colWidthPx - 2,
            }}
          >
            <span className="holiday-band-label">Holidays</span>
            <button
              type="button"
              className="holiday-q"
              aria-label="Show holiday names"
              aria-expanded={open}
              onClick={(e) => {
                e.stopPropagation()
                setOpenHolidayCol(open ? null : col)
              }}
            >
              ?
            </button>
            {open && (
              <div className="holiday-tooltip" role="tooltip">
                {group.map((h) => (
                  <p key={h.id}>{holidayTooltip(h)}</p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
