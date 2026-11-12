"use strict";

// ── Pure work-area math ──
// Electron's screen.getAllDisplays() can briefly return [] during display
// topology changes. These helpers provide safe fallbacks.

const SYNTHETIC_WORK_AREA = { x: 0, y: 0, width: 1920, height: 1080 };

function getPrimaryWorkAreaSafe(screen) {
  try {
    if (screen && typeof screen.getPrimaryDisplay === "function") {
      const primary = screen.getPrimaryDisplay();
      if (primary && primary.workArea) return primary.workArea;
    }
  } catch {}
  return SYNTHETIC_WORK_AREA;
}

function getAllDisplaysSafe(screen) {
  try {
    if (screen && typeof screen.getAllDisplays === "function") {
      const displays = screen.getAllDisplays();
      if (Array.isArray(displays) && displays.length > 0) return displays;
    }
  } catch {}
  return [];
}

function clampToWorkArea(x, y, w, h, workArea) {
  const wa = workArea || SYNTHETIC_WORK_AREA;
  // Allow 25% of the pet to go off-screen for visual appeal
  const marginX = Math.round(w * 0.25);
  const marginTop = Math.round(h * 0.25);
  const marginBottom = Math.round(h * 0.25);
  return {
    x: Math.max(wa.x - marginX, Math.min(x, wa.x + wa.width - w + marginX)),
    y: Math.max(wa.y - marginTop, Math.min(y, wa.y + wa.height - h + marginBottom)),
  };
}

function getDefaultPosition(workArea, size) {
  const wa = workArea || SYNTHETIC_WORK_AREA;
  const w = size || 80;
  const h = size || 80;
  return {
    x: wa.x + wa.width - w - 20,
    y: wa.y + wa.height - h - 20,
  };
}

module.exports = {
  SYNTHETIC_WORK_AREA,
  getPrimaryWorkAreaSafe,
  getAllDisplaysSafe,
  clampToWorkArea,
  getDefaultPosition,
};
