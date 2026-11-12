"use strict";

// ── Preferences (pure data layer) ──
//
// Canonical schema definition + load / save / validate for prefs.json.
// Zero dependencies on Electron — deals in plain snapshots.
//
// `load(prefsPath)`  — read file, migrate, validate, return { snapshot, locked }
// `save(prefsPath, snapshot)` — validate (lightly) + write JSON
// `getDefaults()` — fresh defaults snapshot (every call returns a new object)
// `validate(raw)` — coerces arbitrary object into valid snapshot, dropping bad fields
// `merge(base, patch)` — apply a partial update while preserving old values for invalid fields
//
// Bad-file handling: read failure -> return defaults.
// Future-version handling: version > CURRENT → warn + refuse to overwrite (locked).

const fs = require("fs");
const path = require("path");

const CURRENT_VERSION = 1;
const DEFAULT_SHORTCUT = "CommandOrControl+Alt+T";
const LEGACY_DEFAULT_SHORTCUTS = new Set([
  "CommandOrControl+Alt+Space",
  "CommandOrControl+Alt+Shift+O",
  "CommandOrControl+Alt+O",
]);

// ── Schema ──
// Each field has: type, default (or defaultFactory for objects/arrays)
const SCHEMA = {
  version:         { type: "number",  default: CURRENT_VERSION },
  x:               { type: "number",  default: 0,    validate: (v) => Number.isFinite(v) },
  y:               { type: "number",  default: 0,    validate: (v) => Number.isFinite(v) },
  positionSaved:   { type: "boolean", default: false },
  size:            { type: "number",  default: 260,  validate: (v) => Number.isFinite(v) && v >= 24 && v <= 720 },
  shortcut:        { type: "string",  default: DEFAULT_SHORTCUT },
  openAtLogin:     { type: "boolean", default: false },
  hoverPreview:    { type: "boolean", default: true },
  reviewTimes:     { type: "object",  defaultFactory: () => ["10:30", "16:00"] },
  theme:           { type: "string",  default: "otter" },
};

const SCHEMA_KEYS = Object.freeze(Object.keys(SCHEMA));

// ── Helpers ──

function defaultFor(field) {
  if (typeof field.defaultFactory === "function") return field.defaultFactory();
  return field.default;
}

function getDefaults() {
  const out = {};
  for (const key of SCHEMA_KEYS) {
    out[key] = defaultFor(SCHEMA[key]);
  }
  return out;
}

function isValidValue(field, value) {
  if (value === undefined || value === null) return false;
  // Objects (arrays and plain objects)
  if (field.type === "object") {
    return typeof value === "object" && value !== null;
  }
  // Primitives
  if (typeof value !== field.type) return false;
  if (typeof field.validate === "function" && !field.validate(value)) return false;
  return true;
}

// Coerce an arbitrary object into a valid snapshot — drop bad fields,
// fill missing fields from defaults.
function validate(raw) {
  const out = getDefaults();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const key of SCHEMA_KEYS) {
    if (!(key in raw)) continue;
    const field = SCHEMA[key];
    const value = raw[key];
    // For arrays, do a simple clone (reviewTimes only in v1)
    if (field.type === "object" && Array.isArray(field.defaultFactory())) {
      if (Array.isArray(value)) {
        out[key] = value.filter((v) => typeof v === "string" && v);
      }
      continue;
    }
    if (isValidValue(field, value)) {
      out[key] = value;
    }
    // else: keep default
  }
  return out;
}

function normalizeValue(field, value) {
  if (field.type === "object" && Array.isArray(field.defaultFactory())) {
    if (!Array.isArray(value)) return undefined;
    return value.filter((v) => typeof v === "string" && v);
  }

  if (!isValidValue(field, value)) return undefined;
  return value;
}

// Apply a partial prefs update without letting invalid patch values reset
// existing valid settings back to defaults.
function merge(base, patch) {
  const out = validate(base);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return out;

  for (const key of SCHEMA_KEYS) {
    if (!(key in patch)) continue;
    const normalized = normalizeValue(SCHEMA[key], patch[key]);
    if (normalized !== undefined) {
      out[key] = normalized;
    }
  }

  return out;
}

// Apply version-to-version migrations. Returns upgraded raw object.
function migrate(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const out = { ...raw };
  // v0 (no version field) → v1: add version
  if (out.version === undefined || out.version === null) {
    out.version = 1;
  }
  if (LEGACY_DEFAULT_SHORTCUTS.has(out.shortcut)) {
    out.shortcut = DEFAULT_SHORTCUT;
  }
  // Future migrations: if (out.version < 2) { ... out.version = 2; }
  if ((typeof out.version === "number" ? out.version : 0) < CURRENT_VERSION) {
    out.version = CURRENT_VERSION;
  }
  return out;
}

// ── Disk I/O ──

function load(prefsPath) {
  let raw;
  try {
    const text = fs.readFileSync(prefsPath, "utf8");
    raw = JSON.parse(text);
  } catch (err) {
    // Missing file is normal on first run — return defaults silently.
    if (err && err.code === "ENOENT") {
      return { snapshot: getDefaults(), locked: false };
    }
    console.warn("[prefs] file unreadable, using defaults:", err.message);
    return { snapshot: getDefaults(), locked: false };
  }

  if (!raw || typeof raw !== "object") {
    return { snapshot: getDefaults(), locked: false };
  }

  // Future-version guard
  const incomingVersion = typeof raw.version === "number" ? raw.version : 0;
  if (incomingVersion > CURRENT_VERSION) {
    console.warn(
      `[prefs] file version ${incomingVersion} > supported (${CURRENT_VERSION}). ` +
      "Settings will be readable but not saved."
    );
    return { snapshot: validate(raw), locked: true };
  }

  const migrated = migrate(raw);
  return { snapshot: validate(migrated), locked: false };
}

function save(prefsPath, snapshot) {
  const validated = validate(snapshot);
  // Ensure parent directory exists
  try {
    fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
  } catch {}
  fs.writeFileSync(prefsPath, JSON.stringify(validated, null, 2));
}

module.exports = {
  CURRENT_VERSION,
  DEFAULT_SHORTCUT,
  LEGACY_DEFAULT_SHORTCUTS,
  SCHEMA,
  SCHEMA_KEYS,
  getDefaults,
  validate,
  merge,
  migrate,
  load,
  save,
};
