import { useMemo, useEffect, useState } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

/**
 * Parse color string (e.g., "#FF5733" or "rgb(255, 87, 51)") to HSL values
 * for dynamic background tinting.
 */
function getHueFromColor(hex: string): number {
  if (!hex) return 0;

  let r = 0, g = 0, b = 0;

  if (hex.startsWith('#')) {
    const cleanHex = hex.slice(1);
    if (cleanHex.length === 6) {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    } else if (cleanHex.length === 3) {
      r = parseInt((cleanHex[0] ?? '') + (cleanHex[0] ?? ''), 16);
      g = parseInt((cleanHex[1] ?? '') + (cleanHex[1] ?? ''), 16);
      b = parseInt((cleanHex[2] ?? '') + (cleanHex[2] ?? ''), 16);
    }
  }

  // Convert RGB to HSL to get hue
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return Math.round(h * 360);
}

export default function CommentaryPanel() {
  const { telemetry } = useTelemetry();
  const [autoScroll, setAutoScroll] = useState(false);

  // Determine if we need auto-scroll animation
  useEffect(() => {
    if (telemetry.commentaryVisible && telemetry.commentaryText) {
      // Simple heuristic: enable auto-scroll if text is longer than ~80 chars
      setAutoScroll(telemetry.commentaryText.length > 80);
    }
  }, [telemetry.commentaryText, telemetry.commentaryVisible]);

  const commentaryHue = useMemo(() => {
    if (!telemetry.commentaryColor) return 0;
    return getHueFromColor(telemetry.commentaryColor);
  }, [telemetry.commentaryColor]);

  const isVisible = telemetry.commentaryVisible;
  const height = isVisible ? commentaryHue : 0;

  return (
    <div
      className={`commentary-col ${isVisible ? 'visible' : ''}`.trim()}
      id="commentaryCol"
      style={{ '--commentary-h': height } as React.CSSProperties}
    >
      <div className="commentary-inner" id="commentaryInner">
        <div className="commentary-icon" id="commentaryIcon"></div>
        <div className="commentary-title" id="commentaryTitle">{telemetry.commentaryTitle}</div>
        <div className={`commentary-text-scroll ${autoScroll ? 'auto-scroll' : ''}`.trim()} id="commentaryScroll">
          <div className="commentary-text" id="commentaryText">{telemetry.commentaryText}</div>
        </div>
        <canvas className="commentary-gl-canvas" id="commentaryGlCanvas"></canvas>
        <div className="commentary-viz" id="commentaryViz">
          <canvas id="commentaryVizCanvas"></canvas>
          <div className="commentary-viz-value" id="commentaryVizValue"></div>
          <div className="commentary-viz-label" id="commentaryVizLabel"></div>
        </div>
        <div className="commentary-meta" id="commentaryMeta"></div>
      </div>
    </div>
  );
}
