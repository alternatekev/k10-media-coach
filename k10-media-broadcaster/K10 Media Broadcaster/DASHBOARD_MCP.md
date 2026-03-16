# K10 Media Broadcaster — Dashboard Architecture MCP

## Quick Reference

**Production dashboard**: `K10 Media Broadcaster/dashboard.html` (assembly file, ~440 lines)
**CSS modules**: `modules/styles/*.css` (8 files)
**JS modules**: `modules/js/*.js` (19 files)
**Tests**: `tests/*.spec.mjs` (Playwright)
**Test helpers**: `tests/helpers.mjs`
**Electron main**: `main.js` (IPC handlers, window management, Discord OAuth)
**Electron preload**: `preload.js` (IPC bridge → `window.k10`)

No bundler. All modules load via `<link>` and `<script src>` tags in dashboard.html. Everything runs in Electron's `file://` protocol with global scope.

---

## Architecture

### File Layout

```
K10 Media Broadcaster/
├── dashboard.html          ← Assembly file: HTML structure + module includes
├── main.js                 ← Electron main process
├── preload.js              ← IPC bridge (window.k10)
├── modules/
│   ├── styles/
│   │   ├── base.css        ← CSS variables, reset, fonts, shared utilities
│   │   ├── dashboard.css   ← Main HUD layout (grid, panels, tachometer, pedals)
│   │   ├── leaderboard.css ← Leaderboard panel positioning & styling
│   │   ├── datastream.css  ← Telemetry datastream panel
│   │   ├── effects.css     ← Animations, flag effects, flash transitions
│   │   ├── settings.css    ← Settings overlay, toggles, layout controls
│   │   ├── connections.css ← Discord/SimHub connection cards
│   │   └── rally.css       ← Rally mode overrides (.game-rally, .rally-only, .circuit-only)
│   └── js/
│       ├── config.js       ← Constants, globals, SIMHUB_URL, PROP_KEYS, _settings, _mfrMap
│       ├── keyboard.js     ← Keyboard shortcuts (Ctrl+Shift+S, etc.)
│       ├── car-logos.js    ← SVG logo paths by manufacturer key
│       ├── game-detect.js  ← Game ID detection, features map, conn status, fetchProps()
│       ├── webgl-helpers.js← Shader compilation, buffer setup utilities
│       ├── settings.js     ← Settings UI, toggles, layout, zoom, persistence
│       ├── connections.js  ← Discord OAuth, SimHub cards, rally toggle sync, loadSettings/saveSettings
│       ├── leaderboard.js  ← Leaderboard rendering & update logic
│       ├── datastream.js   ← Telemetry stream panel rendering
│       ├── race-control.js ← Race control messages, flag display
│       ├── race-timeline.js← Race progress timeline bar
│       ├── incidents.js    ← Incident counter & alerts
│       ├── pit-limiter.js  ← Pit limiter overlay
│       ├── race-end.js     ← Race end screen
│       ├── formation.js    ← Grid/formation lap overlay
│       ├── spotter.js      ← Proximity spotter panel
│       ├── fps.js          ← Frame rate counter
│       ├── webgl.js        ← WebGL shader programs (pedal glow, flag anim, tacho FX, lb effects)
│       └── poll-engine.js  ← Main orchestrator: polling loop, game detection, applyGameMode()
└── tests/
    ├── helpers.mjs         ← MOCK_TELEMETRY, MOCK_DEMO, loadDashboard(), updateMockData()
    ├── discord-oauth.spec.mjs ← PKCE OAuth unit + integration tests
    └── dashboard.spec.mjs  ← Dashboard rendering tests (if exists)
```

### Load Order (Critical)

JS modules must load in this exact order (dependency chain):

1. `config.js` — defines all globals, constants, `_settings`, `_mfrMap`
2. `keyboard.js` — keyboard event listeners
3. `car-logos.js` — populates `_logoSVGs` map
4. `game-detect.js` — `detectGameId()`, `isGameAllowed()`, `isRallyGame()`, `fetchProps()`, `_updateConnStatus()`
5. `webgl-helpers.js` — shader utils (used by webgl.js)
6. `settings.js` — `applySettings()`, `_defaultSettings`, layout functions, zoom
7. `connections.js` — Discord/SimHub, `toggleRallyMode()`, `toggleLayoutRally()`, `loadSettings()`, `saveSettings()`, `initDiscordState()`
8. `leaderboard.js` through `spotter.js` — panel renderers (independent)
9. `fps.js` — performance counter
10. `webgl.js` — shader programs
11. `poll-engine.js` — starts polling loop, calls `applyGameMode()`, main `pollUpdate()`

### Global State Variables (defined in config.js)

```javascript
let _currentGameId = '';       // 'iracing', 'acc', 'acevo', 'acrally', 'lmu', 'raceroom', 'eawrc', 'forza'
let _isIRacing = true;         // shorthand for _currentGameId === 'iracing'
let _isRally = false;          // isRallyGame() || _rallyModeEnabled
let _rallyModeEnabled = false; // user toggle
let _discordUser = null;       // Discord user object or null
let _settings = {};            // merged from _defaultSettings + saved
let _connFails = 0;            // connection failure counter for backoff
let _backoffUntil = 0;         // timestamp for exponential backoff
let _pollFrame = 0;            // frame counter
```

---

## Patterns & Conventions

### Adding a New Settings Toggle

1. Add default value to `_defaultSettings` in `settings.js`
2. Add HTML toggle in the appropriate settings section of `dashboard.html`:
   ```html
   <label class="settings-toggle" data-key="myKey" data-section="mySectionClass"><span>Label</span></label>
   ```
