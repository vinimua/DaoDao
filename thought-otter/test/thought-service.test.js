"use strict";

// ── Thought Service Tests ──

const path = require("path");
const fs = require("fs");
const os = require("os");

// Use a temp database for testing
const TEST_DB_DIR = path.join(os.tmpdir(), "thought-otter-test-" + Date.now());
const TEST_DB_PATH = path.join(TEST_DB_DIR, "thought-otter.db");

// Ensure clean state
try { fs.rmSync(TEST_DB_DIR, { recursive: true }); } catch {}
fs.mkdirSync(TEST_DB_DIR, { recursive: true });

// Override the db module to use our test path
const dbModule = require("../src/db");
dbModule.init(TEST_DB_PATH);

const thoughtService = require("../src/thought-service");

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

// ── CRUD tests ──
console.log("\n=== Thought CRUD ===");

test("createThought: quick_input", () => {
  const thought = thoughtService.createThought({
    content: "明天优化设置页的响应速度",
    source: "quick_input",
  });
  assert(thought.id, "should have an id");
  assertEquals(thought.content, "明天优化设置页的响应速度");
  assertEquals(thought.source, "quick_input");
  assertEquals(thought.status, "classified");
  assert(thought.category === "todo" || thought.category === "note",
    `expected todo or note, got ${thought.category}`);
  assert(thought.contentPreview.length <= 81, "preview should be <= 81 chars");
  assert(Array.isArray(thought.keywords), "keywords should be an array");
  assert(thought.createdAt, "should have createdAt");
  assert(thought.updatedAt, "should have updatedAt");
});

test("createThought: drag_file", () => {
  const thought = thoughtService.createThought({
    content: "项目架构图",
    source: "drag_file",
    filePath: "C:\\Users\\test\\Documents\\架构图.png",
  });
  assertEquals(thought.source, "drag_file");
  assertEquals(thought.filePath, "C:\\Users\\test\\Documents\\架构图.png");
});

test("createThought: drag_url", () => {
  const thought = thoughtService.createThought({
    content: "React 19 新特性介绍",
    source: "drag_url",
    url: "https://react.dev/blog/2024/12/05/react-19",
  });
  assertEquals(thought.source, "drag_url");
  assertEquals(thought.url, "https://react.dev/blog/2024/12/05/react-19");
});

test("createThought: with metadata", () => {
  const thought = thoughtService.createThought({
    content: "test metadata",
    source: "drag_text",
    metadata: { browserTab: "github.com", selected: true },
  });
  assert(thought.metadata && thought.metadata.browserTab === "github.com",
    "metadata should be preserved");
});

test("createThought: rejects undefined input", () => {
  let threw = false;
  try {
    thoughtService.createThought(undefined);
  } catch (err) {
    threw = true;
    assert(err.message.includes("input must be an object"), "should report invalid input");
  }
  assert(threw, "should reject undefined input");
});

test("createThought: rejects missing content", () => {
  let threw = false;
  try {
    thoughtService.createThought({ source: "quick_input" });
  } catch (err) {
    threw = true;
    assert(err.message.includes("content must be a non-empty string"), "should report missing content");
  }
  assert(threw, "should reject missing content");
});

test("createThought: rejects invalid source", () => {
  let threw = false;
  try {
    thoughtService.createThought({ content: "bad source", source: "bad_source" });
  } catch (err) {
    threw = true;
    assert(err.message.includes("source is invalid"), "should report invalid source");
  }
  assert(threw, "should reject invalid source");
});

test("createThought: rejects invalid metadata", () => {
  let threw = false;
  try {
    thoughtService.createThought({ content: "bad metadata", source: "quick_input", metadata: "nope" });
  } catch (err) {
    threw = true;
    assert(err.message.includes("metadata must be an object"), "should report invalid metadata");
  }
  assert(threw, "should reject invalid metadata");
});

test("getTodayThoughts: returns thoughts", () => {
  const thoughts = thoughtService.getTodayThoughts();
  assert(thoughts.length >= 4, `expected >= 4, got ${thoughts.length}`);
  // Should be in descending order by created_at
  for (let i = 1; i < thoughts.length; i++) {
    assert(thoughts[i - 1].createdAt >= thoughts[i].createdAt,
      "thoughts should be ordered by created_at DESC");
  }
});

test("getTodayThoughts: with includeDeleted", () => {
  const thoughts = thoughtService.getTodayThoughts({ includeDeleted: true });
  assert(thoughts.length >= 4, "should still return all thoughts");
});

test("deleteThought: hard delete", () => {
  const thought = thoughtService.createThought({
    content: "这条会被物理删除",
    source: "quick_input",
  });
  const result = thoughtService.deleteThought(thought.id);
  assert(result === true, "delete should return true");

  // Should not appear in any queries
  const today = thoughtService.getTodayThoughts();
  const deleted = today.find((t) => t.id === thought.id);
  assert(!deleted, "deleted thought should not appear");

  // includeDeleted also won't find it (hard delete)
  const allToday = thoughtService.getTodayThoughts({ includeDeleted: true });
  const foundDeleted = allToday.find((t) => t.id === thought.id);
  assert(!foundDeleted, "hard-deleted thought should not appear even with includeDeleted");
});

test("deleteThought: non-existent id", () => {
  const result = thoughtService.deleteThought("non-existent-id");
  assertEquals(result, false);
});

test("markCopied: updates status", () => {
  const thought = thoughtService.createThought({
    content: "这条会被标记为已复制",
    source: "quick_input",
  });
  const updated = thoughtService.markCopied(thought.id);
  assert(updated !== null, "should return the updated thought");
  assertEquals(updated.status, "copied");
  assert(updated.reviewedAt !== null, "reviewedAt should be set");
});

test("markCopied: non-existent id returns null", () => {
  const result = thoughtService.markCopied("non-existent-id");
  assertEquals(result, null);
});

test("markCopied: deleted thought returns null", () => {
  const thought = thoughtService.createThought({
    content: "这条删除后无法标记复制",
    source: "quick_input",
  });
  assertEquals(thoughtService.deleteThought(thought.id), true);
  // Physically deleted → markCopied returns null
  const result = thoughtService.markCopied(thought.id);
  assertEquals(result, null);
});

test("long content gets truncated preview", () => {
  const longContent = "A".repeat(200);
  const thought = thoughtService.createThought({
    content: longContent,
    source: "quick_input",
  });
  assert(thought.contentPreview.length <= 81, "preview should be truncated");
  assertEquals(thought.content, longContent, "full content should be preserved");
});

test("classification: todo keyword match", () => {
  const thought = thoughtService.createThought({
    content: "明天要修复登录页的bug",
    source: "quick_input",
  });
  // "bug" is question, "修复" is todo → question wins
  assertEquals(thought.category, "question");
  assertEquals(thought.status, "classified");
});

// ── Summary ──
console.log(`\n${passed} passed, ${failed} failed`);

// Cleanup
dbModule.close();
try { fs.rmSync(TEST_DB_DIR, { recursive: true }); } catch {}

// Expose for the test runner (runs inside Electron, so no process.exit)
module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
