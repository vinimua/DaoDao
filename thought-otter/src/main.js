"use strict";

const { app, BrowserWindow, screen, ipcMain, Menu, Tray, nativeImage, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const createPetWindowRuntime = require("./pet-window-runtime");
const prefsModule = require("./prefs");
const dbModule = require("./db");
const thoughtService = require("./thought-service");
const shortcutRuntime = require("./shortcut-runtime");
const quickInputRuntime = require("./quick-input-runtime");
const todayPanelRuntime = require("./today-panel-runtime");
const dragParser = require("./drag-parser");
const { createStateMachine } = require("./state");
const { createSchedulerService } = require("./scheduler-service");
const { createCheerService } = require("./cheer-service");
const { getPrimaryWorkAreaSafe } = require("./work-area");
const settingsRuntime = require("./settings-runtime");

const BUBBLE_MAX_ITEMS = 4;

// ── Platform detection ──
const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";

// ── Prevent multiple instances ──
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
  return;
}

// ── Quit tracking ──
let isQuitting = false;

// ── Prefs path ──
const DATA_DIR = path.join(app.getPath("userData"), "DaoDao");
const PREFS_PATH = path.join(DATA_DIR, "prefs.json");

// Ensure data directory exists
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// ── Initialize database ──
dbModule.init(dbModule.getDbPath(DATA_DIR));

// ── Load prefs ──
let _prefsLoadResult = prefsModule.load(PREFS_PATH);
let _prefsLocked = _prefsLoadResult.locked;
let _prefsSnapshot = _prefsLoadResult.snapshot;
if (!_prefsLocked && _prefsSnapshot.size < 260) {
  _prefsSnapshot = prefsModule.validate({
    ..._prefsSnapshot,
    size: 260,
    positionSaved: false,
  });
}

// ── Save prefs helper ──
function flushPrefs() {
  if (_prefsLocked) return;
  try {
    prefsModule.save(PREFS_PATH, _prefsSnapshot);
  } catch (err) {
    console.error("[prefs] failed to save:", err.message);
  }
}

// ── Merge prefs update ──
// Persist load-time migrations, such as default shortcut changes, before
// registering runtime hooks that depend on the migrated snapshot.
flushPrefs();

function updatePrefs(partial) {
  if (_prefsLocked) return _prefsSnapshot;
  _prefsSnapshot = prefsModule.merge(_prefsSnapshot, partial);
  flushPrefs();
  return _prefsSnapshot;
}

// ── Theme ──

// ── Otter state machine ──
const stateMachine = createStateMachine({
  onChange: (state, prev, reason) => {
    console.log(`[otter] ${prev || "?"} → ${state}${reason ? ` (${reason})` : ""}`);
    const renderWindow = petRuntime.getRenderWindow();
    if (renderWindow && !renderWindow.isDestroyed()) {
      renderWindow.webContents.send("otter:state-changed", {
        state,
        prevState: prev || null,
        reason: reason || null,
      });
    }
  },
});

// ── Pet window runtime ──
const petRuntime = createPetWindowRuntime({
  screen,
  BrowserWindow,
  preloadPath: path.join(__dirname, "preload.js"),
  hitPreloadPath: path.join(__dirname, "preload-hit.js"),
  indexPath: path.join(__dirname, "index.html"),
  hitPath: path.join(__dirname, "hit.html"),
  initialSize: _prefsSnapshot.size,
  initialX: _prefsSnapshot.positionSaved ? _prefsSnapshot.x : undefined,
  initialY: _prefsSnapshot.positionSaved ? _prefsSnapshot.y : undefined,
  topmostLevel: isWin ? "pop-up-menu" : undefined,
  isQuitting: () => isQuitting,
  onPositionChanged: (bounds) => {
    updatePrefs({
      x: bounds.x,
      y: bounds.y,
      positionSaved: true,
    });
  },
  onSizeChanged: (newSize) => {
    updatePrefs({ size: newSize });
  },
});

// ── Create pet windows ──
function createWindows() {
  petRuntime.createRenderWindow();
  petRuntime.createHitWindow();
}

// ── Quick input window ──
let quickInputWin = null;
let tray = null;
let settingsWin = null;
let lastTodayIds = []; // track IDs from last /today for /delete N indexing