3. The `applySettings()` function auto-syncs toggles with `data-key` to `_settings[key]`
4. Section visibility: `data-section` maps to a CSS class or ID that gets `.section-hidden` toggled

### Adding a Discord-Gated Feature

1. Add the toggle with class `disabled` and an `id`:
   ```html
   <label class="settings-toggle disabled" id="myToggle" onclick="toggleMyFeature(this)">
     <span>Feature</span>
     <span class="toggle-hint" id="myToggleHint">Connect Discord to enable</span>
   </label>
   ```
2. In `connections.js`, add an update function called from `updateDiscordConnectionCard()`:
   ```javascript
   function updateMyToggle() {
     const el = document.getElementById('myToggle');
     if (_discordUser) { el.classList.remove('disabled'); }
     else { el.classList.add('disabled'); }
   }
   ```
3. In the click handler, check `if (el.classList.contains('disabled')) return;`

### Adding a New Game

1. **C# plugin** (`TelemetrySnapshot.Capture.cs`): Add to `GameId` enum, add case to `DetectGame()`, add game-specific property routing in `GetGameBrakeBias()`, `GetGameTC()`, `GetGameABS()`, `GetGameSessionFlags()`, etc.
2. **JS game-detect** (`game-detect.js`): Add to `GAME_FEATURES` map, add string match to `detectGameId()`
3. **JS config** (`config.js`): Add manufacturer entries to `_mfrMap` if new brands are needed

### SimHub Telemetry Flow

```
SimHub → Plugin.cs (C#) → TelemetrySnapshot → HTTP JSON at :8889/k10mediabroadcaster/
  → fetchProps() (JS) → pollUpdate() → update DOM elements
```

Property keys follow the pattern:
- `DataCorePlugin.GameData.*` — standard SimHub properties
- `DataCorePlugin.GameRawData.Telemetry.*` — raw game telemetry
- `IRacingExtraProperties.iRacing_*` — iRacing-specific
- `K10MediaBroadcaster.Plugin.*` — custom plugin properties (commentary, demo mode, game ID)

### Demo Mode

When `K10MediaBroadcaster.Plugin.DemoMode` is 1, the dashboard reads from `K10MediaBroadcaster.Plugin.Demo.*` keys instead of standard telemetry keys. This allows testing without a running game.

### CSS Game Mode Classes

Applied to `<body>` by `applyGameMode()`:
- `game-iracing` — iRacing detected
- `game-rally` — rally game or rally mode enabled
- `game-acc` — ACC detected
- `game-lmu` — LMU detected

Element visibility classes:
- `.ir-only` — shown only when game has iRating
- `.incident-only` — shown only when game has incidents
- `.rally-only` — shown only in rally mode
- `.circuit-only` — hidden in rally mode

### WebGL Shaders

Four shader programs in `webgl.js`:
1. **Pedal glow** — bloom effect on pedal histograms
2. **Flag animation** — waving flag effect on flag overlay canvas
3. **Tachometer FX** — rev-matching glow on tacho segments
4. **Leaderboard effects** — position change highlight effects

All use `gl-overlay` class canvases positioned absolutely over their parent elements.

### Electron IPC Bridge (`window.k10`)

```javascript
window.k10 = {
  getSettings: () => Promise<object>,
  saveSettings: (settings) => Promise<void>,
  onSettingsMode: (callback) => void,        // Ctrl+Shift+S events
  requestInteractive: () => Promise<void>,   // make window focusable
  releaseInteractive: () => Promise<void>,   // restore click-through
  getGreenScreenMode: () => Promise<boolean>,
  restartApp: () => Promise<void>,
  openExternal: (url) => Promise<void>,      // open in default browser
  discordConnect: () => Promise<{success, user, error}>,
  discordDisconnect: () => Promise<void>,
  getDiscordUser: () => Promise<object|null>,
};
```

---

## Testing

### Test Setup (Playwright)

Tests use `tests/helpers.mjs` which provides:
- `MOCK_TELEMETRY` — realistic mid-race iRacing data
- `MOCK_DEMO` — demo mode data with `K10MediaBroadcaster.Plugin.Demo.*` keys
- `loadDashboard(page, overrideData)` — loads dashboard.html with fetch intercepted
- `updateMockData(page, data)` — re-routes fetch mid-test

### Running Tests

```bash
npx playwright test                           # all tests
npx playwright test tests/discord-oauth.spec.mjs  # specific test file
```

### Test Convention

Tests use `@playwright/test` with `test.describe()` blocks. Mock data is served via `page.route()` intercepting requests matching `/k10mediabroadcaster/`.

---

## Common Modifications

### Changing layout position options
Edit `_layoutPositionMap` in `settings.js` and the `<select id="layoutPosition">` in `dashboard.html`.

### Adjusting polling rate
Change `POLL_MS` in `config.js` (default: 33ms ≈ 30fps).

### Adding a new secondary panel
1. Add HTML in dashboard.html inside `#secondaryPanels`
2. Add toggle in settings section with `data-key` and `data-section`
3. Add positioning logic in `applyLayout()` in `settings.js`
4. Create renderer module in `modules/js/`
5. Add `<script src>` tag before `poll-engine.js`

### Modifying the settings panel
The settings overlay is in dashboard.html lines 286-396. Sections use `<div class="settings-section">` with `<h3>` headers. Toggles are `<label class="settings-toggle" data-key="..." data-section="...">`.
