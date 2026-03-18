/**
 * drive-mode.ts — K10 Pro Driver mode for iPad/remote mode
 *
 * This module imports the vanilla JS drive-mode.js module and exposes
 * the initDriveMode and _driveModeUpdate functions to window globals.
 * The CSS is already imported in main.ts.
 *
 * Drive mode automatically activates when:
 * - window._k10RemoteMode = true (set by remote-server.js)
 * - window._k10IsIOS = true (auto-detected iOS device)
 */

// The vanilla JS module is loaded as a global script in the build process.
// We just ensure the window functions exist for telemetry updates.

declare global {
  interface Window {
    initDriveMode?: () => void;
    _driveModeUpdate?: (props: any, isDemo: number) => void;
  }
}

// No action needed — the vanilla drive-mode.js module initializes itself
// when included in the HTML. This module is a placeholder to ensure
// TypeScript knows about the window globals.

export {};
