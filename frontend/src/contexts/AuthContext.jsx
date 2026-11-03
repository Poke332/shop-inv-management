import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { postLoginHome } from '../utils/postLoginHome.js'
import { AuthContext } from './contextObjects.js'
import { mockApi } from '../data'
import { HTTP_ENABLED } from '../data/runtime.js'
import { token, profile, clearAuth, saveProfile, onAuthChange } from '../data/authStorage.js'

const SESSION_KEY = 'sunset.final-project.session'
function readMockSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => HTTP_ENABLED ? null : readMockSession())
  const [checking, setChecking] = useState(HTTP_ENABLED)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!HTTP_ENABLED) return undefined
    let active = true
    const unsubscribe = onAuthChange(() => {
      if (active) setUser(profile())
    })
    const verify = async () => {
      if (!token()) { if (active) { setUser(null); setChecking(false) }; return }
      try {
        const result = await mockApi.me()
        if (active) { saveProfile(result.user); setUser(result.user); setError(null) }
      } catch (failure) {
        if (!active) return
        if ([401, 403].includes(failure.status)) { clearAuth(); setUser(null) }
        else setError('Unable to check the session. Make sure the backend is running.')
      } finally {
        if (active) setChecking(false)
      }
    }
    const refresh = () => { verify() }
    window.addEventListener('sunset-auth-refresh', refresh)
    verify()
    return () => { active = false; unsubscribe(); window.removeEventListener('sunset-auth-refresh', refresh) }
  }, [retry])

  const signIn = useCallback((account, role) => {
    const next = { ...account, role }
    if (!HTTP_ENABLED) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setUser(next)
    setError(null)
    return postLoginHome(role)
  }, [])

  const signOut = useCallback(() => {
    if (HTTP_ENABLED) {

      const pending = token() ? mockApi.logout() : Promise.resolve()
      clearAuth()
      pending.catch(() => console.warn('Local session terminated; server session termination not yet confirmed.'))
    }
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    setError(null)
    setChecking(false)
  }, [])

  const value = useMemo(() => ({ user, role: user?.role || null, signIn, signOut }), [user, signIn, signOut])
  if (checking) return <p role="status" className="p-6">Checking the session…</p>
  if (error) return <div role="alert" className="p-6">
    <p>{error}</p>
    <button type="button" onClick={() => { setChecking(true); setError(null); setRetry(value => value + 1) }}>Retry</button>
    <button type="button" onClick={signOut}>Sign out</button>
  </div>

  return <AuthContext.Provider value={value}>
    {/* Switching accounts triggers a rebuild of the cart/wizard to ensure the buyer's state isn't mixed up. */}
    <Fragment key={user?.username || 'guest'}>{children}</Fragment>
  </AuthContext.Provider>
}
