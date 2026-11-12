"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// ── Preload: whitelist API bridge ──
//
// Only exposes renderer-facing IPC channels defined in the IPC contract.
// The renderer NEVER gets direct access to ipcRenderer.

const VALID_SOURCES = new Set(["quick_input", "drag_text", "drag_url", "drag_file"]);
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

function requirePlainObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }

  return value;
}

function optionalString(value, name) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a string`);
  }

  return value;
}

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }

  return value;
}

function normalizeThoughtInput(input) {
  const data = requirePlainObject(input, "input");
  const content = requiredString(data.content, "content");
  const source = requiredString(data.source, "source");

  if (!VALID_SOURCES.has(source)) {
    throw new TypeError("source is invalid");
  }

  const payload = {
    content,
    source,
  };

  if (data.filePath !== undefined) {
    payload.filePath = optionalString(data.filePath, "filePath");
  }

  if (data.url !== undefined) {
    payload.url = optionalString(data.url, "url");
  }

  if (data.metadata !== undefined) {
    payload.metadata = requirePlainObject(data.metadata, "metadata");
  }

  return payload;
}

function normalizeListOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }

  const data = requirePlainObject(options, "options");
  const payload = {};

  if (data.includeDeleted !== undefined) {
    payload.includeDeleted = Boolean(data.includeDeleted);
  }

  return payload;
}

function normalizeSettingsPatch(partial) {
  const data = requirePlainObject(partial, "partial");
  const payload = {};

  for (const [key, value] of Object.entries(data)) {
    if (["string", "number", "boolean"].includes(typeof value) || value === null) {
      payload[key] = value;
    }
  }

  return payload;
}

contextBridge.exposeInMainWorld("otterAPI", {
  // ── Thought CRUD ──
  createThought: (input) => ipcRenderer.invoke("thought:create", normalizeThoughtInput(input)),
  listTodayThoughts: (options) => ipcRenderer.invoke("thought:list-today", normalizeListOptions(options)),
  deleteThought: (id) => ipcRenderer.invoke("thought:delete", { id: requiredString(id, "id") }),
  markCopied: (id) => ipcRenderer.invoke("thought:mark-copied", { id: requiredString(id, "id") }),

  // ── Clipboard ──
  writeClipboardText: (text) => ipcRenderer.invoke("clipboard:write-text", { text: requiredString(text, "text") }),

  // ── Otter state ──
  setOtterState: (state, reason) => {
    const normalizedState = requiredString(state, "state");
    if (!VALID_OTTER_STATES.has(normalizedState)) {
      throw new TypeError("state is invalid");
    }

    const payload = { state: normalizedState };
    if (reason !== undefined) {
      payload.reason = optionalString(reason, "reason");
    }

    return ipcRenderer.invoke("otter:set-state", payload);
  },

  onOtterStateChanged: (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }

    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("otter:state-changed", listener);
    return () => ipcRenderer.removeListener("otter:state-changed", listener);
  },

  // ── Settings ──
  onAnimationToggle: (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("animation:toggle", listener);
    return () => ipcRenderer.removeListener("animation:toggle", listener);
  },

  onModelRotate: (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }

    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("model:rotate", listener);
    return () => ipcRenderer.removeListener("model:rotate", listener);
  },

  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (partial) => ipcRenderer.invoke("settings:update", normalizeSettingsPatch(partial)),
});
