#!/usr/bin/env node

// Test launcher.
// Runs tests in Electron's Node mode so native modules use Electron's ABI
// without starting Chromium/GPU processes.

const { spawn } = require("child_process");
const electron = require("electron");
const path = require("path");

const env = { ...process.env };
env.ELECTRON_RUN_AS_NODE = "1";
env.THINKING_OTTER_TEST = "1";

const child = spawn(electron, [path.join(__dirname, "run-tests.js")], {
  stdio: "inherit",
  env,
  windowsHide: true,
});

child.on("error", (error) => {
  console.error(`[test] Failed to start Electron: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => process.exit(code ?? 0));
