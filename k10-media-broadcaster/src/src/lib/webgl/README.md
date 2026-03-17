# WebGL Effects System (React Port)

This directory contains the ported WebGL2 effects system from the original K10 Media Broadcaster dashboard.

## Overview

The WebGL system manages 11 real-time visual effects rendered on canvas elements throughout the dashboard:

1. **Tachometer** - Bloom glow + heat distortion (tachoGlCanvas)
2. **Pedals** - Edge glow energy indicators (pedalsGlCanvas)
3. **Flag** - Waving cloth animation with patterns (flagGlCanvas)
4. **Leaderboard Player** - Shimmer/glow highlight (lbPlayerGlCanvas)
5. **Leaderboard Event** - Position change/race state effects (lbEventGlCanvas)
6. **K10 Logo** - Subtle chevron drift background (k10LogoGlCanvas)
7. **Spotter** - Edge glow for warning/danger/clear (spotterGlCanvas)
8. **Commentary Trail** - Flowing energy border (commentaryGlCanvas)
9. **Bonkers Pit** - Fire/energy burst (pitGlCanvas)
10. **Incidents** - Penalty/DQ fire glow (incGlCanvas)
11. **Grid Flag** - Aurora-like wisps (gridFlagGlCanvas)

## Architecture

### WebGLManager (`WebGLManager.ts`)

A TypeScript class that manages:
- WebGL2 context creation for all canvas elements
- Compilation and storage of all 11 shader programs
- State management for each effect (time, intensity, colors, etc.)
- Frame rendering via `updateFrame(dt)` method
- Resource cleanup via `dispose()` method

**Key Methods:**
- `init(canvasMap)` - Initialize with canvas refs
- `updateFrame(dt, telemetry?)` - Render all effects (called each frame)
- `dispose()` - Clean up WebGL resources

**Control Methods:**
- `setFlagGLColors(flagType)` - Set flag pattern/colors
- `setBonkersGL(active)` - Toggle pit fire effect
- `setSpotterGlow(type)` - Set spotter glow mode (warn/danger/clear)
- `setCommentaryTrailGL(active, hue?)` - Control commentary trail with optional hue
- `setIncidentsGL(mode)` - Set incidents mode (penalty/dq)
- `triggerLBEvent(type)` - Trigger leaderboard event animation
- `updateLBPlayerPos(top, bottom, hasPlayer)` - Update player highlight position
- `setLBHighlightMode(mode)` - Set leaderboard highlight color mode
- `setGridFlagGL(active)` - Toggle grid flag effect
- `setGridFlagColors(hex1, hex2, hex3)` - Set grid flag colors
- `updateGLFX(rpmRatio, thr, brk, clt)` - Update telemetry data for effects

### WebGLProvider (`../components/layout/WebGLProvider.tsx`)

A React Context Provider that:
- Initializes WebGLManager after DOM is ready
- Manages requestAnimationFrame loop for rendering
- Respects `settings.showWebGL` toggle
- Provides manager instance via `useWebGLManager()` hook
- Handles cleanup on unmount

### useWebGL Hook (`../hooks/useWebGL.ts`)

An optional custom hook for component-level WebGL integration:
```typescript
const handle = useWebGL(canvasMap, { enabled: true });
handle.setBonkersGL(true);
```

## Integration Points

All canvas elements are already in place in components:

- **Tachometer.tsx** - `<canvas id="tachoGlCanvas" />`
- **PedalsPanel.tsx** - `<canvas id="pedalsGlCanvas" />`
- **GapsPanel.tsx** - `<canvas id="flagGlCanvas" />`
- **LeaderboardPanel.tsx** - `<canvas id="lbPlayerGlCanvas" />` and `<canvas id="lbEventGlCanvas" />`
- **LogoPanel.tsx** - `<canvas id="k10LogoGlCanvas" />`
- **SpotterPanel.tsx** - `<canvas id="spotterGlCanvas" />`
- **CommentaryPanel.tsx** - `<canvas id="commentaryGlCanvas" />`
- **PitLimiterBanner.tsx** - `<canvas id="pitGlCanvas" />`
- **IncidentsPanel.tsx** - `<canvas id="incGlCanvas" />`
- **GridModule.tsx** - `<canvas id="gridFlagGlCanvas" />`

