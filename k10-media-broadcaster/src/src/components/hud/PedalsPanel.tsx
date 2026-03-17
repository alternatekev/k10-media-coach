import { useState, useRef, useEffect } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { fmtPercent } from '@lib/formatters';

const HISTORY_LENGTH = 20;

export default function PedalsPanel() {
  const { telemetry } = useTelemetry();

  // History arrays for pedals (0-1 range)
  const [throttleHist, setThrottleHist] = useState<number[]>(Array(HISTORY_LENGTH).fill(0));
  const [brakeHist, setBrakeHist] = useState<number[]>(Array(HISTORY_LENGTH).fill(0));
  const [clutchHist, setClutchHist] = useState<number[]>(Array(HISTORY_LENGTH).fill(0));

  const frameCountRef = useRef(0);

  // Update history every other frame
  useEffect(() => {
    frameCountRef.current++;

    if (frameCountRef.current % 2 === 0) {
      setThrottleHist((prev) => [...prev.slice(1), telemetry.throttleRaw]);
      setBrakeHist((prev) => [...prev.slice(1), telemetry.brakeRaw]);
      setClutchHist((prev) => [...prev.slice(1), telemetry.clutchRaw]);
    }
  }, [telemetry.throttleRaw, telemetry.brakeRaw, telemetry.clutchRaw]);

  return (
    <div
      className="panel pedals-area"
      id="pedalsArea"
      style={{ '--thr-glow': telemetry.throttleRaw } as React.CSSProperties}
    >
      <canvas className="gl-overlay" id="pedalsGlCanvas"></canvas>

      <div className="pedal-labels-row">
        <div className="pedal-label-group">
          <div className="pedal-channel-label throttle">THROTTLE</div>
          <div className="pedal-pct" style={{ color: 'var(--green)' }}>
            {fmtPercent(telemetry.throttleRaw)}
          </div>
        </div>
        <div className="pedal-label-group">
          <div className="pedal-channel-label brake">BRAKE</div>
          <div className="pedal-pct" style={{ color: 'var(--red)' }}>
            {fmtPercent(telemetry.brakeRaw)}
          </div>
        </div>
        <div className="pedal-label-group" id="clutchLabelGroup">
          <div className="pedal-channel-label clutch">CLUTCH</div>
          <div className="pedal-pct" style={{ color: 'var(--blue)' }}>
            {fmtPercent(telemetry.clutchRaw)}
          </div>
        </div>
      </div>

      <div className="pedal-viz-stack">
        <div className="pedal-viz-layer throttle-layer" id="throttleHist">
          {throttleHist.map((value, i) => (
            <div
              key={i}
              style={{ height: `${value * 100}%` }}
            />
          ))}
        </div>
        <div className="pedal-viz-layer brake-layer" id="brakeHist">
          {brakeHist.map((value, i) => (
            <div
              key={i}
              style={{ height: `${value * 100}%` }}
            />
          ))}
        </div>
        <div className="pedal-viz-layer clutch-layer" id="clutchHist">
          {clutchHist.map((value, i) => (
            <div
              key={i}
              style={{ height: `${value * 100}%` }}
            />
          ))}
        </div>
        <canvas className="pedal-trace-canvas" id="pedalTraceCanvas" width={240} height={80}></canvas>
      </div>
    </div>
  );
}
