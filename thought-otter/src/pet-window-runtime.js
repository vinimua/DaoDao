"use strict";

const { clampToWorkArea, getPrimaryWorkAreaSafe } = require("./work-area");

// ── Pet Window Runtime ──
// Manages the dual-window model: render window (visual) + hit window (input).
//
//   render window → transparent, frameless, always-on-top, ignores mouse
//   hit window    → transparent, frameless, always-on-top, captures input

const PET_SIZE_MIN = 24;
const PET_SIZE_MAX = 720;
const DEFAULT_PET_SIZE = 260;

function isLiveWindow(win) {
  return !!(win && typeof win.isDestroyed === "function" && !win.isDestroyed());
}

function createPetWindowRuntime(options = {}) {
  const screen = options.screen || {};
  const BrowserWindow = options.BrowserWindow;
  const preloadPath = options.preloadPath;
  const hitPreloadPath = options.hitPreloadPath;
  const indexPath = options.indexPath;
  const hitPath = options.hitPath;
  const isQuitting = options.isQuitting || (() => false);
  const topmostLevel = options.topmostLevel || "pop-up-menu";
  const onPositionChanged = options.onPositionChanged || null;
  const onSizeChanged = options.onSizeChanged || null;

  let renderWin = null;
  let hitWin = null;
  let petSize = clampSize(options.initialSize || DEFAULT_PET_SIZE);
  let initialX = options.initialX;
  let initialY = options.initialY;

  let isDragging = false;
  let dragStartMouse = null;  // { x, y } screen coords
  let dragStartWin = null;    // { x, y } window position

  function clampSize(s) {
    if (!Number.isFinite(s)) return DEFAULT_PET_SIZE;
    return Math.max(PET_SIZE_MIN, Math.min(PET_SIZE_MAX, Math.round(s)));
  }

  // ── Window accessors ──
  function getRenderWindow() { return renderWin; }
  function getHitWindow() { return hitWin; }

  // ── Bounds helpers ──
  function getPetWindowBounds() {
    if (!isLiveWindow(renderWin)) return null;
    const b = renderWin.getBounds();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  }

  function getWorkArea() {
    return getPrimaryWorkAreaSafe(screen);
  }

  function applyPetWindowBounds(bounds) {
    if (!isLiveWindow(renderWin) || !bounds) return;
    const clamped = clampToWorkArea(bounds.x, bounds.y, bounds.width, bounds.height, getWorkArea());
    renderWin.setBounds({ x: clamped.x, y: clamped.y, width: bounds.width, height: bounds.height });
    syncHitWin();
  }

  function computeStartPosition() {
    const workArea = getWorkArea();
    const hasSaved = initialX !== undefined && initialY !== undefined
      && Number.isFinite(initialX) && Number.isFinite(initialY);

    if (hasSaved) {
      // Validate saved position is still visible on some display
      const clamped = clampToWorkArea(initialX, initialY, petSize, petSize, workArea);
      return { x: clamped.x, y: clamped.y };
    }

    // Default: bottom-right corner
    return {
      x: workArea.x + workArea.width - petSize - 20,
      y: workArea.y + workArea.height - petSize - 20,
    };
  }

  // ── Notify position change ──
  function notifyPositionChanged() {
    if (typeof onPositionChanged === "function") {
      const bounds = getPetWindowBounds();
      if (bounds) {
        onPositionChanged({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
      }
    }
  }

  function notifySizeChanged() {
    if (typeof onSizeChanged === "function") {
      onSizeChanged(petSize);
    }
  }

  // ── Hit window sync ──
  function syncHitWin() {
    if (!isLiveWindow(hitWin) || !isLiveWindow(renderWin)) return;
    if (isDragging) return;
    const bounds = renderWin.getBounds();
    hitWin.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
  }

  // ── Create render window ──
  function createRenderWindow() {
    const pos = computeStartPosition();

    renderWin = new BrowserWindow({
      width: petSize,
      height: petSize,
      x: pos.x,
      y: pos.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      fullscreenable: false,
      enableLargerThanScreen: true,
      focusable: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });

    renderWin.setIgnoreMouseEvents(true, { forward: true });

    if (process.platform === "win32") {
      renderWin.setAlwaysOnTop(true, topmostLevel);
    }

    renderWin.webContents.on("did-finish-load", () => {
      console.log("[pet-window] render window loaded", renderWin.getBounds());
    });
    renderWin.webContents.on("did-fail-load", (_event, code, description, url) => {
      console.error("[pet-window] render window failed to load", { code, description, url });
    });
    renderWin.webContents.on("console-message", (_event, level, message, line, sourceId) => {
      console.log("[pet-window:renderer]", { level, message, line, sourceId });
    });

    renderWin.on("close", (event) => {
      if (!isQuitting()) {
        event.preventDefault();
      }
    });

    renderWin.loadFile(indexPath);
    renderWin.showInactive();

    return renderWin;
  }

  // ── Create hit window ──
  function createHitWindow() {
    const pos = computeStartPosition();

    hitWin = new BrowserWindow({
      width: petSize,
      height: petSize,
      x: pos.x,
      y: pos.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      fullscreenable: false,
      enableLargerThanScreen: true,
      focusable: true,
      webPreferences: {
        preload: hitPreloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });

    // Start pass-through; hit-renderer enables capture when pointer is on the otter
    hitWin.setIgnoreMouseEvents(true, { forward: true });

    if (process.platform === "win32") {
      hitWin.setAlwaysOnTop(true, topmostLevel);
    }

    hitWin.webContents.on("did-finish-load", () => {
      console.log("[pet-window] hit window loaded", hitWin.getBounds());
    });
    hitWin.webContents.on("did-fail-load", (_event, code, description, url) => {
      console.error("[pet-window] hit window failed to load", { code, description, url });
    });

    hitWin.on("close", (event) => {
      if (!isQuitting()) {
        event.preventDefault();
      }
    });

    hitWin.loadFile(hitPath);
    hitWin.showInactive();

    return hitWin;
  }

  // ── Drag handling ──
  function beginDrag(screenX, screenY) {
    if (!isLiveWindow(renderWin)) return;
    const bounds = renderWin.getBounds();
    dragStartMouse = { x: screenX, y: screenY };
    dragStartWin = { x: bounds.x, y: bounds.y };
    isDragging = true;
  }

  function moveDrag(screenX, screenY) {
    if (!isDragging || !dragStartMouse || !dragStartWin) return;
    const dx = screenX - dragStartMouse.x;
    const dy = screenY - dragStartMouse.y;
    const newX = dragStartWin.x + dx;
    const newY = dragStartWin.y + dy;
    const clamped = clampToWorkArea(newX, newY, petSize, petSize, getWorkArea());

    if (isLiveWindow(renderWin)) {
      renderWin.setBounds({ x: clamped.x, y: clamped.y, width: petSize, height: petSize });
    }
    if (isLiveWindow(hitWin)) {
      hitWin.setBounds({ x: clamped.x, y: clamped.y, width: petSize, height: petSize });
    }
  }

  function endDrag() {
    isDragging = false;
    dragStartMouse = null;
    dragStartWin = null;
    notifyPositionChanged();
  }

  function isDragActive() {
    return isDragging;
  }

  // ── Resize ──
  function resizePet(newSize) {
    newSize = clampSize(newSize);
    if (newSize === petSize) return;
    petSize = newSize;
    if (isLiveWindow(renderWin)) {
      const bounds = renderWin.getBounds();
      renderWin.setBounds({ x: bounds.x, y: bounds.y, width: petSize, height: petSize });
    }
    syncHitWin();
    notifySizeChanged();
  }

  return {
    getRenderWindow,
    getHitWindow,
    getPetWindowBounds,
    applyPetWindowBounds,
    createRenderWindow,
    createHitWindow,
    syncHitWin,
    beginDrag,
    moveDrag,
    endDrag,
    isDragActive,
    resizePet,
    getSize: () => petSize,
  };
}

module.exports = createPetWindowRuntime;
