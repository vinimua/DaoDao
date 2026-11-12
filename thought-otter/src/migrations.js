"use strict";

// ── Database migrations ──
// Runs schema initialization on first open.
// Idempotent: uses IF NOT EXISTS so it's safe to run on every startup.

function run(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS thoughts (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      content_preview TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      file_path TEXT,
      url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reviewed_at TEXT,
      error_message TEXT,
      metadata_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at);
    CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
    CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

  `);
}

module.exports = { run };
