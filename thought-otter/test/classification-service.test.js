"use strict";

// ── Classification Service Tests ──

const { classify, extractKeywords } = require("../src/classification-service");

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

function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion failed");
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `expected "${expected}", got "${actual}"`);
  }
}

// ── Classification tests ──
console.log("\n=== Classification ===");

test("todo: 明天", () => {
  assertEquals(classify("明天把登录页的错误提示优化一下"), "todo");
});

test("todo: 修改", () => {
  assertEquals(classify("修改一下配置读取逻辑"), "todo");
});

test("todo: 修复", () => {
  assertEquals(classify("修复首页加载缓慢"), "todo");
});

test("todo: 提交", () => {
  assertEquals(classify("记得提交代码"), "todo");
});

test("todo: 待办", () => {
  assertEquals(classify("待办：更新依赖版本"), "todo");
});

test("question: 为什么", () => {
  assertEquals(classify("为什么接口返回403"), "question");
});

test("question: 怎么", () => {
  assertEquals(classify("怎么优化这个SQL查询"), "question");
});

test("question: 如何", () => {
  assertEquals(classify("如何实现文件上传"), "question");
});

test("question: bug", () => {
  assertEquals(classify("登录页面有个bug"), "question");
});

test("question: 失败", () => {
  assertEquals(classify("npm install 失败了"), "question");
});

test("question: 报错", () => {
  assertEquals(classify("运行报错：cannot find module"), "question");
});

test("idea: 灵感", () => {
  assertEquals(classify("突然有个灵感"), "idea");
});

test("idea: 可以做成", () => {
  assertEquals(classify("这个可以做成桌面宠物"), "idea");
});

test("idea: 试试", () => {
  assertEquals(classify("试试用 WebSocket 替代轮询"), "idea");
});

test("idea: 方案", () => {
  assertEquals(classify("新的缓存方案"), "idea");
});

test("idea: 功能", () => {
  assertEquals(classify("增加一个导出功能"), "idea");
});

test("note: unclassified", () => {
  assertEquals(classify("今天天气不错"), "note");
});

test("note: empty content", () => {
  assertEquals(classify(""), "note");
});

test("note: null content", () => {
  assertEquals(classify(null), "note");
});

// Priority: question > todo > idea
test("priority: question wins over todo", () => {
  assertEquals(classify("为什么明天要修复这个bug"), "question");
});

test("priority: todo wins over idea", () => {
  assertEquals(classify("明天试试新的设计方案"), "todo");
});

// ── Keyword extraction tests ──
console.log("\n=== Keyword Extraction ===");

test("keywords: basic extraction", () => {
  const kw = extractKeywords("明天把登录页的错误提示优化一下");
  assert(kw.length > 0, "should have keywords");
  assert(!kw.includes("的"), "should not include stop words");
  assert(!kw.includes("把"), "should not include stop words");
  assert(!kw.includes("一下"), "should not include stop words");
});

test("keywords: max 5", () => {
  const kw = extractKeywords("重构配置读取逻辑 优化 数据库 查询 性能 缓存 策略");
  assert(kw.length <= 5, `expected <= 5, got ${kw.length}`);
});

test("keywords: empty content", () => {
  assertEquals(extractKeywords("").length, 0);
  assertEquals(extractKeywords(null).length, 0);
});

test("keywords: english content", () => {
  const kw = extractKeywords("Refactor the database connection pool for better performance");
  assert(kw.length > 0, "should extract English keywords");
  assert(!kw.some((w) => w.toLowerCase() === "the"), "should filter 'the'");
  assert(!kw.some((w) => w.toLowerCase() === "for"), "should filter 'for'");
});

// ── Summary ──
console.log(`\n${passed} passed, ${failed} failed`);
// Expose for the test runner (runs inside Electron, so no process.exit)
module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
