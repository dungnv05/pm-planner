export function CapacityLegend() {
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