function isQuickInputOpen() {
  return quickInputWin !== null && !quickInputWin.isDestroyed();
}

// Aggressive multi-attempt focus — Windows can be stubborn about giving
// keyboard focus to newly-created frameless windows.
function focusQuickInputWindow(win) {
  if (!win || win.isDestroyed()) return;
  if (typeof app.focus === "function") {
    try { app.focus({ steal: true }); } catch {}
  }
  win.show();
  if (typeof win.moveTop === "function") {
    try { win.moveTop(); } catch {}
  }
  // Attempt 0: immediate
  win.focus();
  if (win.webContents) {
    win.webContents.focus();
    win.webContents.executeJavaScript(
      'var el=document.getElementById("thought-input");if(el){el.focus();el.select();}'
    ).catch(() => {});
  }
  // Attempt 1: 50ms
  setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    win.focus();
    if (win.webContents) {
      win.webContents.focus();
      win.webContents.executeJavaScript(
        'document.getElementById("thought-input")?.focus()'
      ).catch(() => {});
    }
  }, 50);
  // Attempt 2: 150ms
  setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    win.focus();
    if (win.webContents) {
      win.webContents.focus();
      win.webContents.executeJavaScript(
        'var el=document.getElementById("thought-input");if(el){el.focus();el.select();}'
      ).catch(() => {});
    }
  }, 150);
}

function sendQuickInputPrefill(content, options = {}) {
  if (!isQuickInputOpen() || !content) return;
  quickInputWin.webContents.send("quick-input:prefill", {
    content,
    autoSubmit: Boolean(options.autoSubmit),
  });
}

