import { useMemo, useEffect, useState } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

/**
 * Maps topic IDs to inline SVG icon strings (24x24 viewBox)
 */
function getTopicIcon(topicId: string): string {
  const icons: Record<string, string> = {
    // Car response
    spin_catch: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3m0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>',
    high_cornering_load: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    car_balance_sustained: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',

    // Hardware
    heavy_braking: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    abs_activation: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
    tc_intervention: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z"/></svg>',

    // Settings
    brake_bias_change: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>',
    tc_setting_change: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>',

    // Racing events
    position_gained: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18 9.41 12l4 4 6.3-6.29L20 12v-6z"/></svg>',
    position_lost: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6 9.41 12l4-4 6.3 6.29L20 12v6z"/></svg>',
    close_battle: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z"/></svg>',
    personal_best: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',

    // Tyres
    hot_tyres: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
    tyre_wear_high: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>',

    // Game feel
    drs_active: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    ers_low: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 23h2v-2h-2v2zm0-16h2V5h-2v2zm6-6h2V1h-2v2zM7 9h2V7H7v2zm13.03-7.08l-1.41-1.41-1.41 1.41C16.5 3.21 14.35 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-2.35-1.21-4.5-3.03-5.66l1.41-1.42zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>',

    // Incidents
    wall_contact: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    kerb_hit: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    off_track: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z"/></svg>',
  };

  return icons[topicId] ?? icons.car_balance_sustained ?? ''; // Default icon
}

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

  return (
    <div
      className={`commentary-col ${isVisible ? 'visible' : ''}`.trim()}
      id="commentaryCol"
      style={{ '--commentary-h': commentaryHue } as React.CSSProperties}
    >
      <div className="commentary-inner" id="commentaryInner">
        <div
          className="commentary-icon"
          id="commentaryIcon"
          dangerouslySetInnerHTML={{
            __html: getTopicIcon(telemetry.commentaryTopicId || 'car_balance_sustained'),
          }}
          style={{ color: `hsl(${commentaryHue}, 70%, 60%)` }}
        ></div>
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
