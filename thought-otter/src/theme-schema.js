"use strict";

// ── Theme Schema ──
// Validates theme.json structure.

const { VALID_STATES } = require("./state-priority");

function validate(theme) {
  if (!theme || typeof theme !== "object") return false;
  if (typeof theme.id !== "string" || !theme.id) return false;
  if (typeof theme.name !== "string") return false;
  if (!theme.states || typeof theme.states !== "object") return false;

  // Each defined state must map to a non-empty array of asset filenames
  for (const [state, assets] of Object.entries(theme.states)) {
    if (!VALID_STATES.has(state)) continue;
    if (!Array.isArray(assets) || assets.length === 0) return false;
  }

  return true;
}

function getAsset(theme, state) {
  if (!theme || !theme.states) return null;
  const assets = theme.states[state];
  if (!Array.isArray(assets) || assets.length === 0) return null;
  // Pick first asset (future: random selection for variety)
  return assets[0];
}

module.exports = { validate, getAsset };
