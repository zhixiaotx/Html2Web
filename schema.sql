-- schema.sql
-- Cloudflare D1 关系型 SQLite 数据库建表文件

CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  html TEXT,
  css TEXT,
  js TEXT,
  is_public INTEGER DEFAULT 1,
  passcode TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  forked_from TEXT,
  tags TEXT
);

CREATE INDEX IF NOT EXISTS idx_snippets_slug ON snippets(slug);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
