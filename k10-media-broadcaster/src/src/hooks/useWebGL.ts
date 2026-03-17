/**
 * React hook for managing WebGL effects system
 * Handles canvas refs, RAF loop, and lifecycle management
 */

import { useEffect, useRef, useCallback } from 'react';
import { WebGLManager, type CanvasMap } from '../lib/webgl/WebGLManager';

interface UseWebGLOptions {
  enabled?: boolean;
}

export interface WebGLHandle {
  setFlagGLColors: (flagType: string) => void;
  setBonkersGL: (active: boolean) => void;
  setSpotterGlow: (type: string) => void;
  setCommentaryTrailGL: (active: boolean, hue?: number) => void;
  setIncidentsGL: (mode: string) => void;
  triggerLBEvent: (type: string) => void;
  updateLBPlayerPos: (top: number, bottom: number, hasPlayer: boolean) => void;
  setLBHighlightMode: (mode: number) => void;
  setGridFlagGL: (active: boolean) => void;
  setGridFlagColors: (hex1: string, hex2: string, hex3: string) => void;
  updateGLFX: (rpmRatio: number, thr: number, brk: number, clt: number) => void;
}

/**
 * Hook to manage WebGL effects
 * @param canvasRefs - Map of canvas refs for each effect
 * @param options - Configuration options
 * @returns WebGL control methods
 */
export function useWebGL(canvasRefs: CanvasMap, options: UseWebGLOptions = {}): WebGLHandle {
  const managerRef = useRef<WebGLManager | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Initialize WebGL manager
  useEffect(() => {
    if (!options.enabled) return;

    const canvasMap: CanvasMap = {};
    let hasValidCanvas = false;

    // Collect all valid canvas refs
    Object.entries(canvasRefs).forEach(([key, canvas]) => {
      if (canvas instanceof HTMLCanvasElement) {
        canvasMap[key as keyof CanvasMap] = canvas;
        hasValidCanvas = true;
      }
    });

    if (!hasValidCanvas) {
      console.warn('useWebGL: No valid canvas elements provided');
      return;
    }

    // Create and initialize manager
    const manager = new WebGLManager();
    manager.init(canvasMap);
    managerRef.current = manager;

    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [options.enabled, canvasRefs]);

  // AnimationFrame loop
  useEffect(() => {
    if (!managerRef.current || !options.enabled) return;

    const animationLoop = (now: number) => {
      if (managerRef.current) {
        const dt = lastTimeRef.current > 0 ? (now - lastTimeRef.current) / 1000 : 0;
        lastTimeRef.current = now;
        managerRef.current.updateFrame(dt);
      }
      rafRef.current = requestAnimationFrame(animationLoop);
    };

    rafRef.current = requestAnimationFrame(animationLoop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [options.enabled]);

  // Public API methods
  const setFlagGLColors = useCallback((flagType: string) => {
    managerRef.current?.setFlagGLColors(flagType);
  }, []);

  const setBonkersGL = useCallback((active: boolean) => {
    managerRef.current?.setBonkersGL(active);
  }, []);

  const setSpotterGlow = useCallback((type: string) => {
    managerRef.current?.setSpotterGlow(type);
  }, []);

  const setCommentaryTrailGL = useCallback((active: boolean, hue?: number) => {
    managerRef.current?.setCommentaryTrailGL(active, hue);
  }, []);

  const setIncidentsGL = useCallback((mode: string) => {
    managerRef.current?.setIncidentsGL(mode);
  }, []);

  const triggerLBEvent = useCallback((type: string) => {
    managerRef.current?.triggerLBEvent(type);
  }, []);

  const updateLBPlayerPos = useCallback((top: number, bottom: number, hasPlayer: boolean) => {
    managerRef.current?.updateLBPlayerPos(top, bottom, hasPlayer);
  }, []);

  const setLBHighlightMode = useCallback((mode: number) => {
    managerRef.current?.setLBHighlightMode(mode);
  }, []);

  const setGridFlagGL = useCallback((active: boolean) => {
    managerRef.current?.setGridFlagGL(active);
  }, []);

  const setGridFlagColors = useCallback((hex1: string, hex2: string, hex3: string) => {
    managerRef.current?.setGridFlagColors(hex1, hex2, hex3);
  }, []);

  const updateGLFX = useCallback((rpmRatio: number, thr: number, brk: number, clt: number) => {
    managerRef.current?.updateGLFX(rpmRatio, thr, brk, clt);
  }, []);

  return {
    setFlagGLColors,
    setBonkersGL,
    setSpotterGlow,
    setCommentaryTrailGL,
    setIncidentsGL,
    triggerLBEvent,
    updateLBPlayerPos,
    setLBHighlightMode,
    setGridFlagGL,
    setGridFlagColors,
    updateGLFX,
  };
}
