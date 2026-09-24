import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { mockApi } from '../data'
import { useAuth } from '../contexts/AuthContext.jsx'

/**
 * P1 minimal login form (P3 ships the full LoginForm: InputField/PrimaryButton
 * stacks + validation per docs/login/IMPLEMENTATION.md). Enough now to prove
 * the AuthContext + post-login routing: 4 role logins → 4 homes, ops_dan
 * disabled → the 403 banner.
 *
 * Route /login — AuthLayout, anonymous only (RequireAnon; signed-in -> role
 * home). Consumes mockApi.login (api/users.js: 401 bad credentials / 403
 * disabled account). On success: signIn(user, role) persists the session and
 * navigates to the post-login home. Surviving state: email/password/error/
 * busy are form-local; the session itself lives in AuthContext.
 */
export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const bannerRef = useRef(null)

  useEffect(() => {
    if (error && bannerRef.current) bannerRef.current.focus()
  }, [error])

  // Authenticated users never stay here (the guard already redirects — this is
  // the post-sign-in path landing before the guard re-runs).
  if (user) {
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return // double-submit guard
    setBusy(true)
    setError(null)
    try {
      const res = await mockApi.login(email.trim(), password)
      const home = signIn(res.user, res.role)
      navigate(home, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-h1 font-h1 text-ink">Sign in</h1>
      <p className="text-body text-inkMuted mt-2">
        One sign-in for every role — the server (mock) returns your role and routes you home.
      </p>

      {error ? (
        <div
          ref={bannerRef}
          role="alert"
          tabIndex={-1}
          className="mt-4 rounded-lg bg-strawberryRed-100 border border-strawberryRed-300 text-strawberryRed-600 text-body px-4 py-3"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="you@mock.local"
            className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
          />
        </label>
        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            placeholder="••••••••"
            className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full"
          aria-busy={busy}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="text-body text-inkMuted mt-6">
        New here?{' '}
        <Link to="/register" className="text-atomicTangerine-600 font-medium hover:underline">
          Register
        </Link>
      </p>

      {/* P1 dev aid: quick-fill the 5 mock credential rows */}
      <div className="mt-6 border-t border-blueSlate-200 pt-4">
        <p className="text-meta text-blueSlate-700 mb-2">Mock credentials (ARCHITECTURE §4.2)</p>
        <div className="flex flex-wrap gap-2">
          {[
            ['buyer', 'buyer_102@mock.local'],
            ['staff', 'marta@mock.local'],
            ['manager', 'rina@mock.local'],
            ['admin', 'ria@mock.local'],
            ['disabled', 'dan@mock.local'],
          ].map(([label, addr]) => (
            <button
              key={addr}
              type="button"
              onClick={() => {
                setEmail(addr)
                setPassword('sunset123')
              }}
              className="text-meta px-2.5 py-1.5 rounded-pill border border-blueSlate-200 bg-canvas text-ink hover:bg-surface"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
