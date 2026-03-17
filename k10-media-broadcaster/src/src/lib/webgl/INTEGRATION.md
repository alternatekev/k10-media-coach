# WebGL Effects System - Integration Guide

## Quick Start

The WebGL system is automatically initialized when the app loads (via `WebGLProvider` in `App.tsx`). All 11 effects start rendering immediately to their respective canvas elements.

## Using Effects from Components

### Method 1: Context Hook (Recommended)

```typescript
import { useWebGLManager } from '@components/layout/WebGLProvider';

export function MyComponent() {
  const manager = useWebGLManager();

  const handleEvent = () => {
    // Control effects
    manager?.setBonkersGL(true);
    manager?.triggerLBEvent('p1');
    manager?.setSpotterGlow('danger');
  };

  return <div>...</div>;
}
```

### Method 2: Component-Level Hook

```typescript
import { useWebGL } from '@hooks/useWebGL';

export function MyComponent() {
  const canvasRefs = {
    tachoGlCanvas: document.getElementById('tachoGlCanvas'),
    // ... other refs
  };

  const gl = useWebGL(canvasRefs, { enabled: true });

  return <div>...</div>;
}
```

## Common Use Cases

### 1. Flag Effects (Gaps Panel / GapsPanel.tsx)

Trigger flag animations when safety cars/flags are deployed:

```typescript
const manager = useWebGLManager();

// Show yellow flag
manager?.setFlagGLColors('yellow');

// Show checkered flag
manager?.setFlagGLColors('checkered');

// Hide flag
manager?.setFlagGLColors('invalid'); // Any undefined type hides it
```

**Available flag types:**
- `yellow`, `red`, `blue`, `green`, `white`, `debris`, `checkered`, `black`, `meatball`, `orange`

### 2. Tachometer (Tachometer.tsx)

Update RPM data automatically:

```typescript
const manager = useWebGLManager();

const rpmRatio = telemetry.rpm / telemetry.maxRpm;
manager?.updateGLFX(rpmRatio, throttle, brake, clutch);
```

The tachometer effect responds to RPM changes automatically with:
- Color shifts (green → yellow → red → redline)
- Bloom intensity scaling with RPM
- Heat distortion at high RPM
- Redline pulse and flash effects

### 3. Spotter Glow (SpotterPanel.tsx)

Control glow based on spotter message severity:

```typescript
const manager = useWebGLManager();

// Warning state - warm amber glow
manager?.setSpotterGlow('warn');

// Danger state - urgent red with flicker
manager?.setSpotterGlow('danger');

// All clear - cool green glow
manager?.setSpotterGlow('clear');

// Off
manager?.setSpotterGlow('off');
```

### 4. Leaderboard Effects (LeaderboardPanel.tsx)

Highlight player position and trigger events:

```typescript
const manager = useWebGLManager();

// Update player row highlight position
const inner = document.querySelector('.lb-inner');
const playerRow = document.querySelector('.lb-row.lb-player');
if (inner && playerRow) {
  const ir = inner.getBoundingClientRect();
  const pr = playerRow.getBoundingClientRect();
  const top = (pr.top - ir.top) / ir.height;
  const bottom = (pr.bottom - ir.top) / ir.height;
  manager?.updateLBPlayerPos(top, bottom, true);
}

// Set highlight mode
// 0 = blue (same), 1 = green (ahead), 2 = red (behind), 3 = gold (P1)
manager?.setLBHighlightMode(0);

// Trigger events
manager?.triggerLBEvent('gain');    // Position gain - quick edge flash
manager?.triggerLBEvent('lose');    // Position loss - red flash
manager?.triggerLBEvent('p1');      // Now leading - gold celebration
manager?.triggerLBEvent('green');   // Race start - flag sweep
manager?.triggerLBEvent('finish');  // Race finish - checkered pattern
```

### 5. Commentary Trail (CommentaryPanel.tsx)

Add flowing energy border when commentary is active:

```typescript
const manager = useWebGLManager();

// Activate with default hue (cyan ~200°)
manager?.setCommentaryTrailGL(true);

// Activate with custom hue (0-360)
manager?.setCommentaryTrailGL(true, 30);   // Orange
manager?.setCommentaryTrailGL(true, 120);  // Green
manager?.setCommentaryTrailGL(true, 240);  // Blue

// Deactivate (fades out smoothly)
manager?.setCommentaryTrailGL(false);
```

### 6. Pit Limiter Banner (PitLimiterBanner.tsx)

Fire effect when pit limiter is active:

```typescript
const manager = useWebGLManager();

manager?.setBonkersGL(true);   // Activate fire
manager?.setBonkersGL(false);  // Deactivate (fades out)
```

### 7. Incidents Panel (IncidentsPanel.tsx)

Different effects for different penalties:

```typescript
const manager = useWebGLManager();

// Penalty - yellower, subtler fire
manager?.setIncidentsGL('penalty');

// Disqualification - full red fire
manager?.setIncidentsGL('dq');

// Clear
manager?.setIncidentsGL('');
```

### 8. Grid Module (GridModule.tsx)

Aurora-like wisp effect for grid position cards:

```typescript
const manager = useWebGLManager();

// Activate effect
manager?.setGridFlagGL(true);

// Set colors (hex format)
manager?.setGridFlagColors('#4A9EFF', '#9DB3FF', '#5FA8FF');

// Deactivate
manager?.setGridFlagGL(false);
```

### 9. Logo Panel (LogoPanel.tsx)

The K10 logo chevron drift runs continuously with no manual control needed.

### 10. Pedals Panel (PedalsPanel.tsx)

Updates automatically via telemetry:

