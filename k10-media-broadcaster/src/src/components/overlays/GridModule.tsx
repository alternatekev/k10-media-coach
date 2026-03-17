import { useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

export default function GridModule() {
  const { telemetry } = useTelemetry();

  // Determine if grid module is active (formation lap or start lights)
  const gridActive = useMemo(() => {
    return telemetry.lightsPhase > 0 || (telemetry.sessionState === 'gridding' || telemetry.sessionState === 'formation');
  }, [telemetry.lightsPhase, telemetry.sessionState]);

  // Determine if we should show formation info (grid active but lights haven't started)
  const showFormationInfo = useMemo(() => {
    return gridActive && telemetry.lightsPhase === 0;
  }, [gridActive, telemetry.lightsPhase]);

  // Determine if we should show start lights (lights phase > 0)
  const showStartLights = useMemo(() => {
    return telemetry.lightsPhase > 0;
  }, [telemetry.lightsPhase]);

  // Map lights phase to light states
  const getLightState = (bulbIndex: number): 'off' | 'red' | 'green' => {
    const phase = telemetry.lightsPhase;

    if (phase === 0) return 'off';
    if (phase >= 1 && phase <= 5) {
      // Phases 1-5: building reds (light N lit for phase >= N)
      return bulbIndex <= phase ? 'red' : 'off';
    }
    if (phase === 6) return 'red'; // All red (hold)
    if (phase === 7) return 'green'; // All green
    if (phase === 8) return 'off'; // Done

    return 'off';
  };

  // Extract flag colors from telemetry (flagColors should be array of 3 colors)
  const flagColors = useMemo(() => {
    // If telemetry has flagColors, use it; otherwise default to generic stripes
    // This assumes flagColors is provided in telemetry as an array
    return {
      color1: '',
      color2: '',
      color3: '',
    };
  }, []);

  if (!gridActive) {
    return null;
  }

  return (
    <div className={`grid-module ${gridActive ? 'grid-active' : ''}`} id="gridModule">
      {/* WebGL Canvas Placeholder */}
      <canvas className="grid-flag-gl" id="gridFlagGlCanvas" />

      {/* Countdown Display */}
      <div className="grid-countdown" id="gridCountdown">
        {telemetry.lightsPhase > 0 ? '—' : telemetry.gridCountdown?.toString() || '—'}
      </div>

      {/* Formation/Start Info Section */}
      {showFormationInfo && (
        <div className="grid-info" id="gridInfo">
          {/* Country Flag */}
          <div className="grid-flag" id="gridFlag">
            <div className="grid-flag-stripe" id="flagStripe1" style={{ backgroundColor: flagColors.color1 }} />
            <div className="grid-flag-stripe" id="flagStripe2" style={{ backgroundColor: flagColors.color2 }} />
            <div className="grid-flag-stripe" id="flagStripe3" style={{ backgroundColor: flagColors.color3 }} />
          </div>

          {/* Background element */}
          <div className="grid-bg" id="gridBg" />

          {/* Title */}
          <div className="grid-title">Formation Lap</div>

          {/* Cars gridded/total info */}
          <div className="grid-cars">
            <span id="gridCarsGridded">{telemetry.griddedCars}</span>
            <span className="grid-cars-total">
              / <span id="gridCarsTotal">{telemetry.totalCars}</span> gridded
            </span>
          </div>

          {/* Strip element (visual separator) */}
          <div className="grid-strip" id="gridStrip" />

          {/* Start type */}
          <div className="grid-start-type" id="gridStartType">
            {telemetry.startType || 'Rolling Start'}
          </div>
        </div>
      )}

      {/* Start Lights Section */}
      {showStartLights && (
        <div className="start-lights" id="startLights">
          <div className="lights-housing">
            {/* 5 light columns, each with top and bottom bulb */}
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const bulbIndex = colIndex + 1;
              const lightState = getLightState(bulbIndex);

              return (
                <div key={colIndex} className="light-col">
                  <div
                    className={`light-bulb ${lightState === 'red' ? 'light-on-red' : ''} ${lightState === 'green' ? 'light-on-green' : ''}`}
                    id={`light${bulbIndex}t`}
                  />
                  <div
                    className={`light-bulb ${lightState === 'red' ? 'light-on-red' : ''} ${lightState === 'green' ? 'light-on-green' : ''}`}
                    id={`light${bulbIndex}b`}
                  />
                </div>
              );
            })}
          </div>

          {/* GO! Text */}
          <div className="lights-go" id="lightsGo">
            {telemetry.lightsPhase === 7 ? 'GO!' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
