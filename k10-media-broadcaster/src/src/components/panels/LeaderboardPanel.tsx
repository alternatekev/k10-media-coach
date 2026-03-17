import { useState, useEffect, useRef, useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

/**
 * Leaderboard entry format from JSON: [pos, name, irating, bestLap, lastLap, gapToPlayer, inPit, isPlayer]
 */
type LeaderboardRawEntry = [
  pos: number,
  name: string,
  irating: number,
  bestLap: number,
  lastLap: number,
  gapToPlayer: number,
  inPit: number,
  isPlayer: number
];

interface DriverLapHistory {
  lastLaps: number[];
}

/**
 * Format gap to player: negative = ahead, positive = behind
 */
function formatGap(gap: number): string {
  if (gap === 0) return '—';
  if (Math.abs(gap) < 0.001) return '0.000';
  const sign = gap > 0 ? '+' : '';
  return sign + gap.toFixed(3);
}

interface LeaderboardPanelProps {
  posClasses?: string;
  panelStyle?: React.CSSProperties;
}

export default function LeaderboardPanel({ posClasses, panelStyle }: LeaderboardPanelProps) {
  const { telemetry } = useTelemetry();

  const [startPosition, setStartPosition] = useState<number | null>(null);
  const lapHistoryRef = useRef<Map<number, DriverLapHistory>>(new Map());

  // Parse leaderboard JSON
  const leaderboard = useMemo(() => {
    try {
      if (!telemetry.leaderboardJson) return [];
      const parsed = JSON.parse(telemetry.leaderboardJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [telemetry.leaderboardJson]);

  // Track starting positions from first valid leaderboard
  useEffect(() => {
    if (startPosition === null && leaderboard.length > 0) {
      const playerEntry = leaderboard.find((e: LeaderboardRawEntry) => e[7]);
      if (playerEntry) {
        setStartPosition(playerEntry[0]);
      }
    }
  }, [leaderboard, startPosition]);

  // Update lap history as we get new laps
  useEffect(() => {
    leaderboard.forEach((entry: LeaderboardRawEntry) => {
      const pos = entry[0];
      const lastLap = entry[4];

      if (lastLap > 0) {
        const history = lapHistoryRef.current.get(pos) || { lastLaps: [] };

        // Only add if it's a new lap time (avoid duplicates)
        if (history.lastLaps.length === 0 || history.lastLaps[history.lastLaps.length - 1] !== lastLap) {
          history.lastLaps = [...history.lastLaps, lastLap];
          lapHistoryRef.current.set(pos, history);
        }
      }
    });
  }, [leaderboard]);

  if (!leaderboard.length) {
    return (
      <div className={`leaderboard-panel ${posClasses || 'lb-bottom lb-left'}`} id="leaderboardPanel" style={panelStyle}>
        <div className="lb-inner">
          <div className="lb-header">Relative</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`leaderboard-panel ${posClasses || 'lb-bottom lb-left'}`} id="leaderboardPanel" style={panelStyle}>
      <div className="lb-inner">
        <canvas className="lb-gl gl-overlay" id="lbPlayerGlCanvas"></canvas>
        <canvas className="lb-gl gl-overlay" id="lbEventGlCanvas"></canvas>
        <div className="lb-header">Relative</div>
        <div id="lbRows">
          {leaderboard.map((entry: LeaderboardRawEntry) => {
            const [pos, name, _irating, _bestLap, _lastLap, gapToPlayer, inPit, isPlayer] = entry;
            const isPlayerRow = isPlayer > 0;
            const isInPit = inPit > 0;

            const rowClasses = ['lb-row'];
            if (isPlayerRow) rowClasses.push('lb-player');
            if (isInPit) rowClasses.push('lb-pit');

            return (
              <div key={`${pos}-${name}`} className={rowClasses.join(' ')}>
                <span className="lb-pos">{pos}</span>
                <span className="lb-name">{name}</span>
                <span className="lb-gap">{formatGap(gapToPlayer)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="race-timeline" id="raceTimeline">
        <canvas className="rt-canvas" id="rtCanvas" width="310" height="9"></canvas>
      </div>
    </div>
  );
}
