import { useEffect } from 'react'

import { useAuth } from './useAuth.js'

/**
 * The guarded-route auth seam: every RBAC guard resolves the session
 * lazily (the round-trip happens only when a guarded route is reached —
 * public routes never trigger it) and reads the auth state the guard
 * renders against: 'idle'/'checking' -> the route-local busy skeleton,
 * 'error' -> the localized session panel, 'ready' -> the actor logic.
 * @returns {{user: ({username: string, role: string}|null),
 *   authState: ('idle'|'checking'|'ready'|'error'),
 *   sessionExpired: boolean,
 *   resolveAuth: (forced?: boolean) => void,
 *   signOut: () => void}}
 */
export function useGuardAuth() {
  const { user, authState, sessionExpired, resolveAuth, signOut } = useAuth()
  // Resolve the session lazily on the guarded route's arrival. 'idle' runs
  // the verify once; the 'error' state (backend unreachable) is retried
  // explicitly by the session panel's Retry — no auto-retry loop.
  useEffect(() => {
    if (authState === 'idle') resolveAuth()
  }, [authState, resolveAuth])
  return { user, authState, sessionExpired, resolveAuth, signOut }
}