function createQuickInputWindow(prefill, options = {}) {
  if (isQuickInputOpen()) {
    sendQuickInputPrefill(prefill, options);
    focusQuickInputWindow(quickInputWin);
    stateMachine.request("input_open", "quick_input_refocus");
    return;
  }

  const petBounds = petRuntime.getPetWindowBounds();
  const position = quickInputRuntime.calculateQuickInputPosition({
    petBounds,
    petSize: petRuntime.getSize(),
    screen,
    workArea: getPrimaryWorkAreaSafe(screen),
  });

  quickInputWin = new BrowserWindow({
    width: quickInputRuntime.INPUT_WIDTH,
    height: quickInputRuntime.INPUT_HEIGHT,
    x: position.x,
    y: position.y,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: "#2C2416",
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-quick-input.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  if (isWin) {
    quickInputWin.setAlwaysOnTop(true, "screen-saver");
  }

  let blurReady = false;
  quickInputWin.on("blur", () => {
    if (!blurReady) return;
    closeQuickInputWindow();
  });

  quickInputWin.on("closed", () => {
    quickInputWin = null;
    if (stateMachine.getState() === "input_open") {
      stateMachine.request("idle", "quick_input_closed");
    }
  });

  // Attach listener BEFORE loadFile to avoid race (did-finish-load
  // can fire synchronously for local file:// URLs).
  quickInputWin.webContents.on("did-finish-load", () => {
    sendQuickInputPrefill(prefill, options);
    focusQuickInputWindow(quickInputWin);
    setTimeout(() => { blurReady = true; }, 600);
  });

  quickInputWin.loadFile(path.join(__dirname, "quick-input.html"));
  stateMachine.request("input_open", "quick_input_opened");
  // Show synchronously inside the globalShortcut callback path. On Windows the
  // foreground-focus grant is short-lived, so waiting for did-finish-load can
  // make the hotkey look like it did nothing.
  focusQuickInputWindow(quickInputWin);
}

function closeQuickInputWindow() {
  if (quickInputWin && !quickInputWin.isDestroyed()) {
    quickInputWin.close();
  }
  quickInputWin = null;
}

// ── Today panel window ──
let todayPanelWin = null;

function isTodayPanelOpen() {
  return todayPanelWin !== null && !todayPanelWin.isDestroyed();
}

function createTodayPanelWindow() {
  if (isTodayPanelOpen()) {
    todayPanelWin.focus();
    stateMachine.request("reviewing", "today_panel_refocus");
    return;
  }

  const petBounds = petRuntime.getPetWindowBounds();
  const panelW = todayPanelRuntime.PANEL_WIDTH;
  const panelH = todayPanelRuntime.PANEL_HEIGHT;
  const position = todayPanelRuntime.calculateTodayPanelPosition({
    petBounds,
    petSize: petRuntime.getSize(),
    workArea: getPrimaryWorkAreaSafe(screen),
  });

  todayPanelWin = new BrowserWindow({
    width: panelW,
    height: panelH,
    x: position.x,
    y: position.y,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: true,
    fullscreenable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-today-panel.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  if (isWin) {
    todayPanelWin.setAlwaysOnTop(true, "pop-up-menu");
  }

  todayPanelWin.loadFile(path.join(__dirname, "today-panel.html"));

  todayPanelWin.on("blur", () => {
    closeTodayPanelWindow();
  });

  todayPanelWin.on("closed", () => {
    todayPanelWin = null;
    if (stateMachine.getState() === "reviewing") {
      stateMachine.request("idle", "today_panel_closed");
    }
  });

  todayPanelWin.once("ready-to-show", () => {
    todayPanelWin.show();
    todayPanelWin.focus();
    stateMachine.request("reviewing", "today_panel_opened");
  });
}

function closeTodayPanelWindow() {
  if (todayPanelWin && !todayPanelWin.isDestroyed()) {
    todayPanelWin.close();
  }
  todayPanelWin = null;
}

function isSettingsOpen() {
  return settingsWin !== null && !settingsWin.isDestroyed();
}

function createSettingsWindow() {
  if (isSettingsOpen()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 520,
    height: 430,
    show: false,
    frame: true,
    title: "设置",
    backgroundColor: "#181512",
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload-settings.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  settingsWin.loadFile(path.join(__dirname, "settings.html"));
  settingsWin.on("closed", () => {
    settingsWin = null;
  });
  settingsWin.once("ready-to-show", () => {
    settingsWin.show();
    settingsWin.focus();
  });
}

function closeSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.close();
  }
  settingsWin = null;
}

// ── Bubble window ──
let bubbleWin = null;

function createBubbleWindow() {
  if (bubbleWin && !bubbleWin.isDestroyed()) return bubbleWin;

  bubbleWin = new BrowserWindow({
    width: 260,
    height: 60,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload-bubble.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  bubbleWin.setIgnoreMouseEvents(true, { forward: true });
  if (isWin) bubbleWin.setAlwaysOnTop(true, "pop-up-menu");

  bubbleWin.loadFile(path.join(__dirname, "bubble.html"));
  bubbleWin.on("closed", () => { bubbleWin = null; });

  return bubbleWin;
}

function showBubble(thoughts, screenX, screenY, options = {}) {
  if (!thoughts || thoughts.length === 0) return;
  const maxItems = Number.isInteger(options.maxItems) ? options.maxItems : BUBBLE_MAX_ITEMS;
  const visibleThoughts = thoughts.slice(0, Math.max(1, maxItems));
  const win = createBubbleWindow();
  const bw = 260;
  const itemH = 36;
  const bh = Math.min(8 + visibleThoughts.length * itemH, 260);
  // Place bubble to the left of the cursor so it doesn't get pushed off-screen
  const x = Math.round(screenX - bw - 16);
  const y = Math.round(screenY - bh - 8);
  win.setBounds({ x, y, width: bw, height: bh });
  win.showInactive();
  win.webContents.send("bubble:show", visibleThoughts.map((t) => ({
    content: t.content,
    contentPreview: t.contentPreview || t.content,
    category: t.category,
    createdAt: t.createdAt,
  })));
}

function hideBubble() {
  if (bubbleWin && !bubbleWin.isDestroyed()) {
    bubbleWin.webContents.send("bubble:hide");
    bubbleWin.hide();
  }
}

function showOtterWindows() {
  const rWin = petRuntime.getRenderWindow();
  const hWin = petRuntime.getHitWindow();
  if (rWin && !rWin.isDestroyed()) rWin.showInactive();
  if (hWin && !hWin.isDestroyed()) hWin.showInactive();
}

function hideOtterWindows() {
  const rWin = petRuntime.getRenderWindow();
  const hWin = petRuntime.getHitWindow();
  if (rWin && !rWin.isDestroyed()) rWin.hide();
  if (hWin && !hWin.isDestroyed()) hWin.hide();
}


// ── Review scheduler ──
const reviewScheduler = createSchedulerService({
  getReviewTimes: () => _prefsSnapshot.reviewTimes || ["10:30", "16:00"],
  onReview: () => {

    const thoughts = thoughtService.getTodayThoughts();
    if (thoughts.length === 0) return;

    // Show review bubble with max 4 thoughts, 5s auto-close
    const petBounds = petRuntime.getPetWindowBounds();
    const petSize = petRuntime.getSize();
    const x = petBounds ? Math.round(petBounds.x + petSize + 12) : 100;
    const y = petBounds ? Math.round(petBounds.y) : 100;
    showBubble(thoughts, x, y, { maxItems: BUBBLE_MAX_ITEMS });
    stateMachine.request("reviewing", "scheduled_review");

    // Auto-close after 5 seconds
    setTimeout(() => {
      hideBubble();
      if (stateMachine.getState() === "reviewing") {
        stateMachine.request("idle", "scheduled_review_closed");
      }
    }, 5000);
  },
});

// ── Cheer service ──
const cheerService = createCheerService({
  getTodayCount: () => thoughtService.getTodayThoughts().length,
  onCheer: (message) => {
    const petBounds = petRuntime.getPetWindowBounds();
    const petSize = petRuntime.getSize();
    const x = petBounds ? Math.round(petBounds.x + petSize + 12) : 100;
    const y = petBounds ? Math.round(petBounds.y) : 100;
    showBubble([{ content: message, contentPreview: message, category: "note", createdAt: new Date().toISOString() }], x, y, { maxItems: 1 });
    stateMachine.request("receiving", "cheer");
    setTimeout(() => hideBubble(), 4000);
  },
});

// ── Register global shortcut ──
function registerShortcut() {
  const accelerator = _prefsSnapshot.shortcut || prefsModule.DEFAULT_SHORTCUT;
  const ok = shortcutRuntime.register(accelerator, () => {
    // Windows grants ASFW (AllowSetForegroundWindow) to the process that
    // owns the hotkey when it fires — but only during this synchronous
    // callback. Deferring (setImmediate/setTimeout) loses the grant.
    if (isQuickInputOpen()) {
      closeQuickInputWindow();
    } else {
      createQuickInputWindow();
    }
  });
  const failure = shortcutRuntime.getLastFailure();
  return {
    ok,
    accelerator: shortcutRuntime.getAccelerator(),
    requestedAccelerator: shortcutRuntime.getRequestedAccelerator(),
    reason: failure && failure.reason,
  };
}

function applyOpenAtLogin(enabled) {
  if (typeof app.setLoginItemSettings !== "function") {
    return { ok: false, reason: "unsupported" };
  }
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      path: process.execPath,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || "failed" };
  }
}

// ── Context menu (right-click on otter) ──
function buildContextMenu() {
  const template = [
    {
      label: "记录念头",
      click: () => createQuickInputWindow(),
    },
    {
      label: "今日念头",
      click: () => createTodayPanelWindow(),
    },
    {
      label: "设置",
      click: () => createSettingsWindow(),
    },
    { type: "separator" },
    {
      label: "暂停动画",
      click: () => {
        const rWin = petRuntime.getRenderWindow();
        if (rWin && !rWin.isDestroyed()) {
          rWin.webContents.send("animation:toggle");
        }
      },
    },
    { type: "separator" },
    {
      label: "隐藏道道",
      click: () => hideOtterWindows(),
    },
    { type: "separator" },
    {
      label: "退出念头道道",
      click: () => {
        isQuitting = true;
        const bounds = petRuntime.getPetWindowBounds();
        if (bounds) {
          updatePrefs({
            x: bounds.x,
            y: bounds.y,
            positionSaved: true,
            size: petRuntime.getSize(),
          });
        }
        app.quit();
      },
    },
  ];
  return Menu.buildFromTemplate(template);
}

function createTray() {
  if (tray) return tray;

  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPElEQVR4nGNgoDV40WX1nyxNuDBFmgkaQoxmnIaQohmrIQNrADmaqWLIIAoDqqQDqqREYgwhqBmbYfjkARr4jZeS7hdvAAAAAElFTkSuQmCC"
  );
  tray = new Tray(icon);

    tray.setToolTip("念头道道");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "记录念头", click: () => createQuickInputWindow() },
    { label: "今日念头", click: () => createQuickInputWindow("/today", { autoSubmit: true }) },
    { label: "设置", click: () => createSettingsWindow() },
    { type: "separator" },
    { label: "显示道道", click: () => showOtterWindows() },
    { label: "隐藏道道", click: () => hideOtterWindows() },
    { type: "separator" },
    {
      label: "退出念头道道",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]));
  tray.on("click", () => createQuickInputWindow());
  return tray;
}

