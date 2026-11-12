"use strict";

const assert = require("assert");
const {
  clampSize,
  formatReviewTimes,
  normalizeSettingsPatch,
  parseReviewTimesText,
} = require("../src/settings-runtime");

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

console.log("\n=== Settings Runtime ===");

test("clampSize keeps otter size in range", () => {
  assert.strictEqual(clampSize(20), 24);
  assert.strictEqual(clampSize(120.4), 120);
  assert.strictEqual(clampSize(999), 720);
});

test("parseReviewTimesText accepts comma and whitespace separators", () => {
  assert.deepStrictEqual(parseReviewTimesText("10:30, 16:00 21:05"), ["10:30", "16:00", "21:05"]);
});

test("parseReviewTimesText drops invalid and duplicate times", () => {
  assert.deepStrictEqual(parseReviewTimesText("10:30, 99:99, 10:30"), ["10:30"]);
});

test("formatReviewTimes joins valid times", () => {
  assert.strictEqual(formatReviewTimes(["10:30", "16:00"]), "10:30, 16:00");
});

test("normalizeSettingsPatch produces safe patch", () => {
  assert.deepStrictEqual(
    normalizeSettingsPatch({
      shortcut: " CommandOrControl+Alt+T ",
      size: 500,
      reviewTimes: "10:30, nope, 16:00",
      openAtLogin: 1,
      fullscreenQuiet: 0,
      unknown: "drop",
    }),
    {
      shortcut: "CommandOrControl+Alt+T",
      size: 500,
      reviewTimes: ["10:30", "16:00"],
      openAtLogin: true,
    }
  );
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
