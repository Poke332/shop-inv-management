import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import bcrypt from 'bcrypt'

// The auth middleware refuses to load without a long enough secret, so the
// environment must be in place before the app module is imported.
const dir = mkdtempSync(join(tmpdir(), 'shop-inv-login-'))
process.env.DATABASE_PATH = join(dir, 'test.db')
process.env.JWT_SECRET = 'test-secret-key-0123456789-abcdef-32ch'
process.env.NODE_ENV = 'test'

const { default: app } = await import('../src/server.js')
const { default: db } = await import('../src/db.js')
const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
const base = `http://127.0.0.1:${server.address().port}`
const passwordHash = await bcrypt.hash('correct-password', 10)

db.prepare(`INSERT INTO users(username,email,password_hash,role,active)
  VALUES (?,?,?,?,1)`).run('alice', 'alice@test.local', passwordHash, 'buyer')
db.prepare(`INSERT INTO users(username,email,password_hash,role,active)
  VALUES (?,?,?,?,0)`).run('bob', 'bob@test.local', passwordHash, 'staff')

test.after(() => new Promise(resolve => server.close(resolve)))
test.after(() => rmSync(dir, { recursive: true, force: true }))

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
