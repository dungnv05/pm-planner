interface Props {
  variant?: 'planner' | 'roadmap'
}

export function CapacityLegend({ variant = 'planner' }: Props) {
  if (variant === 'roadmap') {
    return (
      <footer className="legend">
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--today-week)' }} />
          Current week
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--holiday-jp)' }} />
          JP holiday
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--holiday-vn)' }} />
          VN holiday
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--cap-full)' }} />
          Done
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--cap-over-2)' }} />
          Overdue
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--cap-under)' }} />
          Due within 7 days
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--cap-empty)' }} />
          Open
        </div>
      </footer>
    )
  }

  return (
    <footer className="legend">
      <div className="legend-item">
        <span className="swatch" style={{ background: 'hsl(42 88% 28%)' }} />
        FY half under (darker = more under 100%)
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-full)' }} />
        FY half full (100%)
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'hsl(5 82% 28%)' }} />
        FY half over (darker = more over 100%)
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--holiday-jp)' }} />
        JP holiday
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--holiday-vn)' }} />
        VN holiday
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--plan-bar)' }} />
        Plan assignment
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-over-2)' }} />
        Actual: unplanned
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-full)' }} />
        Actual: matches plan
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-under)' }} />
        Actual: differs from plan
      </div>
    </footer>
  )
}
