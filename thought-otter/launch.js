#!/usr/bin/env node

// Cross-platform launcher that ensures Electron runs in GUI mode.
//
// Some Electron-based tools (like Claude Code) set ELECTRON_RUN_AS_NODE=1,
// which forces Electron to behave as a plain Node.js process — the browser
// layer never initializes, so `require("electron").app` is undefined.
//
// This launcher strips that variable before spawning the real Electron binary.

const { spawn } = require("child_process");
const electron = require("electron");
const path = require("path");

const forwardedArgs = process.argv.slice(2);

// Strip ELECTRON_RUN_AS_NODE so Electron starts in GUI mode
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, [path.join(__dirname, "src", "main.js"), ...forwardedArgs], {
  stdio: "inherit",
  env,
  cwd: __dirname,
  windowsHide: false,
});

child.on("error", (error) => {
  console.error(`[launch] Failed to start Electron: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => process.exit(code ?? 0));
