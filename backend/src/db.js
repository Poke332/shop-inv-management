import Database from 'better-sqlite3'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = fileURLToPath(new URL('../', import.meta.url))
const databasePath = resolve(backendRoot, process.env.DATABASE_PATH || './data/sunset.db')
mkdirSync(dirname(databasePath), { recursive: true })
const db = new Database(databasePath)

try {
  db.pragma('foreign_keys = ON')
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // 001 yang sudah dijalankan tetap tercatat; file berikutnya diterapkan berurutan.
  const folder = resolve(backendRoot, 'migrations')
  const files = readdirSync(folder).filter(name => /^\d{3}-[\w-]+\.sql$/.test(name)).sort()
  for (const file of files) {
    const version = basename(file, '.sql')
    db.transaction(() => {
      if (db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version)) return
      db.exec(readFileSync(resolve(folder, file), 'utf8'))
      db.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(version)
    }).immediate()
  }
} catch (error) {
  db.close()
  throw error
}

export default db
