/**
 * Minimal fixed-window rate limiter (in memory, per process). Chat requests
 * cost real money (LLM calls), so anonymous traffic must not be unbounded.
 * For a multi-instance deployment move the counters to a shared store.
 * @param {{limit: number, windowMs: number}} options
 * @returns {import('express').RequestHandler} middleware keyed by client IP.
 */
export function rateLimit({ limit, windowMs }) {
  const hits = new Map()
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }, windowMs)
  sweep.unref()
  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || 'unknown'
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return res.status(429).json({ message: 'Too many messages. Please wait a moment and try again.', code: 'RATE_LIMITED' })
    }
    next()
  }
}
