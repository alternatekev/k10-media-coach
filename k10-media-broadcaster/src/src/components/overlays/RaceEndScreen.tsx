import { useState, useEffect, useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { fmtLap, fmtIRating } from '@lib/formatters';

export default function RaceEndScreen() {
  const { telemetry } = useTelemetry();
  const [isVisible, setIsVisible] = useState(false);
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [prevFlagState, setPrevFlagState] = useState<string>(telemetry.flagState);

  // Detect DNF: position is 0 OR checkered but completed far fewer laps than total
  const isDNF = useMemo(() => {
    if (telemetry.position === 0) return true;
    if (telemetry.flagState === 'Checkered') {
      const lapThreshold = Math.max(1, Math.floor(telemetry.totalLaps * 0.5));
      if (telemetry.completedLaps < lapThreshold) {
        return true;
      }
    }
    return false;
  }, [telemetry.position, telemetry.flagState, telemetry.totalLaps, telemetry.completedLaps]);

  // Determine finish type
  const finishType = useMemo(() => {
    if (isDNF) return 'dnf';
    if (telemetry.position >= 1 && telemetry.position <= 3) return 'podium';
    if (telemetry.position >= 4 && telemetry.position <= 10) return 'strong';
    return 'midpack';
  }, [isDNF, telemetry.position]);

  // Determine main title
  const titleInfo = useMemo(() => {
    if (isDNF) {
      return { title: 'TOUGH BREAK', subtitle: 'Every lap is a lesson. Regroup and go again.' };
    }

    if (finishType === 'podium') {
      if (telemetry.position === 1) {
        return { title: 'VICTORY!', subtitle: null };
      } else {
        return { title: 'PODIUM!', subtitle: null };
      }
    }

    if (finishType === 'strong') {
      return { title: 'STRONG FINISH', subtitle: null };
    }

    return { title: 'RACE COMPLETE', subtitle: null };
  }, [isDNF, finishType, telemetry.position]);

  // Check for clean race badge
  const isCleanRace = useMemo(() => {
    return telemetry.incidentCount === 0;
  }, [telemetry.incidentCount]);

  // Trigger visibility on checkered flag
  useEffect(() => {
    if (
      telemetry.flagState === 'Checkered' &&
      prevFlagState !== 'Checkered'
    ) {
      setIsVisible(true);

      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 30000);

      setHideTimer(timer);
    }

    setPrevFlagState(telemetry.flagState);
  }, [telemetry.flagState, prevFlagState, hideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  // Click to dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
  };

  if (!isVisible || telemetry.flagState !== 'Checkered') {
    return null;
  }

  return (
    <div className="race-end-screen" id="raceEndScreen" onClick={handleDismiss}>
      <div className="race-end-bg"></div>
      <div className="re-confetti" id="reConfetti">
        {finishType === 'podium' && Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '-10px',
              width: '8px',
              height: '8px',
              backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'][i % 3],
              animation: `fall ${2 + Math.random() * 2}s linear forwards`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <div className="race-end-content" id="raceEndContent">
        <div className="re-position">
          {!isDNF && telemetry.position > 0 ? `P${telemetry.position}` : '—'}
        </div>
        <div className="re-title-block">
          <h1 className="re-title">{titleInfo.title}</h1>
          {titleInfo.subtitle && (
            <p className="re-subtitle">{titleInfo.subtitle}</p>
          )}
        </div>
        {isCleanRace && (
          <div className="re-clean-badge"><span>✓</span> CLEAN RACE</div>
        )}
        <div className="re-stats">
          <div className="re-stat">
            <div className="re-stat-label">POSITION</div>
            <div className="re-stat-val">
              {!isDNF && telemetry.position > 0 ? `P${telemetry.position}` : 'DNF'}
            </div>
          </div>
          <div className="re-stat">
            <div className="re-stat-label">INCIDENTS</div>
            <div className="re-stat-val">{telemetry.incidentCount}</div>
          </div>
          <div className="re-stat">
            <div className="re-stat-label">BEST LAP</div>
            <div className="re-stat-val">{fmtLap(telemetry.bestLapTime)}</div>
          </div>
          <div className="re-stat">
            <div className="re-stat-label">iRATING</div>
            <div className="re-stat-val">{fmtIRating(telemetry.iRating)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
