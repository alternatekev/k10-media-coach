import { useState, useEffect } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { fmtLap } from '@lib/formatters';

export default function PositionPanel() {
  const { telemetry } = useTelemetry();

  const [activePage, setActivePage] = useState<'rating' | 'position'>('rating');

  // Auto-cycle between pages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePage((prev) => (prev === 'rating' ? 'position' : 'rating'));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // iRating bar: 0-5000 range mapped to 0-100%
  const iRatingPercent = Math.max(0, Math.min(100, (telemetry.iRating / 5000) * 100));

  // SR pie: 0-4.0 range, circumference = 2πr = 2π(15) ≈ 94.25
  // Stroke dasharray = perimeter, dashoffset = perimeter - (sr/4)*perimeter
  const srPerimeter = 2 * Math.PI * 15;
  const srOffset = srPerimeter - (telemetry.safetyRating / 4.0) * srPerimeter;

  // Position delta: compare current position to a starting position
  // For now, assume starting position = 1, so delta = position - 1
  const posDelta = telemetry.position - 1;
  const posIndicator = posDelta > 0 ? '▼' : posDelta < 0 ? '▲' : '—';
  const posIndicatorColor = posDelta > 0 ? 'var(--red)' : posDelta < 0 ? 'var(--green)' : 'var(--text-dim)';

  return (
    <div className="panel cycle-container rating-pos-block" id="cycleRatingPos">
      <div className="cycle-sizer">
        <div className="pos-layout">
          <div className="pos-number">
            <span className="skew-accent">P—</span>
            <div className="pos-delta" style={{ color: posIndicatorColor }}>
              {posIndicator}
            </div>
          </div>
          <div className="pos-meta">
            <div className="pos-meta-row">
              Lap <span className="val">{telemetry.currentLap > 0 ? telemetry.currentLap : '—'}</span>
            </div>
            <div className="pos-meta-row best-row">
              <span className="val purple">{fmtLap(telemetry.bestLapTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page A: Rating */}
      <div className={`cycle-page ${activePage === 'rating' ? 'active' : 'inactive'}`} id="ratingPage">
        <div className="rating-row">
          <div className="rating-item">
            <div className="panel-label">iRating</div>
            <div className="rating-value">{telemetry.iRating > 0 ? telemetry.iRating : '—'}</div>
            <div className="rating-delta">—</div>
            <div className="ir-bar-container">
              <div className="ir-bar-track">
                <div
                  className="ir-bar-fill"
                  style={{ width: `${iRatingPercent}%` }}
                />
                <div className="ir-bar-ticks">
                  <div className="ir-bar-tick" style={{ left: '20%' }} />
                  <div className="ir-bar-tick-label" style={{ left: '20%' }}>
                    1k
                  </div>
                  <div className="ir-bar-tick" style={{ left: '40%' }} />
                  <div className="ir-bar-tick-label" style={{ left: '40%' }}>
                    2k
                  </div>
                  <div className="ir-bar-tick" style={{ left: '60%' }} />
                  <div className="ir-bar-tick-label" style={{ left: '60%' }}>
                    3k
                  </div>
                  <div className="ir-bar-tick" style={{ left: '80%' }} />
                  <div className="ir-bar-tick-label" style={{ left: '80%' }}>
                    4k
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rating-item">
            <div className="panel-label">Safety</div>
            <div className="rating-value" style={{ fontSize: '14px' }}>
              {telemetry.safetyRating > 0 ? telemetry.safetyRating.toFixed(2) : '—'}
            </div>
            <div className="rating-delta">—</div>
            <div className="sr-pie-container">
              <svg className="sr-pie-svg" viewBox="0 0 40 40">
                <circle className="sr-pie-bg" cx="20" cy="20" r="15" />
                <circle
                  className="sr-pie-fill"
                  cx="20"
                  cy="20"
                  r="15"
                  stroke="var(--green)"
                  strokeDasharray={srPerimeter}
                  strokeDashoffset={srOffset}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Page B: Position */}
      <div className={`cycle-page ${activePage === 'position' ? 'active' : 'inactive'}`} id="positionPage">
        <div className="pos-layout">
          <div className="pos-number">
            <span className="skew-accent">P—</span>
            <div className="pos-delta" style={{ color: posIndicatorColor }}>
              {posIndicator}
            </div>
          </div>
          <div className="pos-meta">
            <div className="pos-meta-row">
              Lap <span className="val">{telemetry.currentLap > 0 ? telemetry.currentLap : '—'}</span>
            </div>
            <div className="pos-meta-row best-row">
              <span className="val purple">{fmtLap(telemetry.bestLapTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle dots */}
      <div className="cycle-dots">
        <div
          className={`cycle-dot ${activePage === 'rating' ? 'active' : ''}`}
          onClick={() => setActivePage('rating')}
        />
        <div
          className={`cycle-dot ${activePage === 'position' ? 'active' : ''}`}
          onClick={() => setActivePage('position')}
        />
      </div>
    </div>
  );
}