// ── IPC: Drag handlers ──
ipcMain.on("window:drag-start", (_event, { screenX, screenY }) => {
  petRuntime.beginDrag(screenX, screenY);
});

ipcMain.on("window:drag-move", (_event, { screenX, screenY }) => {
  petRuntime.moveDrag(screenX, screenY);
});

ipcMain.on("window:drag-end", () => {
  petRuntime.endDrag();
});

// ── IPC: Hover bubble ──
function sendModelRotate(payload) {
  const renderWindow = petRuntime.getRenderWindow();
  if (renderWindow && !renderWindow.isDestroyed()) {
    renderWindow.webContents.send("model:rotate", payload);
  }
}

ipcMain.on("model:rotate-start", () => {
  sendModelRotate({ phase: "start" });
});

ipcMain.on("model:rotate-move", (_event, { deltaX, deltaY }) => {
  sendModelRotate({
    phase: "move",
    deltaX: Number(deltaX) || 0,
    deltaY: Number(deltaY) || 0,
  });
});

ipcMain.on("model:rotate-end", () => {
  sendModelRotate({ phase: "end" });
});

ipcMain.on("hover:start", (_event, { screenX, screenY }) => {
  if (!_prefsSnapshot.hoverPreview) return;
  // Suppress hover bubble when the user already has a panel open
  if (isTodayPanelOpen() || isQuickInputOpen()) return;

  const thoughts = thoughtService.getAllThoughts({ limit: BUBBLE_MAX_ITEMS });
  if (thoughts.length > 0) {
    showBubble(thoughts, screenX, screenY, { maxItems: BUBBLE_MAX_ITEMS });
    stateMachine.request("hover", "hover_preview_opened");
  }
});

