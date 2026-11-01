import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type Db = DatabaseSync

/** Opens (and creates on first run) data/dale.db plus data/media for uploaded images. */
export function openDb(dataDir: string) {
  mkdirSync(path.join(dataDir, 'media'), { recursive: true })
  const db = new DatabaseSync(path.join(dataDir, 'dale.db'))
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 3000;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      password_changed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      original_name TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY,
      at INTEGER NOT NULL,
      user_id INTEGER,
      event TEXT NOT NULL,
      detail TEXT,
      ip TEXT
    );
    CREATE INDEX IF NOT EXISTS audit_at ON audit(at);
  `)
  // Added with video support.
  const cols = new Set((db.prepare('PRAGMA table_info(media)').all() as { name: string }[]).map((c) => c.name))
  if (!cols.has('kind')) db.exec("ALTER TABLE media ADD COLUMN kind TEXT NOT NULL DEFAULT 'image'")
  if (!cols.has('poster')) db.exec('ALTER TABLE media ADD COLUMN poster TEXT')
  if (!cols.has('size')) db.exec('ALTER TABLE media ADD COLUMN size INTEGER')
  return db
}

export function audit(db: Db, event: string, opts: { userId?: number | null; detail?: string; ip?: string } = {}) {
  db.prepare('INSERT INTO audit (at, user_id, event, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
    Date.now(),
    opts.userId ?? null,
    event,
    opts.detail?.slice(0, 300) ?? null,
    opts.ip ?? null,
  )
  // Keep the log bounded.
  db.prepare('DELETE FROM audit WHERE id <= (SELECT MAX(id) - 5000 FROM audit)').run()
}
