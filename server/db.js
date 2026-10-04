import { readFileSync, mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
// Database and uploaded images live outside server/ so the dev watcher doesn't restart on every write
export const DATA_DIR = process.env.DATA_DIR ?? join(here, '../data')
mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(join(DATA_DIR, 'multiprint.db'))

db.exec(`
  PRAGMA journal_mode = WAL;

  -- Site content, products and categories, each stored as one JSON document
  CREATE TABLE IF NOT EXISTS documents (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );

  -- One row per page view. visitor is a salted hash that changes daily (no personal data kept)
  CREATE TABLE IF NOT EXISTS visits (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ts       INTEGER NOT NULL,
    day      TEXT NOT NULL,
    visitor  TEXT NOT NULL,
    path     TEXT NOT NULL,
    referrer TEXT,
    device   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS visits_day ON visits (day);

  -- Orders and contact messages sent from the website forms
  CREATE TABLE IF NOT EXISTS requests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT NOT NULL,
    data       TEXT NOT NULL,
    read       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

const getDoc = db.prepare('SELECT value FROM documents WHERE key = ?')
const putDoc = db.prepare(`
  INSERT INTO documents (key, value) VALUES (?, ?)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
`)

export const readDoc = (key) => {
  const row = getDoc.get(key)
  return row ? JSON.parse(row.value) : null
}

export const writeDoc = (key, value) => putDoc.run(key, JSON.stringify(value))

// First start: fill the database with the content currently shipped with the website
const defaults = JSON.parse(readFileSync(join(here, '../src/data/defaults.json'), 'utf8'))
for (const key of ['site', 'categories', 'products']) {
  if (readDoc(key) === null) writeDoc(key, defaults[key])
}

const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?')
const putSetting = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
)

export const readSetting = (key) => getSetting.get(key)?.value ?? null
export const writeSetting = (key, value) => putSetting.run(key, value)

// ---------- One-time upgrades of content stored by older versions ----------

// v2: content becomes multilingual (English base + `i18n.fr` / `i18n.ar` translations)
if (Number(readSetting('content_version') ?? 1) < 2) {
  const site = readDoc('site')
  if (!site.i18n) writeDoc('site', { ...site, i18n: defaults.site.i18n })

  const defaultCategory = Object.fromEntries(defaults.categories.map((c) => [c.id, c]))
  writeDoc(
    'categories',
    readDoc('categories').map((c) => (c.i18n ? c : { ...c, i18n: defaultCategory[c.id]?.i18n ?? {} })),
  )

  // Products still holding the original French text get the English base + translations;
  // products edited in the dashboard are kept as they are
  const defaultProduct = Object.fromEntries(defaults.products.map((p) => [p.id, p]))
  writeDoc(
    'products',
    readDoc('products').map((p) => {
      const d = defaultProduct[p.id]
      if (p.i18n || !d) return p
      return d.i18n.fr.title === p.title ? { ...d, featured: p.featured, category: p.category } : p
    }),
  )
  writeSetting('content_version', '2')
}
