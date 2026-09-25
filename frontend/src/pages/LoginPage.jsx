import { useEffect, useRef, useState } from 'react'

import { Link, useLocation, useNavigate } from 'react-router'

import { mockApi } from '../data'
import { postLoginHome } from '../guards.jsx'
import { useAuth } from '../hooks/useAuth.js'

/**
 * P3 login page (docs/login/IMPLEMENTATION.md) on the shared AuthLayout
 * two-panel shell. Role-agnostic: one form for all 4 roles — mockApi.login
 * returns the role, and post-login routing is the locked table (buyer -> /,
 * staff -> /ops/orders, manager/admin -> /ops/inventory) via AuthContext's
 * signIn return. 401 -> "Email or password is incorrect." banner; 403
 * (disabled account — the ops_dan case) -> "Account not available — contact
 * an administrator". Success = redirect only (the navigation is the
 * feedback; no toast). Validation per the doc: email required + format on
 * blur; password required, min 8; submit enabled only when both hold. The
 * P1 dev-aid quick-fill buttons for the 5 mock credential rows are kept.
 */
export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [emailErr, setEmailErr] = useState(null)
  const [pwErr, setPwErr] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const bannerRef = useRef(null)

  useEffect(() => {
    if (error && bannerRef.current) bannerRef.current.focus()
  }, [error])

  if (user) return null // the guard already redirects; this is the pre-redirect path

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const pwValid = password.length >= 8
  const canSubmit = emailValid && pwValid

  const submit = async (e) => {
    e.preventDefault()
    if (busy || !canSubmit) return
    setBusy(true)
    setError(null)
    try {
      const res = await mockApi.login(email.trim(), password)
      signIn(res.user, res.role)
      // P3.1 REV 8: guest CTA flow — a login arriving from a purchase CTA
      // (location.state.pendingAdd) returns to the product that started it
      // (postLoginHome for a buyer == '/', so '/' is the browse home; the
      // pending return goes to the product, not the role home). The product
      // page performs the deferred add on mount.
      const pending = location.state?.pendingAdd
      if (pending) {
        navigate(location.state.from || `/products/${pending}`, {
          state: { pendingAdd: pending, buyNow: !!location.state.buyNow },
          replace: true,
        })
      } else {
        navigate(postLoginHome(res.role), { replace: true }) // success = redirect (no toast)
      }
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = (bad) =>
    `h-11 rounded-lg border bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${
      bad ? 'border-strawberryRed-600' : 'border-blueSlate-200'
    }`

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

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailErr(email && !emailValid ? 'Enter a valid email address.' : null)}
            disabled={busy}
            placeholder="you@example.com"
            aria-invalid={!!emailErr}
            aria-describedby={emailErr ? 'login-email-error' : undefined}
            className={`${inputCls(!!emailErr)} w-full`}
          />
          {emailErr ? (
            <span id="login-email-error" className="text-meta text-strawberryRed-600">
              {emailErr}
            </span>
          ) : null}
        </label>

        <div className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          <span>Password</span>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPwErr(password && !pwValid ? 'At least 8 characters.' : null)}
              disabled={busy}
              placeholder="••••••••"
              aria-invalid={!!pwErr}
              className={`${inputCls(!!pwErr)} w-full pr-14`}
            />
            {/* P3.1 REV 7: the show/hide toggle is a bordered box button, not a
                bare text link (input keeps pr-14 so the field never overlaps). */}
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              disabled={busy}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-2 border border-blueSlate-200 rounded-md bg-canvas text-meta text-blueSlate-500 hover:text-ink"
            >
              {showPw ? 'hide' : 'show'}
            </button>
          </div>
          {pwErr ? (
            <span className="text-meta text-strawberryRed-600">{pwErr}</span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy || !canSubmit}
          aria-busy={busy}
          className="btn-primary w-full"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Signing in…
            </span>
          ) : (
            'Sign in →'
          )}
        </button>
      </form>

      <p className="text-body text-inkMuted mt-6">
        New here?{' '}
        <Link to="/register" className="text-atomicTangerine-600 font-medium hover:underline">
          Register
        </Link>
      </p>

      {/* P1 dev aid: quick-fill the 5 mock credential rows (§4.2 table) */}
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
                setEmailErr(null)
                setPwErr(null)
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
