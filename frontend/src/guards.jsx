/**
 * RBAC route guards (docs/IMPLEMENTATION.md §route table).
 *
 * The locked post-login homes (ARCHITECTURE §4.2 "Mock credentials"):
 *   buyer -> /          staff -> /ops/orders
 *   manager -> /ops/inventory   admin -> /ops/inventory
 *
 * Non-actors REDIRECT — they never see a 403 page:
 *   anonymous     -> /login
 *   staff+ on buyer-only homes -> their ops home
 *   buyer on ops routes -> /
 *
 * The browse routes (`/`, `/search`) are gated by RequireGuestOrBuyer (the
 * 6th export in this sanctioned multi-export module) — guests browse freely,
 * staff+ still redirect to their ops home; `/products/:id` is public
 * (unguarded) with a null-safe role check in the page; cart/checkout/orders
 * stay under RequireBuyer.
 *
 * Per-guard redirect (never-403) decision table — where each guard sends an
 * actor that is NOT allowed through:
 *   RequireUser         anon -> /login ; every role -> <Outlet/>
 *   RequireBuyer        anon -> /login ; buyer -> <Outlet/> ; staff+ -> their ops home
 *   RequireOps          anon -> /login ; buyer -> / ; excluded staff/manager/admin -> their ops home
 *   RequireGuestOrBuyer anon -> <Outlet/> ; buyer -> <Outlet/> ; staff+ -> their ops home
 *   RequireAnon         anon -> <Outlet/> ; signed-in -> postLoginHome(role)
 *                       (or back to location.state.from when the guest-CTA /
 *                       re-auth payload is set)
 *
 * Session resolution is LAZY (route-level, not app-level): the public
 * guards (RequireGuestOrBuyer) never trigger the /auth/me round-trip — the
 * stored profile already carries the routing decision, so public routes
 * paint with zero auth RTT. The session-needing guards (RequireUser /
 * RequireBuyer / RequireOps / RequireAnon) resolve the session when their
 * route is reached: while it verifies they render a route-local busy
 * skeleton (aria-busy on the guard container), and when the backend is
 * unreachable they render a localized session panel — the tree is never
 * blocked. An expired session (the sessionExpired state, set by the
 * storage listener) keeps the buyer routes on the page: the storefront's
 * persistent banner handles re-auth, which returns to the same URL +
 * wizard. Anonymous redirects carry `state.from` so the return after
 * sign-in lands back where the visit started.
 */
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './hooks/useAuth.js'
import { useGuardAuth } from './hooks/useGuardAuth.js'
import { postLoginHome } from './utils/postLoginHome.js'

// Shared redirect mapping lives in utils/postLoginHome.js.

/**
 * The guard's route-local busy container: the session is being verified
 * (lazily, at this guarded route) — a skeleton stands in for the page
 * area instead of blocking the whole tree. aria-busy on the container,
 * the announcement is polite (role="status").
 * @returns {object}
 */
function GuardPending() {
  return (
    <div aria-busy="true" role="status" className="page pt-section-rhythm pb-section-rhythm">
      <span className="sr-only">Checking your session…</span>
      <div className="skeleton w-full mb-6" style={{ height: 40 }} />
      <div className="skeleton w-full mb-4" style={{ height: 108 }} />
      <div className="skeleton w-full" style={{ height: 108 }} />
    </div>
  )
}

/**
 * The guard's localized session panel (the backend is unreachable, so the
 * stored session cannot be verified): the page area shows the failure +
 * Retry / Sign out — no tree-level block, the rest of the app renders.
 * @param {{onRetry: () => void, onSignOut: () => void}} props
 * @returns {object}
 */