```typescript
const manager = useWebGLManager();

// This is called from main telemetry loop
manager?.updateGLFX(rpmRatio, throttle, brake, clutch);
```

The effect shows:
- Right side glow for throttle (green)
- Left side glow for brake (red)
- Right side glow for clutch (blue)
- Pulsing intensity based on input values

## Effect State Management

### Exponential Smoothing

Most effects use exponential smoothing for intensity transitions:

```typescript
// Intensity ramps up quickly (to ~1.0 in 0.4s)
speed = 2.5;
intensity = Math.min(1, intensity + dt * speed);

// Fades out more slowly
speed = 3.0;
intensity = Math.max(0, intensity - dt * speed);
```

This creates smooth, natural-feeling transitions without harsh snaps.

### Time-Based Animation

All effects accumulate time independently:
- Each effect has its own `_*Time` variable
- Time is NOT reset on frame (accumulates each frame by `dt`)
- This drives periodic animations (pulsing, sweeping, drifting)

### DPR Compensation

The tachometer and pedals effects compensate for `devicePixelRatio`:
- On 1× screens: effects look as designed
- On 2× (Retina) screens: bloom spread is adjusted so effects look equivalent
- Uses quadratic scaling: `dpr2 = dprScale * dprScale`

## Settings Integration

Check `settings.showWebGL`:
- When `true`: effects render
- When `false`: no rendering, resources cleaned up
- Change is detected automatically via `WebGLProvider`

## Performance Notes

### Rendering Frequency
- All effects render every frame via RAF loop
- Total overhead is typically 2-5ms on modern hardware

### Effect Culling
Effects don't render when:
- Flag effect: `flagVisible === false`
- LB player: `lbHasPlayer === false`
- Spotter: `intensity < 0.005`
- Commentary: `intensity < 0.005`
- Bonkers: `intensity <= 0`
- Incidents: `intensity <= 0`
- Grid flag: `intensity <= 0`

### Canvas Sizing
Canvases auto-resize to match parent element:
```typescript
const r = canvas.parentElement.getBoundingClientRect();
const w = Math.round(r.width * dpr);
const h = Math.round(r.height * dpr);
```

## Debugging

### Enable/Disable Effects

```typescript
const manager = useWebGLManager();

// Disable all effects except one
manager?.setFlagGLColors('invalid');
manager?.setBonkersGL(false);
manager?.setSpotterGlow('off');
// ... etc

// Then enable the one you want to debug
manager?.setSpotterGlow('warn');
```

### Check Canvas Elements

```javascript
// In browser console
document.getElementById('tachoGlCanvas'); // Should be HTMLCanvasElement
document.getElementById('tachoGlCanvas').getContext('webgl2'); // Should work
```

### Monitor Performance

```javascript
// Add to telemetry loop
const start = performance.now();
manager.updateFrame(dt);
const elapsed = performance.now() - start;
console.log(`WebGL render: ${elapsed.toFixed(2)}ms`);
```

### Check Shader Errors

The browser console will show shader compilation errors if shaders are invalid. Example:
```
Shader compile: ERROR: 0:15: 'invalid_function' : no matching overloaded function found
```

## Color Formats

### RGB Values (0-1 range)
```typescript
// Used in shader uniforms
[0.92, 0.22, 0.20]  // Red
[0.18, 0.82, 0.34]  // Green
[0.25, 0.45, 0.80]  // Blue
```

### Hex Values (for grid flag colors)
```typescript
manager?.setGridFlagColors('#FF0000', '#00FF00', '#0000FF');
```

Converted to linear RGB internally:
```typescript
hex = '#FF0000'
r = 255 / 255 = 1.0
g = 0 / 255 = 0.0
b = 0 / 255 = 0.0
```

### HSL Values (for commentary trail)
```typescript
// 0-360 degrees
0    = Red
60   = Yellow
120  = Green
180  = Cyan (default ~200)
240  = Blue
300  = Magenta
```

## Common Patterns

### Race Start Sequence

```typescript
const manager = useWebGLManager();

// 1. Position cars on grid
manager?.setGridFlagGL(true);
manager?.setGridFlagColors('#4A9EFF', '#9DB3FF', '#5FA8FF');

// 2. Race about to start
manager?.setCommentaryTrailGL(true, 180); // Cyan
manager?.triggerLBEvent('green');        // Flag sweep

// 3. Race running
manager?.setGridFlagGL(false);
manager?.setCommentaryTrailGL(false);
```

### Penalty Sequence

```typescript
const manager = useWebGLManager();

// Driver receives penalty
manager?.setIncidentsGL('penalty');
manager?.triggerLBEvent('lose');
manager?.setSpotterGlow('warn');

// After 5 seconds
setTimeout(() => {
  manager?.setIncidentsGL('');
  manager?.setSpotterGlow('off');
}, 5000);
```

### Position Change

```typescript
const manager = useWebGLManager();

// Driver gains position
manager?.triggerLBEvent('gain');
manager?.setCommentaryTrailGL(true, 120); // Green

// Driver loses position
manager?.triggerLBEvent('lose');
manager?.setCommentaryTrailGL(true, 0);   // Red
```

## Migration from Original System

The original system stored state in global `window` variables:
- `window._tachoRpm`
- `window._pedalValues`
- `window._flagVisible`
- etc.

The new system encapsulates this in the `WebGLManager` class. To migrate existing code:

**Before:**
```javascript
window.setFlagGLColors('yellow');
```

**After:**
```typescript
const manager = useWebGLManager();
manager?.setFlagGLColors('yellow');
```

All method signatures remain identical for easy migration.
