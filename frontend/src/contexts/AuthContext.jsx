import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { postLoginHome } from '../guards.jsx'

/**
 * P1 AuthContext (docs/login/IMPLEMENTATION.md "Surviving state"): the session
 * user + role for the lifetime of the session. Drives every route guard and
 * the header account menu. Built from mockApi.login/register (P2) — the
 * session persists across refresh via sessionStorage so back/refresh on any
 * page keeps the user signed in.
 *
 * Placement note: lives in src/contexts (not src/hooks) because it owns
 * state; the useAuth accessor is exported from the same module.
 */
const SESSION_KEY = 'sunset.session'

const AuthContext = createContext(null)

/** Hydrates/restores the session on mount. */
function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || typeof s.username !== 'string' || !s.role) return null
    return s
  } catch {
    return null
  }
}

/**
 * Session provider: the user + role every guard, header menu, and page
 * reads. signIn persists {username, role} to sessionStorage and returns
 * the post-login home; signOut clears the session.
 * @param {{children: import('react').ReactNode}} props
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  const signIn = useCallback((user, role) => {
    const s = { username: user.username, role }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
    return postLoginHome(role)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  // Derive the stable user object from the session state (not every render),
  // and memoize the context value on the session so the provider only re-renders
  // consumers when the actual session identity changes.
  const value = useMemo(() => {
    const user = session ? { username: session.username, role: session.role } : null
    return { user, role: user ? user.role : null, signIn, signOut }
  }, [session, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * The auth context value.
 * @returns {{user: ({username: string, role: string}|null), role: (string|null),
 *            signIn: (user: object, role: string) => string,
 *            signOut: () => void}}
 * @throws {Error} when called outside <AuthProvider>
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
