import postgres from 'postgres'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = fileURLToPath(new URL('../', import.meta.url))

// Product image upload directory; stays at backend/data/uploads even when the database lives elsewhere.
export const uploadsDir = resolve(backendRoot, 'data/uploads')
mkdirSync(uploadsDir, { recursive: true })

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL must be set (see backend/.env.example)')

const poolSize = Number(process.env.DB_POOL_MAX || 25)
if (!Number.isInteger(poolSize) || poolSize < 1 || poolSize > 100) throw new Error('DB_POOL_MAX must be an integer from 1 to 100')

// int4/int8 decode as JS numbers so money and stock arithmetic stays plain arithmetic.
const sql = postgres(url, {
  // The product list fans out one spec lookup per row; size the pool to absorb
  // that concurrency and recycle connections so a half-open slot left by the
  // pooler's idle reclaim can't wedge every subsequent DB request.
  max: poolSize,
  connection_timeout: 5, // seconds to establish a connection; fail a stuck one fast
  idle_timeout: 2000, // close idle clients (ms) before the pooler reclaims them
  max_lifetime: 60000, // recycle each connection after 60s (ms)
  // The DB sits behind a pgBouncer *transaction* pooler; its connection
  // reassignment breaks Pegasus's named prepared statements ("prepared
  // statement ... does not exist"). Pegasus docs: set prepare:false for
  // pgBouncer in transaction mode (falls back to the simple query protocol).
  prepare: false,
  types: {
    int4: { from: 23, parse: Number },
    int8: { from: 20, parse: Number },
  },
  // The runner touches CREATE TABLE IF NOT EXISTS on every call; keep the
  // "relation already exists" notices out of the boot and seed logs.
  onnotice: () => {},
})

let migrationPromise
// Applies the migrations not yet recorded in schema_migrations, in file order.
// Repeated calls join the first run, so the boot path and the seed path can both call it.
export function initDatabase() {
  migrationPromise ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
    )`
    const folder = resolve(backendRoot, 'migrations')
    const files = readdirSync(folder).filter(name => /^\d{3}-[\w-]+\.sql$/.test(name)).sort()
    for (const file of files) {
      const version = basename(file, '.sql')
      if ((await sql`SELECT version FROM schema_migrations WHERE version = ${version}`).length) continue
      await sql.begin(async tx => {
        await tx.unsafe(readFileSync(resolve(folder, file), 'utf8'))
        await tx`INSERT INTO schema_migrations(version) VALUES (${version})`
      })
    }
  })()
  return migrationPromise
}

export default sql
