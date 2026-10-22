import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postLoginHome } from '../utils/postLoginHome.js'
import { AuthContext } from './contextObjects.js'
import { mockApi } from '../data'
import { HTTP_ENABLED } from '../data/runtime.js'
import { token, profile, clearAuth, saveProfile, onAuthChange } from '../data/authStorage.js'

const SESSION_KEY = 'sunset.final-project.session'
function readMockSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

/**
 * The auth provider (session user + role for guards, header, and pages).
 *
 * HTTP mode is lazy by design: the tree is NEVER blocked on a session
 * round-trip. The stored profile seeds `user` locally (no request); the
 * live session is verified by `resolveAuth` — called by the route guards
 * when a guarded route is reached — and by the sunset-auth-refresh event
 * (the 403 re-verify path). Public routes paint without any /auth/me
 * call; the backend-down failure stays localized at the guarded route
 * (its session panel), degrading the storefront to a read-only surface.
 *
 * Session expiry is a state, not an event: `sessionExpired` is true while
 * a session the UI held died unexpectedly (a request 401 -> clearAuth, or
 * a 403 -> re-verify failure). The storefront renders its persistent
 * banner for that state, and re-sign-in returns to the URL + wizard the
 * user was in. An explicit sign-out is flagged intentional, so it never
 * lights the banner.
 *
 * The keyed Fragment stays: switching accounts re-keys the route region
 * (the buyer-account-separation safety) — the cart/wizard now live in the
 * cart provider ABOVE this one, so the re-key only remounts the pages.
 */
export function AuthProvider({ children }) {
  // the stored profile is a local cache of the session (no round-trip);
  // the guards verify it lazily at the guarded routes
  const [user, setUser] = useState(() => HTTP_ENABLED ? profile() : readMockSession())
  // 'idle' (a stored session not yet verified) -> 'checking' -> 'ready'
  // (verified: a user, or a known null); 'error' = the verify could not
  // complete (backend unreachable) — the guarded route shows its own
  // localized session panel, the tree is never blocked.
  // A stored token starts 'idle' (the guards will verify it, lazily); with
  // no token the guest is known up front ('ready'), so public routes paint
  // with zero auth round-trips.
  const [status, setStatus] = useState(HTTP_ENABLED ? (token() ? 'idle' : 'ready') : 'ready')
  const [sessionExpired, setSessionExpired] = useState(false)
  const userRef = useRef(user)
  const statusRef = useRef(status)
  const intentionalSignOut = useRef(false)
  const verifying = useRef(false)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { statusRef.current = status }, [status])

  const resolveAuth = useCallback((forced = false) => {
    if (!HTTP_ENABLED || verifying.current) return
    if (!forced && (statusRef.current === 'ready' || statusRef.current === 'checking')) return
    if (!token()) {
      // no stored session: the guest is known without any round-trip
      setUser(null)
      setStatus('ready')
      return
    }
    verifying.current = true
    setStatus('checking')
    mockApi.me()
      .then((result) => {
        // saveProfile notifies the storage listener, which lands the user,
        // clears the expired flag, and settles status to 'ready'
        saveProfile(result.user)
        setStatus('ready')
      })
      .catch((failure) => {
        if ([401, 403].includes(failure.status)) {
          // re-verify failed: the session is dead — clear the storage; the
          // listener flips the state (expired, when a session was live)
          clearAuth()
          setStatus('ready')
        } else {
          // backend unreachable: the guarded route's localized panel, not
          // a tree-level block
          setStatus('error')
        }
      })
      .finally(() => { verifying.current = false })
  }, [])

  // The storage-level session listeners. httpClient's 401 -> clearAuth and
  // a successful re-verify -> saveProfile both land here. A session that
  // disappears while the UI still held one is the session-expired state
  // (unless the user signed out on purpose, which signOut flags first).
  useEffect(() => {
    if (!HTTP_ENABLED) return undefined
    let active = true
    const unsubscribe = onAuthChange(() => {
      if (!active) return
      const next = profile()
      setUser(next)
      setStatus('ready')
      if (next) {
        setSessionExpired(false)
        intentionalSignOut.current = false
      } else if (!intentionalSignOut.current && userRef.current) {
        setSessionExpired(true)
        intentionalSignOut.current = false
      }
    })
    // the 403 path: any non-/auth/me 403 re-verifies the session; a
    // re-verify failure (401/403 on /auth/me) lands in the listener above
    const reverify = () => resolveAuth(true)
    window.addEventListener('sunset-auth-refresh', reverify)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('sunset-auth-refresh', reverify)
    }
  }, [resolveAuth])

  const signIn = useCallback((account, role) => {
    const next = { ...account, role }
    if (!HTTP_ENABLED) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setUser(next)
    setSessionExpired(false)
    intentionalSignOut.current = false
    setStatus('ready')
    return postLoginHome(role)
  }, [])

  const signOut = useCallback(() => {
    if (HTTP_ENABLED) {
      // flag before clearAuth so the storage listener does not mistake an
      // explicit sign-out for a session expiry
      intentionalSignOut.current = true
      const pending = token() ? mockApi.logout() : Promise.resolve()
      clearAuth()
      pending.catch(() => console.warn('Local session terminated; server session termination not yet confirmed.'))
    }
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    setSessionExpired(false)
    setStatus('ready')
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      signIn,
      signOut,
      sessionExpired,
      authState: status,
      resolveAuth,
    }),
    [user, signIn, signOut, sessionExpired, status, resolveAuth],
  )

  return <AuthContext.Provider value={value}>
    {/* Switching accounts re-keys the route region so the buyer's page
        state is never mixed up (the cart + wizard survive above this key,
        in the cart provider). */}
    <Fragment key={user?.username || 'guest'}>{children}</Fragment>
  </AuthContext.Provider>
}
