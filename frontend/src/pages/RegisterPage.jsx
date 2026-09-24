import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { mockApi } from '../data'
import { useAuth } from '../contexts/AuthContext.jsx'

/**
 * P1 minimal register form (P3 ships the full RegisterForm per
 * docs/register/IMPLEMENTATION.md). Enough now to prove: create buyer
 * session → auto sign-in → redirect to / ; duplicate email → 409 under the
 * email field (rian@mock.local is the standing case).
 *
 * Route /register — AuthLayout, anonymous only (RequireAnon). Consumes
 * mockApi.register (api/users.js: 409 duplicate email). On success:
 * signIn(user, 'buyer') persists the session and navigates to the buyer home
 * (/). Surviving state: name/email/password/confirm + the inline errors are
 * form-local.
 */
export default function RegisterPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => {
    if (emailError && emailRef.current) emailRef.current.focus()
  }, [emailError])

  const liveConfirmError = confirm && confirm !== password ? 'Passwords do not match.' : null
  const shownConfirmError = liveConfirmError

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setEmailError(null)
    try {
      const res = await mockApi.register({ username: name.trim(), email: email.trim(), password })
      signIn(res, 'buyer')
      navigate('/', { replace: true })
    } catch (err) {
      if (err.status === 409) setEmailError(err.message)
      else setEmailError(err.message || 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

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
            placeholder="Jordan W."
            className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
          />
        </label>

        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5" ref={emailRef}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="you@mock.local"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'register-email-error' : undefined}
            className={`h-11 rounded-lg border bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${emailError ? 'border-strawberryRed-600' : 'border-blueSlate-200'}`}
          />
          {emailError ? (
            <span id="register-email-error" className="text-meta text-strawberryRed-600">
              {emailError}
            </span>
          ) : null}
        </label>

        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            placeholder="At least 8 characters"
            className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
          />
        </label>

        <label className="text-meta text-ink font-semibold flex flex-col gap-1.5">
          Confirm password
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
            aria-invalid={!!shownConfirmError}
            className={`h-11 rounded-lg border bg-canvas px-3 text-body text-ink focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${shownConfirmError ? 'border-strawberryRed-600' : 'border-blueSlate-200'}`}
          />
          {shownConfirmError ? (
            <span className="text-meta text-strawberryRed-600">{shownConfirmError}</span>
          ) : null}
        </label>

        <button type="submit" disabled={busy || !!shownConfirmError} className="btn-primary w-full" aria-busy={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Creating account…
            </span>
          ) : (
            'Create account'
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
