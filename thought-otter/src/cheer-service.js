"use strict";

// ── Cheer Service ──
// Tracks daily thought count and shows encouraging messages at milestones.

const MILESTONES = [5, 10, 20, 30, 50, 100];

const CHEERS = {
  5: [
    "第 5 条了！小道道帮你抱着这些念头 🦦",
    "5 个念头收入小窝，继续加油~",
    "已经记了 5 条，脑子越来越清爽了 ✨",
  ],
  10: [
    "10 条！你今天很 productive 呢 💪",
    "两位数了！小道道翻着你的小石头 📋",
    "10 个念头，像 10 颗闪亮的贝壳 🐚",
  ],
  20: [
    "20 条！思路如泉涌 🌊",
    "小道道的小窝快装满了，不过它很开心 🦦✨",
    "你已经记了 20 条，今天超级高效！",
  ],
  30: [
    "30 条！！你是念头捕捉大师 🏆",
    "小道道表示惊叹：今天这么多灵感 🌟",
    "30 个念头 = 30 颗小石头，铺成了一条路",
  ],
  50: [
    "50 条！！！道道国王给你颁奖 👑",
    "半个百！今天的你值得被记住 📖",
    "50 条念头 = 未来的 50 个行动",
  ],
  100: [
    "💯 满分！道道之王就是你 🦦👑",
    "100 条！今天可以写一本书了 📚",
    "百条大关！小道道已经变成大哲学家了",
  ],
};

function pickCheer(count) {
  const pool = CHEERS[count];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createCheerService(options = {}) {
  const getTodayCount = options.getTodayCount || (() => 0);
  const onCheer = options.onCheer || (() => {});
  const firedToday = new Set();

  function checkAfterCreate() {
    const count = getTodayCount();
    if (MILESTONES.includes(count) && !firedToday.has(count)) {
      firedToday.add(count);
      const message = pickCheer(count);
      if (message) {
        onCheer(message, count);
      }
    }
  }

  function reset() {
    firedToday.clear();
  }

  return { checkAfterCreate, reset };
}

module.exports = { createCheerService, MILESTONES };
