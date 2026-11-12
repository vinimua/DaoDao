"use strict";

const assert = require("assert");
const dragParser = require("../src/drag-parser");

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

console.log("\n=== Drag Parser ===");

test("parses plain text", () => {
  assert.deepStrictEqual(
    dragParser.parse({ text: "  remember this  " }),
    { ok: true, input: { content: "remember this", source: "drag_text" } }
  );
});

test("parses URL from text/plain", () => {
  assert.deepStrictEqual(
    dragParser.parse({ text: "https://example.com/path" }),
    {
      ok: true,
      input: {
        content: "https://example.com/path",
        source: "drag_url",
        url: "https://example.com/path",
      },
    }
  );
});

test("parses URL from text/uri-list", () => {
  assert.deepStrictEqual(
    dragParser.parse({ uriList: "# comment\r\nhttps://example.com/item\r\n" }),
    {
      ok: true,
      input: {
        content: "https://example.com/item",
        source: "drag_url",
        url: "https://example.com/item",
      },
    }
  );
});

test("parses first file only", () => {
  const result = dragParser.parse({
    filePaths: [
      "C:\\Users\\u\\Desktop\\first.png",
      "C:\\Users\\u\\Desktop\\second.png",
    ],
  });

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.input.source, "drag_file");
  assert.strictEqual(result.input.filePath, "C:\\Users\\u\\Desktop\\first.png");
  assert.strictEqual(result.input.content, "first.png");
  assert.strictEqual(result.input.metadata.droppedFileCount, 2);
  assert.strictEqual(result.input.metadata.multipleFiles, true);
});

test("rejects empty text", () => {
  assert.deepStrictEqual(
    dragParser.parse({ text: "   " }),
    { ok: false, reason: "empty content" }
  );
});

test("rejects missing payload", () => {
  assert.deepStrictEqual(
    dragParser.parse(null),
    { ok: false, reason: "no drag data" }
  );
});

console.log(`\n${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
if (failed > 0) {
  if (typeof globalThis.__testFailed === "undefined") globalThis.__testFailed = 0;
  globalThis.__testFailed += failed;
}
