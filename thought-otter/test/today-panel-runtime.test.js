"use strict";

const assert = require("assert");
const todayPanelRuntime = require("../src/today-panel-runtime");

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

console.log("\n=== Today Panel Runtime ===");

test("positions panel to the right when there is room", () => {
  const position = todayPanelRuntime.calculateTodayPanelPosition({
    petBounds: { x: 100, y: 400, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 1200, height: 800 },
  });

  assert.strictEqual(position.x, 192);
  assert.strictEqual(position.y, 260);
});

test("positions panel to the left near right edge", () => {
  const position = todayPanelRuntime.calculateTodayPanelPosition({
    petBounds: { x: 1100, y: 650, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 1200, height: 800 },
  });

  assert.strictEqual(position.x, 788);
  assert.strictEqual(position.y, 440);
});

test("clamps panel inside top and bottom edges", () => {
  const top = todayPanelRuntime.calculateTodayPanelPosition({
    petBounds: { x: 100, y: 0, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 800, height: 600 },
  });
  const bottom = todayPanelRuntime.calculateTodayPanelPosition({
    petBounds: { x: 100, y: 580, width: 80, height: 80 },
    petSize: 80,
    workArea: { x: 0, y: 0, width: 800, height: 600 },
  });

  assert.strictEqual(top.y, 0);
  assert.strictEqual(bottom.y, 240);
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