ipcMain.on("hover:end", () => {
  hideBubble();
  if (stateMachine.getState() === "hover") {
    stateMachine.request("idle", "hover_preview_closed");
  }
});

// ── IPC: Context menu ──
ipcMain.on("show-context-menu", () => {
  const menu = buildContextMenu();
  const hitWin = petRuntime.getHitWindow();
  if (hitWin && !hitWin.isDestroyed()) {
    menu.popup({ window: hitWin });
  }
});

ipcMain.on("hit:set-ignore-mouse-events", (_event, shouldIgnore) => {
  const hitWin = petRuntime.getHitWindow();
  if (hitWin && !hitWin.isDestroyed()) {
    hitWin.setIgnoreMouseEvents(Boolean(shouldIgnore), { forward: true });
  }
});

ipcMain.on("quick-input:open", () => {
  createQuickInputWindow();
});

ipcMain.on("today-panel:open", () => {
  createTodayPanelWindow();
});

ipcMain.on("settings:close", () => {
  closeSettingsWindow();
});

function finishDropFailure(reason) {
  stateMachine.request("error_hint", "drop_failed");
  return { ok: false, reason };
}

// ── IPC: Content drop (drag text/URL/file onto otter) ──
ipcMain.handle("hit:drop-content", async (_event, payload) => {
  try {
    const parsed = dragParser.parse(payload);
    if (!parsed.ok) {
      return finishDropFailure(parsed.reason);
    }

    const input = parsed.input;
    if (input.source === "drag_file" && input.filePath) {
      input.metadata = {
        ...(input.metadata || {}),
        fileExists: fs.existsSync(input.filePath),
      };
    }

    const thought = thoughtService.createThought(input);
    console.log(`[thought] created from drop: ${thought.id} (${thought.source})`);
    stateMachine.request("receiving", "drop_received");
    cheerService.checkAfterCreate();
    return { ok: true, thought };
  } catch (err) {
    console.error("[hit:drop-content] error:", err.message);
    return finishDropFailure(err.message);
  }
});

