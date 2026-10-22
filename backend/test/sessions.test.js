import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Isolate each run in a throwaway database so the purge assertions are
// deterministic and never touch a developer or production file.
const dir = mkdtempSync(join(tmpdir(), 'shop-inv-sessions-'))
process.env.DATABASE_PATH = join(dir, 'test.db')
process.env.NODE_ENV = 'test'

const { default: db } = await import('../src/db.js')
const { purgeExpiredSessions } = await import('../src/services/sessions.js')
test.after(() => rmSync(dir, { recursive: true, force: true }))

db.prepare(`INSERT INTO users(username,email,password_hash,role,active)
  VALUES (?,?,?,?,1)`).run('alice', 'alice@test.local', 'not-used', 'buyer')
const userId = db.prepare(`SELECT id FROM users WHERE email = ?`).get('alice@test.local').id

const NOW = '2026-10-23T00:00:00.000Z'
const insert = db.prepare(`INSERT INTO sessions(jti,user_id,expires_at,revoked) VALUES (?,?,?,?)`)
insert.run('j-live', userId, '2026-10-24T00:00:00.000Z', 0) // unrevoked, in the future
insert.run('j-expired', userId, '2026-10-22T00:00:00.000Z', 0) // unrevoked, already expired
insert.run('j-revoked', userId, '2026-10-24T00:00:00.000Z', 1) // revoked, still in the future
insert.run('j-exp-rev', userId, '2026-10-22T00:00:00.000Z', 1) // revoked and expired
insert.run('j-exact', userId, NOW, 0) // unrevoked, expires exactly at now (inclusive boundary)

test('purge removes only revoked or expired sessions', () => {
  const removed = purgeExpiredSessions(NOW)

  assert.equal(removed, 4, 'four dead rows removed, the live session survives')
  const survivors = db.prepare(`SELECT jti FROM sessions ORDER BY jti`).all().map(r => r.jti)
  assert.deepEqual(survivors, ['j-live'])
})

test('purge is idempotent on an already-clean table', () => {
  assert.equal(purgeExpiredSessions(NOW), 0, 'nothing left to remove on the second pass')
})
