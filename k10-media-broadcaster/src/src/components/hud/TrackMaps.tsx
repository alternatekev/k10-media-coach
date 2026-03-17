import { useMemo } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

export default function TrackMaps() {
  const { telemetry } = useTelemetry();

  // Parse opponent positions from "x1,y1,p1;x2,y2,p2;..." format
  const opponents = useMemo(() => {
    if (!telemetry.opponentMapPositions) return [];

    return telemetry.opponentMapPositions
      .split(';')
      .filter((entry) => entry.trim())
      .map((entry) => {
        const parts = entry.split(',');
        return {
          x: parseFloat(parts[0] ?? '0') || 0,
          y: parseFloat(parts[1] ?? '0') || 0,
          inPit: parseInt(parts[2] ?? '0', 10) === 1,
        };
      });
  }, [telemetry.opponentMapPositions]);

  // Compute zoom view bounds centered on player with smaller range
  const ZOOM_RANGE = 30; // Viewbox units around player
  const zoomViewBox = useMemo(() => {
    const playerX = telemetry.playerMapX || 50;
    const playerY = telemetry.playerMapY || 50;
    const x0 = playerX - ZOOM_RANGE / 2;
    const y0 = playerY - ZOOM_RANGE / 2;
    return `${x0} ${y0} ${ZOOM_RANGE} ${ZOOM_RANGE}`;
  }, [telemetry.playerMapX, telemetry.playerMapY]);

  return (
    <div className="maps-col">
      {/* Full Map Panel */}
      <div className="panel map-panel">
        <svg className="map-svg" id="fullMapSvg" viewBox="0 0 100 100">
          {/* Track path */}
          <path className="map-track" id="fullMapTrack" d={telemetry.trackMapSvg} />

          {/* Start/Finish flag */}
          {telemetry.trackMapReady && (
            <g id="fullMapSF" className="map-sf">
              <line
                x1="0"
                y1="-3.5"
                x2="0"
                y2="3.5"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <rect
                x="-5"
                y="-2.5"
                width="5"
                height="2.5"
                fill="#fff"
                opacity="0.9"
              />
              <rect
                x="0"
                y="-2.5"
                width="5"
                height="2.5"
                fill="#111"
                stroke="#fff"
                strokeWidth="0.3"
              />
              <rect
                x="-5"
                y="0"
                width="5"
                height="2.5"
                fill="#111"
                stroke="#fff"
                strokeWidth="0.3"
              />
              <rect
                x="0"
                y="0"
                width="5"
                height="2.5"
                fill="#fff"
                opacity="0.9"
              />
            </g>
          )}

          {/* Opponent dots */}
          <g id="fullMapOpponents">
            {opponents.map((opp, idx) => (
              <circle
                key={idx}
                cx={opp.x}
                cy={opp.y}
                r="2.5"
                fill={opp.inPit ? '#666' : '#ff6b00'}
                opacity={opp.inPit ? 0.6 : 1}
              />
            ))}
          </g>

          {/* Player position */}
          <circle
            className="map-player"
            id="fullMapPlayer"
            cx={telemetry.playerMapX || 50}
            cy={telemetry.playerMapY || 50}
            r="4"
          />
        </svg>
        <div className="map-zoom-label">Full</div>
      </div>

      {/* Zoom Map Panel */}
      <div className="panel map-zoom-panel">
        <svg className="map-zoom-svg" id="zoomMapSvg" viewBox={zoomViewBox}>
          {/* Track path (scaled for zoom) */}
          <path
            className="map-track"
            id="zoomMapTrack"
            d={telemetry.trackMapSvg}
            style={{ strokeWidth: '1.5' }}
          />

          {/* Start/Finish flag (scaled for zoom) */}
          {telemetry.trackMapReady && (
            <g id="zoomMapSF" className="map-sf">
              <line
                x1="0"
                y1="-2"
                x2="0"
                y2="2"
                stroke="#fff"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
              <rect
                x="-2.5"
                y="-1.25"
                width="2.5"
                height="1.25"
                fill="#fff"
                opacity="0.9"
              />
              <rect
                x="0"
                y="-1.25"
                width="2.5"
                height="1.25"
                fill="#111"
                stroke="#fff"
                strokeWidth="0.15"
              />
              <rect
                x="-2.5"
                y="0"
                width="2.5"
                height="1.25"
                fill="#111"
                stroke="#fff"
                strokeWidth="0.15"
              />
              <rect
                x="0"
                y="0"
                width="2.5"
                height="1.25"
                fill="#fff"
                opacity="0.9"
              />
            </g>
          )}

          {/* Opponent dots (visible in zoom if nearby) */}
          <g id="zoomMapOpponents">
            {opponents.map((opp, idx) => (
              <circle
                key={idx}
                cx={opp.x}
                cy={opp.y}
                r="1.25"
                fill={opp.inPit ? '#666' : '#ff6b00'}
                opacity={opp.inPit ? 0.6 : 1}
              />
            ))}
          </g>

          {/* Player position */}
          <circle
            className="map-player"
            id="zoomMapPlayer"
            cx={telemetry.playerMapX || 50}
            cy={telemetry.playerMapY || 50}
            r="2"
          />
        </svg>
        <div className="map-zoom-label">Local</div>
      </div>
    </div>
  );
}
