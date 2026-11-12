"use strict";

// ── Thought Service ──
// Business logic for creating, querying, and updating thoughts.
// All database access is through the `db` module.
// Never log full thought content.

const crypto = require("crypto");
const { getDb } = require("./db");
const { classify, extractKeywords } = require("./classification-service");

// ── Helpers ──

const VALID_SOURCES = new Set(["quick_input", "drag_text", "drag_url", "drag_file"]);

function generateId() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

function makePreview(content, maxLen = 80) {
  if (!content) return "";
  return content.length <= maxLen ? content : content.slice(0, maxLen) + "…";
}

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }

  return value;
}

function optionalString(value, name) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a string`);
  }

  return value;
}

function plainObjectOrEmpty(value, name) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }

  return value;
}

function normalizeCreateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }

  const content = requiredString(input.content, "content");
  const source = input.source === undefined ? "quick_input" : requiredString(input.source, "source");

  if (!VALID_SOURCES.has(source)) {
    throw new TypeError("source is invalid");
  }

  return {
    content,
    source,
    filePath: optionalString(input.filePath, "filePath"),
    url: optionalString(input.url, "url"),
    metadata: plainObjectOrEmpty(input.metadata, "metadata"),
  };
}

function normalizeId(id) {
  return requiredString(id, "id");
}

function rowToThought(row) {
  return {
    id: row.id,
    content: row.content,
    contentPreview: row.content_preview,
    category: row.category,
    source: row.source,
    status: row.status,
    keywords: JSON.parse(row.keywords_json || "[]"),
    filePath: row.file_path || null,
    url: row.url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at || null,
    errorMessage: row.error_message || null,
    metadata: JSON.parse(row.metadata_json || "{}"),
  };
}

// ── Public API ──

/**
 * Create a new thought.
 * @param {ThoughtCreateInput} input
 * @returns {Thought}
 */
function createThought(input) {
  const db = getDb();
  const normalized = normalizeCreateInput(input);
  const id = generateId();
  const now = nowISO();
  const content = normalized.content;
  const contentPreview = makePreview(content);
  const source = normalized.source;
  const category = classify(content);
  const keywords = extractKeywords(content);
  const filePath = normalized.filePath;
  const url = normalized.url;
  const metadata = normalized.metadata;

  const stmt = db.prepare(`
    INSERT INTO thoughts (
      id, content, content_preview, category, source, status,
      keywords_json, file_path, url, created_at, updated_at,
      reviewed_at, error_message, metadata_json
    ) VALUES (
      ?, ?, ?, ?, ?, 'classified',
      ?, ?, ?, ?, ?,
      NULL, NULL, ?
    )
  `);

  stmt.run(
    id, content, contentPreview, category, source,
    JSON.stringify(keywords), filePath, url, now, now,
    JSON.stringify(metadata),
  );

  // Return the created thought
  return getThoughtById(id);
}

/**
 * Get a single thought by ID.
 * @param {string} id
 * @returns {Thought|null}
 */
function getThoughtById(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM thoughts WHERE id = ?").get(normalizeId(id));
  return row ? rowToThought(row) : null;
}

/**
 * Get today's thoughts (from 00:00 today to now).
 * @param {object} options
 * @param {boolean} [options.includeDeleted=false]
 * @returns {Thought[]}
 */
function getTodayThoughts(options = {}) {
  const db = getDb();
  const includeDeleted = options.includeDeleted === true;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startISO = todayStart.toISOString();

  let sql = "SELECT * FROM thoughts WHERE created_at >= ?";
  if (!includeDeleted) {
    sql += " AND status != 'deleted'";
  }
  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(startISO);
  return rows.map(rowToThought);
}

/**
 * Get all thoughts (no time limit), most recent first.
 * @param {object} options
 * @param {number} [options.limit=100]
 * @param {number} [options.offset=0]
 * @returns {Thought[]}
 */
function getAllThoughts(options = {}) {
  const db = getDb();
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  const rows = db.prepare(
    "SELECT * FROM thoughts WHERE status != 'deleted' ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).all(limit, offset);
  return rows.map(rowToThought);
}

/**
 * Permanently delete a thought.
 * @param {string} id
 * @returns {boolean} true if a row was updated
 */
function deleteThought(id) {
  const db = getDb();
  const result = db.prepare("DELETE FROM thoughts WHERE id = ?").run(normalizeId(id));
  return result.changes > 0;
}

/**
 * Mark a thought as copied.
 * @param {string} id
 * @returns {Thought|null} updated thought, or null if not found
 */
function markCopied(id) {
  const db = getDb();
  const now = nowISO();
  const result = db.prepare(`
    UPDATE thoughts SET status = 'copied', updated_at = ?, reviewed_at = ?
    WHERE id = ? AND status != 'deleted'
  `).run(now, now, normalizeId(id));

  if (result.changes === 0) return null;
  return getThoughtById(id);
}

module.exports = {
  createThought,
  getThoughtById,
  getTodayThoughts,
  getAllThoughts,
  deleteThought,
  markCopied,
  normalizeCreateInput,
};
