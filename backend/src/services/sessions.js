import db from '../db.js'

/**
 * Delete session rows that are revoked or past their expiry.
 *
 * A row survives only while it is unrevoked and still in the future; any
 * revoked row or row at/past its expiry is dropped. The expiry half of the
 * scan uses the sessions(expires_at) index.
 *
 * @param {string} [nowIso] - ISO-8601 UTC timestamp to compare against; defaults to the current time.
 * @returns {number} - The number of session rows removed.
 */
export function purgeExpiredSessions(nowIso = new Date().toISOString()) {
  const result = db.prepare(`
    DELETE FROM sessions
    WHERE revoked = 1 OR expires_at <= ?
  `).run(nowIso)
  return result.changes
}
