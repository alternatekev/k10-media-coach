import { useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

/**
 * Tachometer HUD Component
 * Displays gear, speed, RPM with visual bar indicator and redline state.
 * - 11 segments colored by RPM ratio: green (0-60%), yellow (60-80%), red (80-91%), redline (>91%)
 * - RPM text color changes based on engine load
 * - Whole component gets 'tacho-redline' class when in redline state
 */
export function Tachometer() {
  const { telemetry } = useTelemetry();

  const rpmRatio = useMemo(() => {
    if (!telemetry.maxRpm || telemetry.maxRpm <= 0) return 0;
    return Math.min(telemetry.rpm / telemetry.maxRpm, 1.0);
  }, [telemetry.rpm, telemetry.maxRpm]);

  const isRedline = rpmRatio >= 0.91;

  // Determine RPM text color class
  const rpmColorClass = useMemo(() => {
    if (rpmRatio < 0.6) return 'var(--text-dim)';
    if (rpmRatio < 0.8) return 'var(--amber)';
    return 'var(--red)';
  }, [rpmRatio]);

  // Generate 11 tachometer segments
  const segments = useMemo(() => {
    const numSegments = 11;
    const result = [];

    for (let i = 0; i < numSegments; i++) {
      const segmentRatio = (i + 1) / numSegments;
      let segmentClass = 'tacho-seg';

      if (rpmRatio >= segmentRatio) {
        // This segment should be lit
        if (segmentRatio <= 0.6) {
          segmentClass += ' lit-green';
        } else if (segmentRatio <= 0.8) {
          segmentClass += ' lit-yellow';
        } else if (segmentRatio <= 0.91) {
          segmentClass += ' lit-red';
        } else {
          segmentClass += ' lit-redline';
        }
      }

      result.push(
        <div key={i} className={segmentClass} />
      );
    }

    return result;
  }, [rpmRatio]);

  const blockClass = isRedline
    ? 'panel tacho-block tacho-redline'
    : 'panel tacho-block';

  return (
    <div className={blockClass}>
      <canvas className="gl-overlay" id="tachoGlCanvas"></canvas>
      <div className="tacho-top-row">
        <div className="tacho-gear" id="gearText">
          {telemetry.gear || 'N'}
        </div>
        <div className="tacho-speed-cluster">
          <div className="speed-value" id="speedText">
            {Math.round(telemetry.speedMph)}
          </div>
          <div className="speed-unit">MPH</div>
        </div>
      </div>

      <span className="tacho-rpm" id="rpmText" style={{ color: rpmColorClass }}>
        {Math.round(telemetry.rpm)}
      </span>

      <div className="tacho-bar-track" id="tachoBar">
        {segments}
      </div>
    </div>
  );
}
