import { useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

const DEFAULT_PIT_SPEED_LIMIT_KMH = 72; // ~45 mph

export default function PitLimiterBanner() {
  const { telemetry } = useTelemetry();

  const pitSpeedLimitKmh = useMemo(() => {
    return telemetry.pitSpeedLimitKmh || DEFAULT_PIT_SPEED_LIMIT_KMH;
  }, [telemetry.pitSpeedLimitKmh]);

  const pitSpeedLimitMph = useMemo(() => {
    return pitSpeedLimitKmh * 0.621371;
  }, [pitSpeedLimitKmh]);

  const speedMph = useMemo(() => {
    return telemetry.speedKmh * 0.621371;
  }, [telemetry.speedKmh]);

  const isVisible = useMemo(() => {
    return telemetry.isInPitLane;
  }, [telemetry.isInPitLane]);

  const isOverLimit = useMemo(() => {
    return isVisible && speedMph > pitSpeedLimitMph;
  }, [isVisible, speedMph, pitSpeedLimitMph]);

  const bannerClasses = ['pit-banner'];
  if (isVisible) {
    bannerClasses.push('pit-active');
  }
  if (isOverLimit) {
    bannerClasses.push('pit-warn');
  }

  return (
    <div className={bannerClasses.join(' ')} id="pitBanner">
      <canvas className="pit-gl-canvas" id="pitGlCanvas"></canvas>
      <div className="pit-inner">
        <div className="pit-icon">P</div>
        <div className="pit-label">Pit Limiter</div>
        <div className="pit-speed">{speedMph.toFixed(0)} mph</div>
        <div className="pit-limit" style={{ fontSize: '11px', fontWeight: '600', color: 'hsla(0,0%,100%,0.45)', marginLeft: '4px' }}>
          Limit: {pitSpeedLimitMph.toFixed(0)} mph
        </div>
      </div>
    </div>
  );
}
