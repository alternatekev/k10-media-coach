/**
 * useSecondaryLayout — computes position classes and inline styles for secondary panels
 * (leaderboard, datastream, incidents, spotter) based on the dashboard layout position.
 *
 * Mirrors the logic from the original connections.js applyLayout() function.
 */

import { useMemo } from 'react';
import type { OverlaySettings } from '../types/settings';

interface SecondaryPanelClasses {
  leaderboard: string;   // e.g. "lb-bottom lb-left"
  datastream: string;    // e.g. "ds-bottom ds-left"
  incidents: string;     // e.g. "inc-bottom inc-left"
  spotter: string;       // e.g. "sp-top sp-left"
}

interface SecondaryLayoutResult {
  classes: SecondaryPanelClasses;
  zoomScale: number;
  secOffsetX: string;
  secOffsetY: string;
  /** inline style object for secondary panels */
  panelStyle: React.CSSProperties;
}

export function useSecondaryLayout(settings: OverlaySettings): SecondaryLayoutResult {
  return useMemo(() => {
    const pos = settings.layoutPosition || 'top-right';
    const zoomScale = (settings.zoom || 165) / 100;

    const dashIsBottom = pos.includes('bottom');
    const dashIsRight = pos.includes('right');
    const dashIsCenter = pos.includes('center');

    // Secondary panels default to opposing edges
    // (secVOppose and secHOppose are always true in defaults)
    const secVert = dashIsBottom ? 'top' : 'bottom';

    let secHoriz: string;
    if (dashIsCenter) secHoriz = 'center';
    else secHoriz = dashIsRight ? 'left' : 'right';

    // DS and INC use special center class names
    let dsHoriz = secHoriz;
    let incHoriz = secHoriz;
    if (dashIsCenter) {
      dsHoriz = 'center-left';
      incHoriz = 'center-left';
    }

    // Spotter is on same horizontal side as leaderboard, opposite vertical
    const spHoriz = dashIsCenter ? 'left' : secHoriz;
    const spVert = secVert === 'bottom' ? 'top' : 'bottom';

    const secOffsetX = (settings.secOffsetX || 0) + 'px';
    const secOffsetY = (settings.secOffsetY || 0) + 'px';

    return {
      classes: {
        leaderboard: `lb-${secVert} lb-${secHoriz}`,
        datastream: `ds-${secVert} ds-${dsHoriz}`,
        incidents: `inc-${secVert} inc-${incHoriz}`,
        spotter: `sp-${spVert} sp-${spHoriz}`,
      },
      zoomScale,
      secOffsetX,
      secOffsetY,
      panelStyle: {
        zoom: zoomScale,
        '--sec-offset-x': secOffsetX,
        '--sec-offset-y': secOffsetY,
      } as React.CSSProperties,
    };
  }, [settings.layoutPosition, settings.zoom, settings.secOffsetX, settings.secOffsetY]);
}
