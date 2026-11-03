import jwt from 'jsonwebtoken'
import db from '../db.js'

export const jwtOptions = {
  issuer: process.env.JWT_ISSUER || 'sunset-api',
  audience: process.env.JWT_AUDIENCE || 'sunset-web',
}

export const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET di backend/.env must fill and at least 32 characters long')
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
  }
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Login is required.' })
  }

  let payload
  try {
    payload = jwt.verify(header.slice(7), jwtSecret, {
      ...jwtOptions,
      algorithms: ['HS256'],
    })
    if (typeof payload !== 'object'
        || typeof payload.sub !== 'string'
        || typeof payload.jti !== 'string') {
      throw new Error('Invalid token payload')
    }
  } catch {
    return res.status(401).json({ message: 'The session is not valid or has expired.' })
  }

  const session = db.prepare(`
    SELECT jti FROM sessions
    WHERE jti = ? AND user_id = ? AND revoked = 0 AND expires_at > ?
  `).get(payload.jti, payload.sub, new Date().toISOString())

  if (!session) {
    return res.status(401).json({ message: 'The session is not valid or has expired.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
  if (!user) return res.status(401).json({ message: 'The session is not valid.' })
  if (!user.active) {
    return res.status(403).json({ message: 'Account not available — contact an administrator' })
  }

  req.user = publicUser(user)
  req.sessionId = payload.jti
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Login is required.' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access not allowed.' })
    }
    next()
  }
}
