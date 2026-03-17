import { useMemo, useEffect, useState } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { useSettings } from '@hooks/useSettings';

interface IncidentsPanelProps {
  posClasses?: string;
  panelStyle?: React.CSSProperties;
}

export default function IncidentsPanel({ posClasses, panelStyle }: IncidentsPanelProps) {
  const { telemetry } = useTelemetry();
  const { settings } = useSettings();

  const [_flashKey, setFlashKey] = useState<number>(0);
  const [prevIncidents, setPrevIncidents] = useState<number>(0);

  // Trigger flash animation when incident count increments
  useEffect(() => {
    if (telemetry.incidentCount > prevIncidents) {
      setFlashKey((prev) => prev + 1);
    }
    setPrevIncidents(telemetry.incidentCount);
  }, [telemetry.incidentCount, prevIncidents]);

  // Calculate fill width
  const fillWidth = useMemo(() => {
    const dqLimit = settings.incidentDQLimit || 20;
    return (telemetry.incidentCount / dqLimit * 100);
  }, [telemetry.incidentCount, settings.incidentDQLimit]);

  // Calculate marker positions
  const penaltyMarkerPos = useMemo(() => {
    const dqLimit = settings.incidentDQLimit || 20;
    const penaltyLimit = settings.incidentPenaltyLimit || 10;
    return (penaltyLimit / dqLimit * 100);
  }, [settings.incidentDQLimit, settings.incidentPenaltyLimit]);

  return (
    <div className={`incidents-panel ${posClasses || 'inc-bottom inc-left'}`} id="incidentsPanel" style={panelStyle}>
      <canvas className="inc-gl-canvas" id="incGlCanvas"></canvas>
      <div className="inc-inner">
        <div className="inc-label">Incidents</div>
        <div className="inc-value-row">
          <span className="inc-count">{telemetry.incidentCount}</span>
          <span className="inc-x">x</span>
        </div>
        <div className="inc-progress">
          <div className="inc-bar-track">
            <div className="inc-bar-fill" style={{ width: `${fillWidth}%` }}></div>
            <div className="inc-bar-marker inc-marker-pen" style={{ left: `${penaltyMarkerPos}%` }}></div>
            <div className="inc-bar-marker inc-marker-dq" style={{ left: '100%' }}></div>
          </div>
        </div>
        <div className="inc-thresholds">
          <div className="inc-thresh-row">
            <span>Penalty in</span>
            <span className="inc-thresh-val">{telemetry.gameRunning ? Math.max(0, (settings.incidentPenaltyLimit || 10) - telemetry.incidentCount) : '—'}</span>
          </div>
          <div className="inc-thresh-row">
            <span>DQ in</span>
            <span className="inc-thresh-val">{telemetry.gameRunning ? Math.max(0, (settings.incidentDQLimit || 20) - telemetry.incidentCount) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
