"use strict";

// Registers and manages the global shortcut for quick input.

const { globalShortcut } = require("electron");

function getAcceleratorCandidates(accelerator, platform = process.platform) {
  if (!accelerator || typeof accelerator !== "string") return [];
  const candidates = [accelerator];

  if (platform === "win32" && accelerator.includes("CommandOrControl")) {
    candidates.push(accelerator.replaceAll("CommandOrControl", "Ctrl"));
  }

  return [...new Set(candidates)];
}

function createShortcutRuntime(options = {}) {
  const shortcut = options.globalShortcut || globalShortcut;
  const logger = options.logger || console;
  const platform = options.platform || process.platform;

  let currentAccelerator = null;
  let requestedAccelerator = null;
  let onTriggerRef = null;
  let lastFailure = null;

  function isRegistered() {
    if (!currentAccelerator || !shortcut || typeof shortcut.isRegistered !== "function") {
      return false;
    }

    try {
      return shortcut.isRegistered(currentAccelerator);
    } catch (err) {
      lastFailure = { accelerator: currentAccelerator, reason: err.message || "isRegistered failed" };
      return false;
    }
  }

  function unregister() {
    if (!currentAccelerator || !shortcut || typeof shortcut.unregister !== "function") {
      currentAccelerator = null;
      requestedAccelerator = null;
      onTriggerRef = null;
      return;
    }

    try {
      shortcut.unregister(currentAccelerator);
      logger.log(`[shortcut] unregistered: ${currentAccelerator}`);
    } catch (err) {
      logger.warn(`[shortcut] failed to unregister ${currentAccelerator}: ${err.message}`);
    }

    currentAccelerator = null;
    requestedAccelerator = null;
    onTriggerRef = null;
  }

  function register(accelerator, onTrigger) {
    if (currentAccelerator) {
      unregister();
    }

    if (!accelerator || typeof accelerator !== "string") {
      lastFailure = { accelerator, reason: "invalid accelerator" };
      logger.warn("[shortcut] invalid accelerator:", accelerator);
      return false;
    }

    if (!shortcut || typeof shortcut.register !== "function") {
      lastFailure = { accelerator, reason: "globalShortcut unavailable" };
      logger.warn("[shortcut] globalShortcut unavailable");
      return false;
    }

    requestedAccelerator = accelerator;
    onTriggerRef = onTrigger;

    for (const candidate of getAcceleratorCandidates(accelerator, platform)) {
      let ok = false;
      try {
        ok = shortcut.register(candidate, () => {
          if (typeof onTriggerRef === "function") {
            onTriggerRef();
          }
        });
      } catch (err) {
        lastFailure = { accelerator: candidate, reason: err.message || "register threw" };
        logger.warn(`[shortcut] failed to register ${candidate}: ${lastFailure.reason}`);
        continue;
      }

      if (ok) {
        currentAccelerator = candidate;
        lastFailure = null;
        const suffix = candidate === accelerator ? "" : ` for ${accelerator}`;
        logger.log(`[shortcut] registered: ${candidate}${suffix}`);
        return true;
      }

      lastFailure = { accelerator: candidate, reason: "system conflict or unavailable" };
      logger.warn(`[shortcut] failed to register: ${candidate}`);
    }

    return false;
  }

  function getAccelerator() {
    return currentAccelerator;
  }

  function getRequestedAccelerator() {
    return requestedAccelerator;
  }

  function getLastFailure() {
    return lastFailure ? { ...lastFailure } : null;
  }

  return {
    register,
    unregister,
    isRegistered,
    getAccelerator,
    getRequestedAccelerator,
    getLastFailure,
  };
}

const defaultRuntime = createShortcutRuntime();

module.exports = {
  ...defaultRuntime,
  createShortcutRuntime,
  getAcceleratorCandidates,
};
