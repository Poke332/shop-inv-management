import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import postgres from 'postgres'

// The auth middleware refuses to load without a long enough secret, so the
// environment must be in place before the app module is imported. Each run
// works against its own disposable database: created from the maintenance
// connection in DATABASE_URL, dropped in the teardown.
const maintenanceUrl = process.env.DATABASE_URL
if (!maintenanceUrl) throw new Error('DATABASE_URL must point at a Postgres server to run the suite')
const database = `shop-inv-test-${process.pid}`
const testUrl = new URL(maintenanceUrl)
testUrl.pathname = testUrl.pathname.replace(/\/[^/]*$/, `/${database}`)

process.env.DATABASE_URL = testUrl
process.env.JWT_SECRET = 'test-secret-key-0123456789-abcdef-32ch'
process.env.NODE_ENV = 'test'

const admin = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
await admin.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
await admin.unsafe(`CREATE DATABASE "${database}"`)
await admin.end()

const { default: sql, initDatabase } = await import('../src/db.js')
const { default: app } = await import('../src/server.js')
await initDatabase()
const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
const base = `http://127.0.0.1:${server.address().port}`
const passwordHash = await bcrypt.hash('correct-password', 10)

await sql`INSERT INTO users(username,email,password_hash,role,active)
  VALUES ('alice', 'alice@test.local', ${passwordHash}, 'buyer', 1)`
await sql`INSERT INTO users(username,email,password_hash,role,active)
  VALUES ('bob', 'bob@test.local', ${passwordHash}, 'staff', 0)`

test.after(async () => {
  await new Promise(resolve => server.close(resolve))
  await sql.end()
  const drop = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
  await drop.unsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`)
  await drop.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
  await drop.end()
})

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return { status: res.status, body: await res.json() }
}

const WRONG = 'The email address or password is incorrect.'

test('an unknown email and a wrong password are indistinguishable (no timing oracle)', async () => {
  const ghost = await login('ghost@test.local', 'correct-password')
  const wrongPw = await login('alice@test.local', 'definitely-not-it')
  assert.equal(ghost.status, 401)
  assert.equal(wrongPw.status, 401)
  assert.equal(ghost.body.message, WRONG, 'unknown email returns the generic rejection')
  assert.equal(wrongPw.body.message, WRONG, 'wrong password returns the same generic rejection')
})

test('a valid login issues a session', async () => {
  const ok = await login('alice@test.local', 'correct-password')
  assert.equal(ok.status, 200)
  assert.ok(typeof ok.body.token === 'string' && ok.body.token.length > 0, 'returns a JWT')
  assert.equal(ok.body.user.email, 'alice@test.local')
})

test('an inactive account is rejected after the password check', async () => {
  const denied = await login('bob@test.local', 'correct-password')
  assert.equal(denied.status, 403)
  assert.match(denied.body.message, /administrator/)
})
