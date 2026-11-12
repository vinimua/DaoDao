"use strict";

const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 360;
const PANEL_GAP = 12;

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.max(min, Math.min(value, max));
}

function calculateTodayPanelPosition(options = {}) {
  const width = options.width || PANEL_WIDTH;
  const height = options.height || PANEL_HEIGHT;
  const gap = options.gap ?? PANEL_GAP;
  const workArea = options.workArea || { x: 0, y: 0, width: 1920, height: 1080 };
  const petBounds = options.petBounds || null;
  const petSize = options.petSize || (petBounds && petBounds.width) || 80;

  let x;
  let y;

  if (petBounds) {
    const rightX = Math.round(petBounds.x + petSize + gap);
    const leftX = Math.round(petBounds.x - width - gap);
    const maxX = workArea.x + workArea.width - width;
    x = rightX <= maxX ? rightX : leftX;
    y = Math.round(petBounds.y + petSize / 2 - height / 2);
  } else {
    x = Math.round(workArea.x + workArea.width / 2 - width / 2);
    y = Math.round(workArea.y + workArea.height / 2 - height / 2);
  }

  return {
    x: clamp(x, workArea.x, workArea.x + workArea.width - width),
    y: clamp(y, workArea.y, workArea.y + workArea.height - height),
  };
}

module.exports = {
  PANEL_WIDTH,
  PANEL_HEIGHT,
  PANEL_GAP,
  calculateTodayPanelPosition,
};
