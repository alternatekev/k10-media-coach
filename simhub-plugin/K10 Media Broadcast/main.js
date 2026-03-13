// ═══════════════════════════════════════════════════════════════
// K10 Media Broadcast — Electron Overlay
// Transparent, always-on-top, click-through overlay window
// that renders the HTML dashboard over the sim
// ═══════════════════════════════════════════════════════════════

const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ── Platform detection ──────────────────────────────────────
const arch  = os.arch();
const isARM = arch === 'arm64';

// ── ARM compatibility ───────────────────────────────────────
if (isARM) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('--no-sandbox');
}

app.commandLine.appendSwitch('disable-gpu-sandbox');

if (!isARM && process.env.K10_FORCE_SOFTWARE === '1') {
  app.disableHardwareAcceleration();
}

// ── Window bounds persistence ───────────────────────────────
function getBoundsPath() {
  return path.join(app.getPath('userData'), 'window-bounds.json');
}

function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(getBoundsPath(), 'utf8'));
  } catch (e) {
    return null;
  }
}

function saveBounds(bounds) {
  try {
    fs.writeFileSync(getBoundsPath(), JSON.stringify(bounds));
  } catch (e) { /* non-critical */ }
}

let overlayWindow = null;
let settingsMode = false;

function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.bounds;
  const saved = loadBounds();

  // Default size: fit the dashboard, not fullscreen.
  // On x64 with transparency the full screen is fine (transparent areas
  // are invisible). On ARM the window is opaque so we size to content.
  const defaultW = isARM ? 900 : screenW;
  const defaultH = isARM ? 260 : screenH;
  // Default position: top-right corner
  const defaultX = isARM ? screenW - defaultW - 10 : 0;
  const defaultY = isARM ? 10 : 0;

  const winOpts = {
    width:  saved?.width  || defaultW,
    height: saved?.height || defaultH,
    x:      saved?.x      ?? defaultX,
    y:      saved?.y      ?? defaultY,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  };

  if (isARM) {
    winOpts.transparent = false;
    winOpts.backgroundColor = '#00FF00';
  } else {
    winOpts.transparent = true;
  }

  overlayWindow = new BrowserWindow(winOpts);

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'dashboard.html'));
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  // ARM: inject opaque-mode class so panels get solid backgrounds
  if (isARM) {
    overlayWindow.webContents.on('did-finish-load', () => {
      overlayWindow.webContents.executeJavaScript(
        "document.body.classList.add('opaque-mode');"
      );
    });
  }

  overlayWindow.on('moved',   () => saveBounds(overlayWindow.getBounds()));
  overlayWindow.on('resized', () => saveBounds(overlayWindow.getBounds()));
  overlayWindow.on('closed',  () => { overlayWindow = null; });

  // ── Crash recovery ──────────────────────────────────────────
  overlayWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[K10] Renderer crashed:', details.reason);
    if (details.reason === 'crashed' || details.reason === 'killed') {
      setTimeout(() => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.loadFile(path.join(__dirname, 'dashboard.html'));
        }
      }, 2000);
    }
  });

  overlayWindow.webContents.on('unresponsive', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.loadFile(path.join(__dirname, 'dashboard.html'));
    }
  });
}

// ── Settings mode: toggle move/resize ───────────────────────
function enterSettingsMode() {
  if (!overlayWindow) return;
  settingsMode = true;
  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.setFocusable(true);
  overlayWindow.setResizable(true);
  overlayWindow.setMovable(true);
  overlayWindow.focus();
  // Inject drag region so the frameless window can be dragged
  overlayWindow.webContents.executeJavaScript(`
    document.body.classList.add('settings-drag');
  `);
  overlayWindow.webContents.send('settings-mode', true);
  console.log('[K10] Settings mode ON — drag anywhere to move, resize edges, Ctrl+Shift+S to lock');
}

function exitSettingsMode() {
  if (!overlayWindow) return;
  settingsMode = false;
  saveBounds(overlayWindow.getBounds());
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setFocusable(false);
  overlayWindow.setResizable(false);
  overlayWindow.setMovable(false);
  overlayWindow.webContents.executeJavaScript(`
    document.body.classList.remove('settings-drag');
  `);
  overlayWindow.webContents.send('settings-mode', false);
  console.log('[K10] Settings mode OFF — overlay locked');
}

app.whenReady().then(() => {
  const mode = isARM ? 'opaque (green screen)' : 'native transparency';
  console.log(`[K10] Platform: ${os.platform()} ${arch} | Electron ${process.versions.electron} | mode: ${mode}`);
  console.log('[K10] Hotkeys:');
  console.log('[K10]   Ctrl+Shift+S = settings/move mode (drag to reposition)');
  console.log('[K10]   Ctrl+Shift+H = hide/show overlay');
  console.log('[K10]   Ctrl+Shift+R = reset position to default');
  console.log('[K10]   Ctrl+Shift+Q = quit');
  createOverlay();

  // ── GLOBAL HOTKEYS ──

  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) overlayWindow.hide();
      else overlayWindow.show();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (!overlayWindow) return;
    if (settingsMode) exitSettingsMode();
    else enterSettingsMode();
  });

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (!overlayWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().bounds;
    const w = isARM ? 900 : sw;
    const h = isARM ? 260 : sh;
    const x = isARM ? sw - w - 10 : 0;
    const y = isARM ? 10 : 0;
    overlayWindow.setBounds({ x, y, width: w, height: h });
    saveBounds(overlayWindow.getBounds());
    console.log('[K10] Window position reset to default');
  });

  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    app.quit();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});

// ── IPC: Settings persistence ──
ipcMain.handle('get-settings', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'overlay-settings.json');
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    return null;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  const settingsPath = path.join(app.getPath('userData'), 'overlay-settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  return true;
});
