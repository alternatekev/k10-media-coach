import { useState, useEffect } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

export default function ControlsPanel() {
  const { telemetry } = useTelemetry();

  // BB: brake bias, normalize from 0-100 range to percentage
  const bbRaw = telemetry.brakeBias;
  const brakeBiasPercent = Math.max(0, Math.min(100, ((bbRaw - 30) / 40) * 100));

  // TC and ABS: 0-12 range
  const tcLevel = telemetry.tc;
  const absLevel = telemetry.abs;

  // Visibility flags — mirrors original setCtrlVisibility logic
  // hasBB/hasTC/hasABS are true when the car supports those controls
  // In the original, these come from a separate capabilities message.
  // In our telemetry, we infer: if any non-zero value has ever been seen,
  // the control is available. For now, always show BB if brakeBias > 0,
  // and show TC/ABS rows (with "fixed" fallback) if they ever had a value.
  // Always show all 3 rows by default (matching original idle appearance).
  // Original hides rows only when a car explicitly lacks them (separate flag).
  // In idle/no-data state, all 3 are visible with "—" or "fixed" text.
  const hasBB = true;
  const hasTC = true;
  const hasABS = true;
  const hasAny = hasBB || hasTC || hasABS;

  // Flash animation state when values change
  const [prevBB, setPrevBB] = useState(brakeBiasPercent);
  const [prevTC, setPrevTC] = useState(tcLevel);
  const [prevABS, setPrevABS] = useState(absLevel);

  const [flashBB, setFlashBB] = useState(false);
  const [flashTC, setFlashTC] = useState(false);
  const [flashABS, setFlashABS] = useState(false);

  useEffect(() => {
    if (brakeBiasPercent !== prevBB) {
      setPrevBB(brakeBiasPercent);
      setFlashBB(true);
      const timer = setTimeout(() => setFlashBB(false), 150);
      return () => clearTimeout(timer);
    }
  }, [brakeBiasPercent, prevBB]);

  useEffect(() => {
    if (tcLevel !== prevTC) {
      setPrevTC(tcLevel);
      setFlashTC(true);
      const timer = setTimeout(() => setFlashTC(false), 150);
      return () => clearTimeout(timer);
    }
  }, [tcLevel, prevTC]);

  useEffect(() => {
    if (absLevel !== prevABS) {
      setPrevABS(absLevel);
      setFlashABS(true);
      const timer = setTimeout(() => setFlashABS(false), 150);
      return () => clearTimeout(timer);
    }
  }, [absLevel, prevABS]);

  return (
    <div className={`panel car-controls${!hasAny ? ' no-adj' : ''}`}>
      {/* BB row — hidden if car has no brake bias */}
      <div
        className={`ctrl-item${flashBB ? ' flash' : ''}${!hasBB ? ' ctrl-hidden' : ''}`}
        id="ctrlBB"
        style={{ '--ctrl-pct': `${brakeBiasPercent}%` } as React.CSSProperties}
      >
        <div className="ctrl-label">BIAS</div>
        <div className="ctrl-value">{bbRaw > 0 ? bbRaw.toFixed(1) : '—'}</div>
      </div>

      {/* TC row — shows "fixed" when value is 0 (car has fixed TC) */}
      <div
        className={`ctrl-item${flashTC ? ' flash' : ''}${!hasTC ? ' ctrl-hidden' : ''}`}
        id="ctrlTC"
        style={{ '--ctrl-pct': `${tcLevel > 0 ? Math.min(100, (tcLevel / 12) * 100) : 0}%` } as React.CSSProperties}
      >
        <div className="ctrl-label">TRACTION</div>
        <div className={`ctrl-value${tcLevel === 0 ? ' ctrl-value-fixed' : ''}`}>
          {tcLevel > 0 ? Math.round(tcLevel) : 'fixed'}
        </div>
      </div>

      {/* ABS row — shows "fixed" when value is 0 */}
      <div
        className={`ctrl-item${flashABS ? ' flash' : ''}${!hasABS ? ' ctrl-hidden' : ''}`}
        id="ctrlABS"
        style={{ '--ctrl-pct': `${absLevel > 0 ? Math.min(100, (absLevel / 12) * 100) : 0}%` } as React.CSSProperties}
      >
        <div className="ctrl-label">ABS</div>
        <div className={`ctrl-value${absLevel === 0 ? ' ctrl-value-fixed' : ''}`}>
          {absLevel > 0 ? Math.round(absLevel) : 'fixed'}
        </div>
      </div>

      {/* NO ADJUSTMENTS message — only when ALL controls hidden */}
      <div className="ctrl-no-adj" id="ctrlNoAdj">NO ADJUSTMENTS</div>
    </div>
  );
}
