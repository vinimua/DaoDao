"use strict";

const assert = require("assert");
const { createSchedulerService } = require("../src/scheduler-service");

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

function withFakeDate(fakeDate, fn) {
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(fakeDate);
      return new RealDate(...args);
    }
    static now() {
      return new RealDate(fakeDate).getTime();
    }
  }
  global.Date = FakeDate;
  try {
    fn();
  } finally {
    global.Date = RealDate;
  }
}

console.log("\n=== Scheduler Service ===");

test("fires when current minute matches reviewTimes", () => {
  const fired = [];
  const scheduler = createSchedulerService({
    getReviewTimes: () => ["10:30"],
    onReview: (timeKey) => fired.push(timeKey),
  });

  withFakeDate("2026-06-23T10:30:05", () => scheduler.check());
  assert.deepStrictEqual(fired, ["10:30"]);
});

test("does not fire twice in the same minute", () => {
  const fired = [];
  const scheduler = createSchedulerService({
    getReviewTimes: () => ["10:30"],
    onReview: (timeKey) => fired.push(timeKey),
  });

  withFakeDate("2026-06-23T10:30:05", () => scheduler.check());
  withFakeDate("2026-06-23T10:30:45", () => scheduler.check());
  assert.deepStrictEqual(fired, ["10:30"]);
});

test("reads reviewTimes dynamically", () => {
  const fired = [];
  let reviewTimes = ["10:30"];
  const scheduler = createSchedulerService({
    getReviewTimes: () => reviewTimes,
    onReview: (timeKey) => fired.push(timeKey),
  });

  withFakeDate("2026-06-23T10:31:00", () => scheduler.check());
  reviewTimes = ["10:31"];
  withFakeDate("2026-06-23T10:31:10", () => scheduler.check());
  assert.deepStrictEqual(fired, ["10:31"]);
});

test("reset allows a minute to fire again", () => {
  const fired = [];
  const scheduler = createSchedulerService({
    getReviewTimes: () => ["10:30"],
    onReview: (timeKey) => fired.push(timeKey),
  });

  withFakeDate("2026-06-23T10:30:05", () => scheduler.check());
  scheduler.reset();
  withFakeDate("2026-06-23T10:30:45", () => scheduler.check());
  assert.deepStrictEqual(fired, ["10:30", "10:30"]);
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
