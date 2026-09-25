import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'

/**
 * P3 register page (docs/register/IMPLEMENTATION.md) on the shared AuthLayout
 * two-panel shell. Creates BUYER accounts only (staff/manager/admin are
 * provisioned by an admin — documented assumption). Fields: name (required),
 * email (required + format), password (required, min 8, show toggle),
 * confirm password (=== password, re-validated live when either password
 * changes). Submit enabled only when all four hold. mockApi.register: 409
 * duplicate email -> "An account with this email already exists" under the
 * email field (the rian@mock.local case); 200/201 -> auto sign-in as buyer
 * + redirect to / (the transition to a logged-in storefront is the feedback —
 * no confirmation screen).
 */
export default function RegisterPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [emailErr, setEmailErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => {
    if (emailErr && emailRef.current) emailRef.current.focus()
  }, [emailErr])

  const nameValid = name.trim().length > 0
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const pwValid = password.length >= 8
  const confirmErr = confirm && confirm !== password ? 'Passwords do not match.' : null
  const canSubmit = nameValid && emailValid && pwValid && confirm.length > 0 && !confirmErr

  const submit = async (e) => {
    e.preventDefault()
    if (busy || !canSubmit) return
    setBusy(true)
    setEmailErr(null)
    try {
      const res = await mockApi.register({ username: name.trim(), email: email.trim(), password })
      signIn(res, 'buyer')
      navigate('/', { replace: true }) // success = auto-login + redirect (no confirmation)
    } catch (err) {
      // 409 duplicate + any other failure land under the email field
      setEmailErr(err.message || 'Registration failed.')
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
      <h1 className="text-h1 font-h1 text-ink">Create account</h1>
      <p className="text-body text-inkMuted mt-2">Buyer accounts only — staff accounts are provisioned by an admin.</p>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            placeholder="Jordan Wijaya"
            className={inputCls(false)}
          />
        </label>

        <label ref={emailRef} className="text-meta text-ink font-semibold flex flex-col gap-1.5">
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
            aria-describedby={emailErr ? 'register-email-error' : undefined}
            className={inputCls(!!emailErr)}
          />
          {emailErr ? (
            <span id="register-email-error" className="text-meta text-strawberryRed-600">
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              placeholder="At least 8 characters"
              aria-label="Password"
              className={`${inputCls(false)} w-full pr-14`}
            />
            {/* P3.1 REV 7: bordered box button toggle (matches LoginPage). */}
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
        </div>

        <div className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          <span>Confirm password</span>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              aria-invalid={!!confirmErr}
              aria-label="Confirm password"
              className={`${inputCls(!!confirmErr)} w-full pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              disabled={busy}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-2 border border-blueSlate-200 rounded-md bg-canvas text-meta text-blueSlate-500 hover:text-ink"
            >
              {showConfirm ? 'hide' : 'show'}
            </button>
          </div>
          {confirmErr ? <span className="text-meta text-strawberryRed-600">{confirmErr}</span> : null}
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
              Creating account…
            </span>
          ) : (
            'Create account →'
          )}
        </button>
      </form>

      <p className="text-body text-inkMuted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-atomicTangerine-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
