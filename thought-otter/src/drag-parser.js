"use strict";

// Parses sanitized drag-drop payloads into ThoughtCreateInput.
// Never reads dropped file contents; file drops only preserve paths.

const URL_RE = /^https?:\/\/\S+$/i;

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function firstUriFromList(uriList) {
  if (typeof uriList !== "string") return "";
  return uriList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#")) || "";
}

function basename(filePath) {
  if (typeof filePath !== "string" || !filePath) return "";
  return filePath.split(/[/\\]/).pop() || filePath;
}

function parse(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, reason: "no drag data" };
  }

  const filePaths = Array.isArray(payload.filePaths)
    ? payload.filePaths.filter((value) => typeof value === "string" && value.trim())
    : [];

  if (filePaths.length > 0) {
    const filePath = filePaths[0].trim();
    const fileName = basename(filePath);
    return {
      ok: true,
      input: {
        content: fileName || filePath,
        source: "drag_file",
        filePath,
        metadata: {
          fileName,
          droppedFileCount: filePaths.length,
          multipleFiles: filePaths.length > 1,
        },
      },
    };
  }

  const uri = firstUriFromList(payload.uriList);
  const text = firstNonEmptyString(uri, payload.text);
  if (!text) {
    return { ok: false, reason: "empty content" };
  }

  if (URL_RE.test(text)) {
    return {
      ok: true,
      input: {
        content: text,
        source: "drag_url",
        url: text,
      },
    };
  }

  return {
    ok: true,
    input: {
      content: text,
      source: "drag_text",
    },
  };
}

module.exports = { parse, firstUriFromList };
