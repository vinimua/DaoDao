"use strict";

// ── Otter State Machine ──
// Manages otter state transitions with priority conflict resolution,
// minimum display durations, and auto-return to idle.

const { priorityOf, highest, VALID_STATES } = require("./state-priority");

// Default minDisplay / autoReturn timings (ms).
// One-time states (receiving, storing) auto-return to idle after display.
const AUTO_RETURN = {
  receiving:   1200,
  storing:     1200,
  error_hint:  3000,
  input_open:  0,     // stays until user closes input
  reviewing:   0,     // stays until user closes panel
  hover:       0,     // transient, controlled by hit window
  quiet:       0,     // stays while fullscreen
  hidden:      0,
};

const MIN_DISPLAY = {
  receiving:   900,
  storing:     900,
  error_hint:  2000,
};

function createStateMachine(options = {}) {
  const onChange = options.onChange || (() => {});
  let currentState = "idle";
  let autoReturnTimer = null;
  let minDisplayUntil = 0;

  function getState() {
    return currentState;
  }

  function request(targetState, reason) {
    if (!VALID_STATES.has(targetState)) return;
    const now = Date.now();

    // Don't downgrade below minDisplay
    if (now < minDisplayUntil && priorityOf(targetState) < priorityOf(currentState)) {
      return;
    }

    const prev = currentState;
    currentState = targetState;
    onChange(currentState, prev, reason || null);

    // Schedule auto-return
    const autoMs = AUTO_RETURN[targetState];
    if (autoMs > 0) {
      clearAutoReturn();
      autoReturnTimer = setTimeout(() => {
        autoReturnTimer = null;
        request("idle", "auto_return");
      }, autoMs);
    }

    // Set min display
    const minMs = MIN_DISPLAY[targetState];
    if (minMs > 0) {
      minDisplayUntil = now + minMs;
    }

    return currentState;
  }

  function clearAutoReturn() {
    if (autoReturnTimer) {
      clearTimeout(autoReturnTimer);
      autoReturnTimer = null;
    }
  }

  function reset() {
    clearAutoReturn();
    minDisplayUntil = 0;
    currentState = "idle";
    onChange("idle", null, "reset");
  }

  return { getState, request, reset, clearAutoReturn };
}

module.exports = { createStateMachine, AUTO_RETURN, MIN_DISPLAY };
