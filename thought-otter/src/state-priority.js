"use strict";

// ── State Priority ──
// Higher number = higher priority. When multiple events request different
// states, the higher priority wins.

const PRIORITY = {
  error_hint:  7,
  receiving:   6,
  storing:     5,
  reviewing:   4,
  input_open:  3,
  hover:       2,
  idle:        1,
  quiet:       0,
  hidden:     -1,
};

const VALID_STATES = new Set(Object.keys(PRIORITY));

function priorityOf(state) {
  return PRIORITY[state] ?? 0;
}

function compare(a, b) {
  return priorityOf(a) - priorityOf(b);
}

function highest(a, b) {
  return compare(a, b) >= 0 ? a : b;
}

module.exports = { PRIORITY, VALID_STATES, priorityOf, compare, highest };