function GuardSessionPanel({ onRetry, onSignOut }) {
  return (
    <div className="page pt-section-rhythm pb-section-rhythm" role="alert">
      <div className="state-error">
        Unable to check the session. Make sure the backend is running.{' '}
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="ml-2 underline font-semibold" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}

/**
 * The session-needing guard's shared state machine (local, not exported):
 * lazily resolved auth states render the pending skeleton / the localized
 * session panel; the verified state hands back to the guard's actor
 * logic. Guards pass their ready-state element/decision as `ready`.
 * Hook-named (it calls the useGuardAuth hook): each guard component
 * returns useGuardSession({...}) as its element.
 * @param {{pending: object, error: (resolveAuth: () => void, signOut: () => void) => object,
 *   ready: ({user: object|null, sessionExpired: boolean}) => object}} handlers
 * @returns {object} the guard's rendered element.
 */
function useGuardSession({ pending, error, ready }) {
  const { user, authState, sessionExpired, resolveAuth, signOut } = useGuardAuth()
  if (authState === 'idle' || authState === 'checking') return pending
  if (authState === 'error') return error(resolveAuth, signOut)
  return ready({ user, sessionExpired })
}

/**
 * Any signed-in user (all 4 roles); anonymous -> /login.
 * @returns {object} the nested route (<Outlet/>) or a <Navigate to="/login" />
 *   redirect (state.from = the attempted path).
 */
export function RequireUser() {
  const location = useLocation()
  return useGuardSession({
    pending: <GuardPending />,
    error: (resolveAuth, signOut) => <GuardSessionPanel onRetry={resolveAuth} onSignOut={signOut} />,
    ready: ({ user, sessionExpired }) => {
      if (!user) return sessionExpired ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
      return <Outlet />
    },
  })
}

/**
 * Buyer-only (cart / checkout / orders). A staff+ session hitting these
 * redirects to its ops home — the buyer catalog is buyer-scoped (the
 * main-store decision #8 note: staff never land on storefront homes).
 * An expired session (sessionExpired state) STAYS on the route: the
 * storefront's persistent banner offers the re-sign-in that preserves the
 * URL + wizard; a plain anonymous visit goes to /login carrying the URL.
 * @returns {object} the nested route, or a redirect to /login (anonymous)
 *   / the role's ops home (staff+).
 */
export function RequireBuyer() {
  const location = useLocation()
  return useGuardSession({
    pending: <GuardPending />,
    error: (resolveAuth, signOut) => <GuardSessionPanel onRetry={resolveAuth} onSignOut={signOut} />,
    ready: ({ user, sessionExpired }) => {
      if (!user) {
        if (sessionExpired) return <Outlet />
        return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
      }
      if (user.role !== 'buyer') return <Navigate to={postLoginHome(user.role)} replace />
      return <Outlet />
    },
  })
}

/**
 * Ops routes (staff/manager/admin), optionally tightened via `role`.
 * A buyer session on /ops/* -> / ; anonymous -> /login (state.from carries
 * the ops URL back after re-auth).
 * @param {{role?: string[]}} props  an optional role allowlist, e.g.
 *   router.jsx's `requireManagerOrAdmin` / `requireAdmin` elements pass
 *   role={['manager','admin']} / role={['admin']}.
 * @returns {object} the nested route, or a redirect to /login (anonymous)
 *   / the role's post-login home (excluded roles).
 */
export function RequireOps({ role }) {
  const location = useLocation()
  return useGuardSession({
    pending: <GuardPending />,
    error: (resolveAuth, signOut) => <GuardSessionPanel onRetry={resolveAuth} onSignOut={signOut} />,
    ready: ({ user }) => {
      if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
      if (user.role === 'buyer' || (role && !role.includes(user.role))) {
        return <Navigate to={postLoginHome(user.role)} replace />
      }
      return <Outlet />
    },
  })
}

/**
 * Browse routes open to GUESTS or buyers: `/` and `/search`.
 *   anonymous -> Outlet (browse freely; purchase CTAs self-gate to /login)
 *   buyer     -> Outlet
 *   staff/manager/admin -> Navigate to their post-login ops home (staff
 *   never land on storefront browse pages — the main-store decision #8 note).
 * Public guard: NO session verification (the stored profile carries the
 * routing decision) — public routes paint without an /auth/me round-trip,
 * and a downed backend degrades the storefront to its read-only states.
 * Sanctioned multi-export module: this is the 6th export inside guards.jsx
 * (no-split ruling — do NOT carve it into its own file).
 * @returns {object} the nested route, or a redirect to the staff+ role's
 *   ops home.
 */
export function RequireGuestOrBuyer() {
  const { user } = useAuth()
  if (user && user.role !== 'buyer') return <Navigate to={postLoginHome(user.role)} replace />
  return <Outlet />
}

/**
 * Anonymous only (login/register); a signed-in session -> its role home.
 * This guard OWNS post-login routing for the auth pair. A guest
 * CTA (ProductCard / ProductDetailsPage "Sign in to buy") lands on /login
 * with location.state = {from, pendingAdd, buyNow}; the re-auth after a
 * session expiry lands the same way ({from}); when a `from` intent is
 * present, return the user to it (the product page performs the deferred
 * add on mount; the checkout/cart routes resume the surviving wizard).
 * A normal sign-in (no "from") still redirects to postLoginHome(role).
 * @returns {object} the nested route, or a redirect to the signed-in user's
 *   post-login home (or the CTA / re-auth origin).
 */
export function RequireAnon() {
  const location = useLocation()
  return useGuardSession({
    pending: <GuardPending />,
    error: (resolveAuth, signOut) => <GuardSessionPanel onRetry={resolveAuth} onSignOut={signOut} />,
    ready: ({ user }) => {
      if (!user) return <Outlet />
      const intent = location.state?.from
      if (intent) return <Navigate to={intent} state={location.state} replace />
      return <Navigate to={postLoginHome(user.role)} replace />
    },
  })
}