// ── IPC: Quick input ──
ipcMain.handle("quick-input:submit", async (_event, payload) => {
  const parsed = quickInputRuntime.parseCommandText(payload && payload.content);
  if (parsed.kind === "invalid") {
    return { ok: false, reason: parsed.reason };
  }

  if (parsed.kind === "unknown_command") {
    return { ok: false, reason: `未知命令：/${parsed.command}` };
  }

  if (parsed.kind === "command" && parsed.command === "delete") {
    const idx = parsed.index - 1; // convert 1-based to 0-based
    if (idx < 0 || idx >= lastTodayIds.length) {
      return { ok: false, reason: `序号 ${parsed.index} 超出范围（共 ${lastTodayIds.length} 条）` };
    }
    const id = lastTodayIds[idx];
    const ok = thoughtService.deleteThought(id);
    if (ok) {
      console.log(`[thought] deleted: ${id}`);
      // Refresh the today list
      const thoughts = thoughtService.getTodayThoughts({ includeDeleted: false }).slice(0, 8);
      lastTodayIds = thoughts.map((t) => t.id);
      return {
        ok: true,
        action: "today",
        thoughts: thoughts.map((t, i) => ({
          id: t.id,
          index: i + 1,
          content: t.content,
          preview: t.contentPreview || t.content,
          category: t.category,
          createdAt: t.createdAt,
        })),
      };
    }
    return { ok: false, reason: "删除失败" };
  }

  if (parsed.kind === "command" && parsed.command === "hide") {
    hideOtterWindows();
    closeQuickInputWindow();
    return { ok: true, action: "hide" };
  }

  if (parsed.kind === "command" && parsed.command === "today") {
    const thoughts = thoughtService.getTodayThoughts({ includeDeleted: false }).slice(0, 8);
    lastTodayIds = thoughts.map((t) => t.id);
    return {
      ok: true,
      action: "today",
      thoughts: thoughts.map((thought, i) => ({
        id: thought.id,
        index: i + 1,
        content: thought.content,
        preview: thought.contentPreview || thought.content,
        category: thought.category,
        createdAt: thought.createdAt,
      })),
    };
  }

  try {
    const thought = thoughtService.createThought({
      content: parsed.content,
      source: "quick_input",
    });
    console.log(`[thought] created: ${thought.id} (${thought.category})`);
    stateMachine.request("receiving", "quick_input_saved");
    cheerService.checkAfterCreate();
    closeQuickInputWindow();
    return { ok: true, thought };
  } catch (err) {
    console.error("[quick-input:submit] error:", err.message);
    return { ok: false, reason: err.message };
  }
});

ipcMain.on("quick-input:cancel", () => {
  closeQuickInputWindow();
});

// ── IPC: Thought CRUD ──
ipcMain.handle("thought:create", async (_event, input) => {
  try {
    const thought = thoughtService.createThought(input);
    return thought;
  } catch (err) {
    console.error("[thought:create] error:", err.message);
    throw err;
  }
});

ipcMain.handle("thought:list-today", async (_event, options) => {
  try {
    return thoughtService.getTodayThoughts(options || {});
  } catch (err) {
    console.error("[thought:list-today] error:", err.message);
    throw err;
  }
});

ipcMain.handle("thought:list-all", async (_event, options) => {
  try {
    return thoughtService.getAllThoughts(options || {});
  } catch (err) {
    console.error("[thought:list-all] error:", err.message);
    throw err;
  }
});

ipcMain.handle("thought:delete", async (_event, payload) => {
  try {
    const id = payload && payload.id;
    const ok = thoughtService.deleteThought(id);
    return { ok };
  } catch (err) {
    console.error("[thought:delete] error:", err.message);
    throw err;
  }
});

ipcMain.handle("thought:mark-copied", async (_event, payload) => {
  try {
    const id = payload && payload.id;
    const thought = thoughtService.markCopied(id);
    if (!thought) throw new Error("Thought not found");
    return thought;
  } catch (err) {
    console.error("[thought:mark-copied] error:", err.message);
    throw err;
  }
});

