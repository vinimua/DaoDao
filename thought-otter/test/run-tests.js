"use strict";

// ── Test runner ──
// Must be executed with Electron because better-sqlite3 is compiled
// against Electron's Node.js headers.
//
// Usage: npx electron test/run-tests.js

const path = require("path");

function runTests() {
  // Reset failure tracker
  globalThis.__testFailed = 0;

  const testFiles = [
    "classification-service.test.js",
    "thought-service.test.js",
    "phase5-quick-input.test.js",
    "shortcut-runtime.test.js",
    "today-panel-runtime.test.js",
    "drag-parser.test.js",
    "state-machine.test.js",
    "scheduler-service.test.js",
    "settings-runtime.test.js",
  ];

  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    // Clear require cache so each test file runs fresh
    delete require.cache[require.resolve(filePath)];
    try {
      require(filePath);
    } catch (err) {
      console.error(`  RUNNER ERROR: ${err.message}`);
      globalThis.__testFailed++;
    }
  }

  const failed = globalThis.__testFailed || 0;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━`);
  if (failed === 0) {
    console.log(`✓ All tests passed (${testFiles.length} suites)`);
  } else {
    console.log(`✗ ${failed} test failure(s) across ${testFiles.length} suites`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━`);

  // Give stdout time to flush, then exit
  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 200);
}

const electron = require("electron");
const app = electron && electron.app;

if (app && typeof app.whenReady === "function") {
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-software-rasterizer");
  app.commandLine.appendSwitch("disable-gpu-compositing");
  app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
  app.whenReady().then(runTests);
} else {
  runTests();
}
