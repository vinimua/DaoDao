"use strict";

// ── Database connection singleton ──
// All SQLite access goes through this module.
// Never expose the connection to the renderer.

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const migrations = require("./migrations");

let _db = null;

function getDbPath(dataDir) {
  return path.join(dataDir, "thought-otter.db");
}

function open(dbPath) {
  if (_db) return _db;

  // Ensure parent directory exists
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {}

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  return _db;
}

function init(dbPath) {
  const db = open(dbPath);
  migrations.run(db);
  return db;
}

function getDb() {
  if (!_db) {
    throw new Error("Database not initialized. Call init(dbPath) first.");
  }
  return _db;
}

function close() {
  if (_db) {
    try { _db.close(); } catch {}
    _db = null;
  }
}

module.exports = { open, init, getDb, close, getDbPath };