// ── IPC: Clipboard ──
ipcMain.handle("clipboard:write-text", async (_event, payload) => {
  const { clipboard } = require("electron");
  const text = payload && payload.text;
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  clipboard.writeText(text);
  return { ok: true };
});

// ── IPC: Shell ──
ipcMain.handle("shell:open-path", async (_event, payload) => {
  const filePath = payload && payload.filePath;
  if (typeof filePath !== "string" || !filePath) {
    return { ok: false, reason: "invalid path" };
  }
  const error = await shell.openPath(filePath);
  if (error) {
    return { ok: false, reason: error };
  }
  return { ok: true };
});

// ── IPC: Otter state ──
ipcMain.handle("otter:set-state", async (_event, payload) => {
  const normalized = quickInputRuntime.normalizeOtterStatePayload(payload);
  if (!normalized.ok) {
    return normalized;
  }

  stateMachine.request(normalized.state, normalized.reason);
  return { ok: true, state: stateMachine.getState() };
});

// ── IPC: Settings ──
ipcMain.handle("settings:get", async () => {
  return { ..._prefsSnapshot };
});

ipcMain.handle("settings:update", async (_event, partial) => {
  const normalizedPartial = settingsRuntime.normalizeSettingsPatch(partial);
  const previousSize = _prefsSnapshot.size;
  const previousShortcut = _prefsSnapshot.shortcut;
  const previousOpenAtLogin = _prefsSnapshot.openAtLogin;
  let updated = updatePrefs(normalizedPartial);
  if (!updated.hoverPreview && stateMachine.getState() === "hover") {
    hideBubble();
    stateMachine.request("idle", "hover_preview_disabled");
  }
  let shortcutStatus = { ok: true, accelerator: shortcutRuntime.getAccelerator() };
  let loginStatus = { ok: true };

  if (updated.size !== previousSize && updated.size !== petRuntime.getSize()) {
    petRuntime.resizePet(updated.size);
  }
  if (updated.shortcut !== previousShortcut) {
    shortcutStatus = registerShortcut();
    if (!shortcutStatus.ok) {
      updated = updatePrefs({ shortcut: previousShortcut });
      registerShortcut();
    }
  }
  if (updated.openAtLogin !== previousOpenAtLogin) {
    loginStatus = applyOpenAtLogin(updated.openAtLogin);
  }
  return { ...updated, shortcutStatus, loginStatus };
});

// ── App lifecycle ──
app.whenReady().then(() => {
  createWindows();
  createTray();
  registerShortcut();
  applyOpenAtLogin(_prefsSnapshot.openAtLogin);
  reviewScheduler.start();

  app.on("activate", () => {
    const rWin = petRuntime.getRenderWindow();
    if (!rWin || rWin.isDestroyed()) {
      createWindows();
    } else {
      rWin.show();
      const hWin = petRuntime.getHitWindow();
      if (hWin && !hWin.isDestroyed()) hWin.show();
    }
  });
});

app.on("second-instance", () => {
  const rWin = petRuntime.getRenderWindow();
  if (rWin && !rWin.isDestroyed()) {
    if (!rWin.isVisible()) rWin.showInactive();
  }
  const hWin = petRuntime.getHitWindow();
  if (hWin && !hWin.isDestroyed()) {
    if (!hWin.isVisible()) hWin.showInactive();
  }
});

// Before quitting: unregister shortcut, flush prefs, close db
app.on("before-quit", () => {
  isQuitting = true;
  shortcutRuntime.unregister();
  reviewScheduler.stop();

  // Close floating windows if open
  closeQuickInputWindow();
  closeTodayPanelWindow();
  closeSettingsWindow();
  hideBubble();
  if (bubbleWin && !bubbleWin.isDestroyed()) bubbleWin.close();

  // Save final position
  const bounds = petRuntime.getPetWindowBounds();
  if (bounds) {
    _prefsSnapshot = prefsModule.validate({
      ..._prefsSnapshot,
      x: bounds.x,
      y: bounds.y,
      positionSaved: true,
      size: petRuntime.getSize(),
    });
  }
  flushPrefs();
  dbModule.close();
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
