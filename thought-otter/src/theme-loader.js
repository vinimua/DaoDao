"use strict";

// ── Theme Loader ──
// Loads and validates theme.json from disk.

const fs = require("fs");
const path = require("path");
const { validate, getAsset } = require("./theme-schema");

function load(themeDir) {
  const manifestPath = path.join(themeDir, "theme.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    console.warn(`[theme] failed to load ${manifestPath}:`, err.message);
    return null;
  }

  if (!validate(raw)) {
    console.warn(`[theme] invalid theme manifest: ${manifestPath}`);
    return null;
  }

  return {
    id: raw.id,
    name: raw.name,
    states: { ...raw.states },
    dir: themeDir,
    assetPath: (filename) => path.join(themeDir, "assets", filename),
    getAsset: (state) => getAsset(raw, state),
  };
}

module.exports = { load };
