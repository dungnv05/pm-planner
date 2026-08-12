export function CapacityLegend() {
  return (
    <footer className="legend">
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-under)' }} />
        Under capacity (&lt;100%)
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-full)' }} />
        Full (100%)
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-over-1)' }} />
        Over 101–125%
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-over-2)' }} />
        Over 126–150%
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--cap-over-3)' }} />
        Over &gt;150%
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: 'var(--plan-bar)' }} />
        Plan assignment
      </div>
      <div className="legend-item">
        <span className="swatch actual" />
        Actual (completed cycle)
      </div>
    </footer>
  )
}
