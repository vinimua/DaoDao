"use strict";

const assert = require("assert");
const { createStateMachine, AUTO_RETURN, MIN_DISPLAY } = require("../src/state");
const { priorityOf } = require("../src/state-priority");

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

console.log("\n=== State Machine ===");

test("state priorities match expected ordering", () => {
  assert(priorityOf("error_hint") > priorityOf("receiving"));
  assert(priorityOf("receiving") > priorityOf("storing"));
  assert(priorityOf("reviewing") > priorityOf("input_open"));
  assert(priorityOf("idle") > priorityOf("quiet"));
  assert(priorityOf("quiet") > priorityOf("hidden"));
});

test("request changes state and notifies listener", () => {
  const changes = [];
  const machine = createStateMachine({
    onChange: (state, prev, reason) => changes.push({ state, prev, reason }),
  });

  assert.strictEqual(machine.getState(), "idle");
  machine.request("input_open", "quick_input_opened");
  assert.strictEqual(machine.getState(), "input_open");
  assert.deepStrictEqual(changes[0], {
    state: "input_open",
    prev: "idle",
    reason: "quick_input_opened",
  });
});

test("minDisplay blocks lower-priority downgrade", () => {
  const machine = createStateMachine();
  machine.request("receiving", "saved");
  machine.request("idle", "too_soon");
  assert.strictEqual(machine.getState(), "receiving");
});

test("higher-priority state can interrupt minDisplay", () => {
  const machine = createStateMachine();
  machine.request("receiving", "saved");
  machine.request("error_hint", "failed");
  assert.strictEqual(machine.getState(), "error_hint");
});

test("timing constants keep transient states bounded", () => {
  assert.strictEqual(AUTO_RETURN.receiving, 1200);
  assert.strictEqual(AUTO_RETURN.storing, 1200);
  assert.strictEqual(AUTO_RETURN.error_hint, 3000);
  assert.strictEqual(MIN_DISPLAY.receiving, 900);
  assert.strictEqual(MIN_DISPLAY.storing, 900);
  assert.strictEqual(MIN_DISPLAY.error_hint, 2000);
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
