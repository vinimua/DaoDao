"use strict";

// ── Scheduler Service ──
// Checks reviewTimes every minute, fires callback at scheduled times.
// Prevents repeat triggers within the same minute.

function createSchedulerService(options = {}) {
  const onReview = options.onReview || (() => {});
  const getReviewTimes = options.getReviewTimes || (() => ["10:30", "16:00"]);
  let timer = null;
  let lastTriggered = ""; // "HH:mm" of last trigger

  function currentTimeKey() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  function check() {
    const now = currentTimeKey();
    if (now === lastTriggered) return; // prevent duplicate in same minute

    const reviewTimes = getReviewTimes();
    if (Array.isArray(reviewTimes) && reviewTimes.includes(now)) {
      lastTriggered = now;
      onReview(now);
    }
  }

  function start(intervalMs = 60000) {
    stop();
    check(); // check immediately on start
    timer = setInterval(check, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Reset trigger so same time can fire again (e.g., for testing)
  function reset() {
    lastTriggered = "";
  }

  return { start, stop, check, reset, currentTimeKey };
}

module.exports = { createSchedulerService };
