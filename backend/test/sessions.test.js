import test from 'node:test'
import assert from 'node:assert/strict'
import postgres from 'postgres'

// Isolate each run in a throwaway database so the purge assertions are
// deterministic and never touch a developer or production database: it is
// created from the maintenance connection in DATABASE_URL, dropped in teardown.
const maintenanceUrl = process.env.DATABASE_URL
if (!maintenanceUrl) throw new Error('DATABASE_URL must point at a Postgres server to run the suite')
const database = `shop-inv-test-${process.pid}`
const testUrl = new URL(maintenanceUrl)
testUrl.pathname = testUrl.pathname.replace(/\/[^/]*$/, `/${database}`)

process.env.DATABASE_URL = testUrl
process.env.NODE_ENV = 'test'

const admin = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
await admin.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
await admin.unsafe(`CREATE DATABASE "${database}"`)
await admin.end()

const { default: sql, initDatabase } = await import('../src/db.js')
const { purgeExpiredSessions } = await import('../src/services/sessions.js')
await initDatabase()

test.after(async () => {
  await sql.end()
  const drop = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
  await drop.unsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`)
  await drop.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
  await drop.end()
})

await sql`INSERT INTO users(username,email,password_hash,role,active)
  VALUES ('alice', 'alice@test.local', 'not-used', 'buyer', 1)`
const userId = (await sql`SELECT id FROM users WHERE email = 'alice@test.local'`)[0].id

const NOW = '2026-10-23T00:00:00.000Z'
const insert = (jti, expiresAt, revoked) => sql`INSERT INTO sessions(jti,user_id,expires_at,revoked)
  VALUES (${jti}, ${userId}, ${expiresAt}, ${revoked})`
await insert('j-live', '2026-10-24T00:00:00.000Z', 0) // unrevoked, in the future
await insert('j-expired', '2026-10-22T00:00:00.000Z', 0) // unrevoked, already expired
await insert('j-revoked', '2026-10-24T00:00:00.000Z', 1) // revoked, still in the future
await insert('j-exp-rev', '2026-10-22T00:00:00.000Z', 1) // revoked and expired
await insert('j-exact', NOW, 0) // unrevoked, expires exactly at now (inclusive boundary)

test('purge removes only revoked or expired sessions', async () => {
  const removed = await purgeExpiredSessions(NOW)

  assert.equal(removed, 4, 'four dead rows removed, the live session survives')
  const survivors = (await sql`SELECT jti FROM sessions ORDER BY jti`).map(r => r.jti)
  assert.deepEqual(survivors, ['j-live'])
})

test('purge is idempotent on an already-clean table', async () => {
  assert.equal(await purgeExpiredSessions(NOW), 0, 'nothing left to remove on the second pass')
})
