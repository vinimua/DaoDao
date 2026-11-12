"use strict";

const assert = require("assert");
const quickInputRuntime = require("../src/quick-input-runtime");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

console.log("\n=== Phase 5 Quick Input ===");

test("normalizeSubmitPayload rejects missing payload", () => {
  assert.deepStrictEqual(
    quickInputRuntime.normalizeSubmitPayload(undefined),
    { ok: false, reason: "empty content" }
  );
});

test("normalizeSubmitPayload rejects blank content", () => {
  assert.deepStrictEqual(
    quickInputRuntime.normalizeSubmitPayload({ content: "   " }),
    { ok: false, reason: "empty content" }
  );
});

test("normalizeSubmitPayload trims content", () => {
  assert.deepStrictEqual(
    quickInputRuntime.normalizeSubmitPayload({ content: "  capture this  " }),
    { ok: true, content: "capture this" }
  );
});

test("calculateQuickInputPosition centers above pet", () => {
  const position = quickInputRuntime.calculateQuickInputPosition({
    petBounds: { x: 700, y: 500, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert.strictEqual(position.x, 580);
  assert.strictEqual(position.y, 310);
});

test("calculateQuickInputPosition clamps top edge", () => {
  const position = quickInputRuntime.calculateQuickInputPosition({
    petBounds: { x: 20, y: 10, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 800, height: 600 },
  });

  assert.strictEqual(position.x, 0);
  assert.strictEqual(position.y, 0);
});

test("calculateQuickInputPosition clamps right edge", () => {
  const position = quickInputRuntime.calculateQuickInputPosition({
    petBounds: { x: 760, y: 300, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 800, height: 600 },
  });

  assert.strictEqual(position.x, 480);
  assert.strictEqual(position.y, 110);
});

test("parseCommandText treats plain text as thought", () => {
  assert.deepStrictEqual(
    quickInputRuntime.parseCommandText("  capture this  "),
    { kind: "thought", content: "capture this" }
  );
});

test("parseCommandText accepts /today", () => {
  assert.deepStrictEqual(
    quickInputRuntime.parseCommandText(" /today "),
    { kind: "command", command: "today" }
  );
});

test("parseCommandText accepts /hide", () => {
  assert.deepStrictEqual(
    quickInputRuntime.parseCommandText("/hide"),
    { kind: "command", command: "hide" }
  );
});

test("parseCommandText rejects unknown slash command", () => {
  assert.deepStrictEqual(
    quickInputRuntime.parseCommandText("/nope"),
    { kind: "unknown_command", command: "nope" }
  );
});

test("normalizeOtterStatePayload accepts receiving", () => {
  assert.deepStrictEqual(
    quickInputRuntime.normalizeOtterStatePayload({ state: "receiving", reason: "quick_input_saved" }),
    { ok: true, state: "receiving", reason: "quick_input_saved" }
  );
});

test("normalizeOtterStatePayload rejects invalid state", () => {
  assert.deepStrictEqual(
    quickInputRuntime.normalizeOtterStatePayload({ state: "unknown" }),
    { ok: false, reason: "state is invalid" }
  );
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
