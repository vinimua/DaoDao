"use strict";

const INPUT_WIDTH = 320;
const INPUT_HEIGHT = 180;
const INPUT_GAP = 10;

const VALID_OTTER_STATES = new Set([
  "idle",
  "hover",
  "input_open",
  "receiving",
  "storing",
  "reviewing",
  "quiet",
  "hidden",
  "error_hint",
]);

function asPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function normalizeSubmitPayload(payload) {
  const data = asPlainObject(payload);
  if (!data || typeof data.content !== "string") {
    return { ok: false, reason: "empty content" };
  }

  const content = data.content.trim();
  if (!content) {
    return { ok: false, reason: "empty content" };
  }

  return { ok: true, content };
}

function parseCommandText(content) {
  if (typeof content !== "string") {
    return { kind: "invalid", reason: "empty content" };
  }

  const text = content.trim();
  if (!text) {
    return { kind: "invalid", reason: "empty content" };
  }

  if (!text.startsWith("/")) {
    return { kind: "thought", content: text };
  }

  const command = text.slice(1).trim().toLowerCase();
  if (command === "today") {
    return { kind: "command", command: "today" };
  }
  if (command === "hide") {
    return { kind: "command", command: "hide" };
  }

  // /delete N — delete the Nth thought from the last /today list
  const deleteMatch = /^delete\s+(\d+)$/.exec(command);
  if (deleteMatch) {
    const index = parseInt(deleteMatch[1], 10);
    if (index < 1) return { kind: "invalid", reason: "序号必须 ≥ 1" };
    return { kind: "command", command: "delete", index };
  }

  return { kind: "unknown_command", command };
}

function normalizeOtterStatePayload(payload) {
  const data = asPlainObject(payload);
  if (!data || typeof data.state !== "string" || data.state.trim() === "") {
    return { ok: false, reason: "state is invalid" };
  }

  const state = data.state.trim();
  if (!VALID_OTTER_STATES.has(state)) {
    return { ok: false, reason: "state is invalid" };
  }

  const result = { ok: true, state };
  if (data.reason !== undefined && data.reason !== null) {
    if (typeof data.reason !== "string") {
      return { ok: false, reason: "reason must be a string" };
    }
    result.reason = data.reason;
  }

  return result;
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.max(min, Math.min(value, max));
}

function findWorkAreaForBounds(screen, bounds, fallbackWorkArea) {
  let displays = [];
  try {
    displays = screen && typeof screen.getAllDisplays === "function"
      ? screen.getAllDisplays()
      : [];
  } catch {
    displays = [];
  }

  if (!Array.isArray(displays) || displays.length === 0 || !bounds) {
    return fallbackWorkArea;
  }

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const matched = displays.find((display) => {
    const wa = display && display.workArea;
    return wa
      && centerX >= wa.x
      && centerX <= wa.x + wa.width
      && centerY >= wa.y
      && centerY <= wa.y + wa.height;
  });

  return matched && matched.workArea ? matched.workArea : fallbackWorkArea;
}

function calculateQuickInputPosition(options) {
  const opts = options || {};
  const width = opts.width || INPUT_WIDTH;
  const height = opts.height || INPUT_HEIGHT;
  const gap = opts.gap ?? INPUT_GAP;
  const workArea = opts.workArea || { x: 0, y: 0, width: 1920, height: 1080 };
  const petBounds = opts.petBounds || null;
  const petSize = opts.petSize || (petBounds && petBounds.width) || 80;
  const targetWorkArea = findWorkAreaForBounds(opts.screen, petBounds, workArea);

  let x;
  let y;
  if (petBounds) {
    x = Math.round(petBounds.x + petSize / 2 - width / 2);
    y = Math.round(petBounds.y - height - gap);
  } else {
    x = Math.round(targetWorkArea.x + targetWorkArea.width / 2 - width / 2);
    y = Math.round(targetWorkArea.y + targetWorkArea.height / 2 - height / 2);
  }

  return {
    x: clamp(x, targetWorkArea.x, targetWorkArea.x + targetWorkArea.width - width),
    y: clamp(y, targetWorkArea.y, targetWorkArea.y + targetWorkArea.height - height),
  };
}

module.exports = {
  INPUT_WIDTH,
  INPUT_HEIGHT,
  INPUT_GAP,
  VALID_OTTER_STATES,
  calculateQuickInputPosition,
  normalizeOtterStatePayload,
  normalizeSubmitPayload,
  parseCommandText,
};