## Shader Code

All GLSL shader code is embedded directly in the WebGLManager class as string constants. This includes:

- **Vertex shaders** - Standard fullscreen quad shader (reused across all effects)
- **Fragment shaders** - Custom shader per effect with all original code preserved

### Key Shaders:

- **Tachometer**: Bloom glow, heat distortion, redline pulse, CRT scanlines
- **Pedals**: Edge glow with per-pedal colors (green throttle, red brake, blue clutch)
- **Flag**: Waving cloth with 5 pattern types (solid, stripes, checkerboard, diagonal, circles)
- **Leaderboard**: Shimmer sweep, edge glow, P1 sparkles
- **K10 Logo**: SDF chevron shapes with subtle drift animation
- **Spotter**: Edge/corner glow with pulse and sweep beam
- **Commentary**: Rounded border with flow trails and hue-driven colors
- **Bonkers**: Turbulent fire with energy arcs and heat shimmer
- **Incidents**: Fire with hue shift for penalty vs DQ modes
- **Grid Flag**: Aurora wisps with edge glow and spark particles

## Performance Optimization

Effects only render when active:
- **Flag effect** only renders when `flagVisible = true`
- **Leaderboard player** only renders when `lbHasPlayer = true`
- **Spotter/Commentary/Bonkers** only render when intensity > 0.005
- **Leaderboard event** only renders while animation is within duration

DPR (devicePixelRatio) compensation ensures effects look consistent on HiDPI screens.

## Integration with Telemetry

Effects are updated with telemetry data via:
```typescript
manager.updateGLFX(rpmRatio, throttle, brake, clutch);
manager.updateLBPlayerPos(top, bottom, hasPlayer);
```

This is typically called from the telemetry update loop or game event handlers.

## Settings Integration

The system respects the `settings.showWebGL` toggle:
- When disabled, no rendering occurs and resources are cleaned up
- When re-enabled, everything reinitializes

## Browser Compatibility

Requires WebGL2 support. Gracefully degrades if unavailable:
- Individual canvases return null on context creation failure
- Effects simply don't render but don't crash the app
- Console warnings indicate which canvases couldn't initialize

## Original Code Reference

Original JavaScript implementation:
- `K10 Media Broadcaster/modules/js/webgl.js` (1928 lines)
- `K10 Media Broadcaster/modules/js/webgl-helpers.js`

All shader code, algorithms, and timing/intensity values have been preserved exactly from the original.

## Usage Example

```typescript
// In a component that needs to control effects:
import { useWebGLManager } from '@components/layout/WebGLProvider';

export function MyComponent() {
  const manager = useWebGLManager();

  const handleRaceStart = () => {
    manager?.triggerLBEvent('green');
  };

  const handlePenalty = () => {
    manager?.setIncidentsGL('penalty');
  };

  return (
    // ... component JSX
  );
}
```

## Troubleshooting

### Canvas elements not found
- Ensure canvases are mounted in DOM before WebGLProvider initializes
- Check browser console for "No valid canvas elements found" warning

### Effects not rendering
- Verify `settings.showWebGL` is true
- Check browser console for shader compilation errors
- Ensure WebGL2 is available (check browser support)

### Performance issues
- Monitor with browser DevTools Performance tab
- Check if too many effects are active simultaneously
- Verify no shader compilation errors (check console)

### Colors look wrong
- Check devicePixelRatio compensation (DPR uniforms)
- Verify RGB vs sRGB color space consistency
- Check blend mode settings

## Future Enhancements

- Add effect presets (minimal, standard, intense)
- Per-effect enable/disable toggles
- Customizable shader parameters
- Performance monitoring/FPS counter
- HDR support for more intense effects
