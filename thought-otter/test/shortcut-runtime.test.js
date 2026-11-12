"use strict";

const assert = require("assert");
const {
  createShortcutRuntime,
  getAcceleratorCandidates,
} = require("../src/shortcut-runtime");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok ${name}`);
  } catch (err) {
    failed++;
    console.log(`  fail ${name}`);
    console.log(`    ${err.message}`);
  }
}

function silentLogger() {
  return { log() {}, warn() {} };
}

console.log("\n=== Shortcut Runtime ===");

test("getAcceleratorCandidates adds Windows Ctrl alias", () => {
  assert.deepStrictEqual(
    getAcceleratorCandidates("CommandOrControl+Alt+T", "win32"),
    ["CommandOrControl+Alt+T", "Ctrl+Alt+T"]
  );
});

test("register falls back to Ctrl alias on Windows", () => {
  const calls = [];
  let handler = null;
  const fakeGlobalShortcut = {
    register(accelerator, cb) {
      calls.push(accelerator);
      if (accelerator === "Ctrl+Alt+T") {
        handler = cb;
        return true;
      }
      return false;
    },
    unregister() {},
    isRegistered(accelerator) {
      return accelerator === "Ctrl+Alt+T";
    },
  };

  let triggered = 0;
  const runtime = createShortcutRuntime({
    globalShortcut: fakeGlobalShortcut,
    logger: silentLogger(),
    platform: "win32",
  });

  assert.strictEqual(runtime.register("CommandOrControl+Alt+T", () => { triggered++; }), true);
  assert.deepStrictEqual(calls, ["CommandOrControl+Alt+T", "Ctrl+Alt+T"]);
  assert.strictEqual(runtime.getAccelerator(), "Ctrl+Alt+T");
  assert.strictEqual(runtime.isRegistered(), true);

  handler();
  assert.strictEqual(triggered, 1);
});

test("register catches globalShortcut exceptions", () => {
  const runtime = createShortcutRuntime({
    globalShortcut: {
      register() {
        throw new Error("boom");
      },
    },
    logger: silentLogger(),
    platform: "linux",
  });

  assert.strictEqual(runtime.register("CommandOrControl+Alt+T", () => {}), false);
  assert.deepStrictEqual(runtime.getLastFailure(), {
    accelerator: "CommandOrControl+Alt+T",
    reason: "boom",
  });
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
