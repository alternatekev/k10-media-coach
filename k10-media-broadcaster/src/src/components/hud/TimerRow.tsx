import { useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { fmtDuration, fmtLap } from '@lib/formatters';

export default function TimerRow() {
  const { telemetry } = useTelemetry();

  // Format session time as H:MM:SS
  const sessionTimeDisplay = useMemo(() => {
    return fmtDuration(telemetry.remainingTime);
  }, [telemetry.remainingTime]);

  // Format last lap time as M:SS.mmm
  const lastLapDisplay = useMemo(() => {
    if (telemetry.lastLapTime <= 0) {
      return '—:——.———';
    }
    return fmtLap(telemetry.lastLapTime);
  }, [telemetry.lastLapTime]);

  // Show timer-row with timer-visible class when there's active race data
  const isRaceActive = telemetry.currentLap > 0 && telemetry.remainingTime > 0;
  const timerRowClass = `timer-row ${isRaceActive ? 'timer-visible' : ''}`;

  return (
    <div className={timerRowClass}>
      <div className="panel race-timer-block" id="raceTimerBlock">
        <div className="race-timer-value" id="raceTimerValue">
          {sessionTimeDisplay}
        </div>
        <div className="race-timer-lap">
          <span className="timer-label">Last</span>{' '}
          <span id="lastLapTimeValue">{lastLapDisplay}</span>
        </div>
      </div>
    </div>
  );
}
