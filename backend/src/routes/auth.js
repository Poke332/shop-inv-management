import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import { jwtOptions, jwtSecret, publicUser, requireAuth } from '../middleware/auth.js'

// A fixed bcrypt hash compared against when the email is unknown, so login
// timing does not reveal which email addresses exist.
const DUMMY_PASSWORD_HASH = '$2b$12$u1oy8Qk3qHRUvZWqm5hWZOPDJx23fd4tqEQB0eXrvJOtLp8xI/2HG'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createSession(user) {
  const jti = randomUUID()
  const token = jwt.sign({}, jwtSecret, {
    ...jwtOptions,
    algorithm: 'HS256',
    subject: String(user.id),
    jwtid: jti,
    expiresIn: '1h',
  })
  const expiresAt = new Date(jwt.decode(token).exp * 1000).toISOString()
  db.prepare('INSERT INTO sessions(jti,user_id,expires_at) VALUES (?,?,?)')
    .run(jti, user.id, expiresAt)
  return { token, user: publicUser(user), role: user.role }
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {}
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 80
      || typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())
      || typeof password !== 'string' || password.length < 8
      || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'The name, email address, or password is invalid. Passwords must be at least 8 characters and no more than 72 bytes long..' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const hash = await bcrypt.hash(password, 12)
  try {
    const result = db.transaction(() => {
      const inserted = db.prepare(`
        INSERT INTO users(username,email,password_hash,role,active)
        VALUES (?,?,?,'buyer',1)
      `).run(username.trim(), normalizedEmail, hash)
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(inserted.lastInsertRowid)
      return createSession(user)
    }).immediate()
    return res.status(201).json(result)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Account name or email is already in use.' })
    }
    throw error
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || !emailPattern.test(email.trim())
      || typeof password !== 'string' || password.length < 8
      || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'The email address or password is invalid.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase())
  if (!(await bcrypt.compare(password, user ? user.password_hash : DUMMY_PASSWORD_HASH))) {
    return res.status(401).json({ message: 'The email address or password is incorrect.' })
  }
  if (!user.active) {
    return res.status(403).json({ message: 'Account not available — contact an administrator' })
  }
  return res.json(createSession(user))
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user, role: req.user.role })
})

router.post('/logout', requireAuth, (req, res) => {
  db.prepare('UPDATE sessions SET revoked = 1 WHERE jti = ?').run(req.sessionId)
  res.status(204).end()
})

export default router
