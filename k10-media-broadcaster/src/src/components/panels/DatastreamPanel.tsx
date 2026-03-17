import { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

/**
 * Track the last 40 G-force samples for drawing trails
 */
interface GForceSample {
  latG: number;
  longG: number;
  timestamp: number;
}

/**
 * Draw G-force diamond with trail and current position
 */
function GForceDiamond({
  latG,
  longG,
  samples,
  peakG,
}: {
  latG: number;
  longG: number;
  samples: GForceSample[];
  peakG: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    ctx.fillRect(0, 0, w, h);

    // Diamond size (scale factor)
    const scale = 18;

    // Draw diamond outline (rotated square)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX + scale, centerY); // Right
    ctx.lineTo(centerX, centerY + scale); // Bottom
    ctx.lineTo(centerX - scale, centerY); // Left
    ctx.lineTo(centerX, centerY - scale); // Top
    ctx.closePath();
    ctx.stroke();

    // Draw crosshair grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 1.2, centerY);
    ctx.lineTo(centerX + scale * 1.2, centerY);
    ctx.moveTo(centerX, centerY - scale * 1.2);
    ctx.lineTo(centerX, centerY + scale * 1.2);
    ctx.stroke();

    // Draw trail (last 40 samples, faded)
    if (samples.length > 1) {
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      samples.forEach((sample, i) => {
        const x = centerX + sample.latG * scale;
        const y = centerY + sample.longG * scale;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw current position dot
    const currentX = centerX + latG * scale;
    const currentY = centerY + longG * scale;
    const totalG = Math.sqrt(latG * latG + longG * longG);
    const maxG = Math.max(peakG, 2);
    const ratio = Math.min(totalG / maxG, 1);

    // Gradient from blue (low) to red (high)
    const hue = 240 - ratio * 60; // 240 (blue) to 0 (red)
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Peak G text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${totalG.toFixed(1)}G`, centerX, 2);
  }, [latG, longG, samples, peakG]);

  return <canvas ref={canvasRef} width={128} height={128} id="dsGforceCanvas" />;
}

interface DatastreamPanelProps {
  posClasses?: string;
  panelStyle?: React.CSSProperties;
}

export default function DatastreamPanel({ posClasses, panelStyle }: DatastreamPanelProps) {
  const { telemetry } = useTelemetry();

  const [gforceSamples, setGforceSamples] = useState<GForceSample[]>([]);
  const [peakG, setPeakG] = useState(0);

  // Update G-force samples
  useEffect(() => {
    const sample: GForceSample = {
      latG: telemetry.latG,
      longG: telemetry.longG,
      timestamp: performance.now(),
    };

    setGforceSamples((prev) => {
      const updated = [...prev, sample];
      // Keep last 40 samples
      return updated.slice(-40);
    });

    const totalG = Math.sqrt(telemetry.latG ** 2 + telemetry.longG ** 2);
    setPeakG((prev) => Math.max(prev, totalG));
  }, [telemetry.latG, telemetry.longG]);

  const deltaClass = telemetry.lapDelta < 0 ? 'ds-ahead' : telemetry.lapDelta > 0 ? 'ds-behind' : 'ds-neutral';

  return (
    <div className={`datastream-panel ${posClasses || 'ds-bottom ds-left'}`} id="datastreamPanel" style={panelStyle}>
      <div className="ds-inner">
        <div className="ds-header">Datastream</div>
        <div className="ds-gforce">
          <div className="ds-gforce-diamond">
            <GForceDiamond
              latG={telemetry.latG}
              longG={telemetry.longG}
              samples={gforceSamples}
              peakG={peakG}
            />
          </div>
          <div className="ds-gforce-vals">
            <div className="ds-row" style={{ border: 'none', padding: '0' }}>
              <span className="ds-label">Lat</span>
              <span className="ds-value" id="dsLatG">{telemetry.latG.toFixed(2)}g</span>
            </div>
            <div className="ds-row" style={{ border: 'none', padding: '0' }}>
              <span className="ds-label">Long</span>
              <span className="ds-value" id="dsLongG">{telemetry.longG.toFixed(2)}g</span>
            </div>
            <div className="ds-row" style={{ border: 'none', padding: '0' }}>
              <span className="ds-label">Peak</span>
              <span className="ds-value" id="dsPeakG" style={{ color: 'var(--text-dim)' }}>{peakG.toFixed(2)}g</span>
            </div>
          </div>
        </div>
        <div className="ds-row">
          <span className="ds-label">Yaw</span>
          <span className="ds-value">{telemetry.yawRate.toFixed(2)} r/s</span>
        </div>
        <div className="ds-yaw-bar">
          <div className="ds-yaw-fill" style={{
            width: `${Math.max(0, Math.min(100, 50 + telemetry.yawRate * 5))}%`
          }}></div>
        </div>
        <canvas className="ds-yaw-trail" width="200" height="28"></canvas>
        <div className="ds-row">
          <span className="ds-label">FFB</span>
          <span className="ds-value">{telemetry.steerTorque.toFixed(1)} Nm</span>
        </div>
        <div className="ds-row">
          <span className="ds-label">Delta</span>
          <span className={`ds-value ${deltaClass}`} id="dsDelta">
            {telemetry.lapDelta >= 0 ? '+' : ''}{telemetry.lapDelta.toFixed(3)}
          </span>
        </div>
        <div className="ds-row">
          <span className="ds-label">Track</span>
          <span className="ds-value">{telemetry.trackTemp > 0 ? telemetry.trackTemp.toFixed(0) + '°C' : '—°C'}</span>
        </div>
        <div className="ds-row">
          <span className="ds-label">FPS</span>
          <span className="ds-value" style={{ color: 'var(--text-dim)' }} id="dsFPS">—</span>
        </div>
      </div>
    </div>
  );
}
