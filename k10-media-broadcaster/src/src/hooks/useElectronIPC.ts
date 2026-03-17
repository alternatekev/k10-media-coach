/**
 * useElectronIPC — listens for Electron global‑shortcut IPC messages
 * forwarded from the main process via preload.js (window.k10).
 *
 * Ctrl+Shift+S → settings‑mode toggle
 * Ctrl+Shift+D → restart demo sequence
 * Ctrl+Shift+M → reset track map
 */

import { useEffect, useCallback, useState } from 'react';

function getK10(): any {
  return (window as any).k10;
}

interface UseElectronIPCOptions {
  /** Called when settings‑mode is toggled (true = open, false = close) */
  onSettingsMode?: (active: boolean) => void;
  /** Called when the demo sequence should restart */
  onRestartDemo?: () => void;
  /** Called when the track map should be reset */
  onResetTrackmap?: () => void;
}

export function useElectronIPC(opts: UseElectronIPCOptions = {}) {
  const [settingsMode, setSettingsMode] = useState(false);

  // Settings mode listener
  useEffect(() => {
    const k10 = getK10();
    if (!k10?.onSettingsMode) return;

    k10.onSettingsMode((active: boolean) => {
      setSettingsMode(active);
      opts.onSettingsMode?.(active);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo restart listener
  useEffect(() => {
    const k10 = getK10();
    if (!k10?.onRestartDemo) return;

    k10.onRestartDemo(() => {
      opts.onRestartDemo?.();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track map reset listener
  useEffect(() => {
    const k10 = getK10();
    if (!k10?.onResetTrackmap) return;

    k10.onResetTrackmap(() => {
      opts.onResetTrackmap?.();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Request interactive mode (makes overlay clickable)
  const requestInteractive = useCallback(async () => {
    const k10 = getK10();
    if (k10?.requestInteractive) await k10.requestInteractive();
  }, []);

  // Release interactive mode (restores click-through)
  const releaseInteractive = useCallback(async () => {
    const k10 = getK10();
    if (k10?.releaseInteractive) await k10.releaseInteractive();
  }, []);

  // Open URL in default browser
  const openExternal = useCallback(async (url: string) => {
    const k10 = getK10();
    if (k10?.openExternal) await k10.openExternal(url);
  }, []);

  // Get dashboard mode (original vs react)
  const getDashboardMode = useCallback(async (): Promise<'original' | 'react'> => {
    const k10 = getK10();
    if (k10?.getDashboardMode) return await k10.getDashboardMode();
    return 'react'; // Default when running in browser
  }, []);

  // Toggle dashboard mode
  const toggleDashboardMode = useCallback(async () => {
    const k10 = getK10();
    if (k10?.toggleDashboardMode) await k10.toggleDashboardMode();
  }, []);

  // Discord OAuth2
  const discordConnect = useCallback(async () => {
    const k10 = getK10();
    if (k10?.discordConnect) return await k10.discordConnect();
    return { success: false, error: 'Not in Electron' };
  }, []);

  const discordDisconnect = useCallback(async () => {
    const k10 = getK10();
    if (k10?.discordDisconnect) return await k10.discordDisconnect();
    return { success: false, error: 'Not in Electron' };
  }, []);

  const getDiscordUser = useCallback(async () => {
    const k10 = getK10();
    if (k10?.getDiscordUser) return await k10.getDiscordUser();
    return null;
  }, []);

  return {
    settingsMode,
    requestInteractive,
    releaseInteractive,
    openExternal,
    getDashboardMode,
    toggleDashboardMode,
    discordConnect,
    discordDisconnect,
    getDiscordUser,
    isElectron: !!getK10(),
  };
}
