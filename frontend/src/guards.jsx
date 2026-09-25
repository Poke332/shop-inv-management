/**
 * P1 RBAC route guards (docs/IMPLEMENTATION.md P1 + §route table).
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
 * P3.1 REV 8: the browse routes (`/`, `/search`) moved to a NEW
 * RequireGuestOrBuyer guard (6th export in this sanctioned multi-export
 * module) — guests browse freely, staff+ still redirect to their ops home;
 * `/products/:id` is now public (unguarded) with a null-safe role check in
 * the page; cart/checkout/orders stay under RequireBuyer.
 */
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './hooks/useAuth.js'

/**
 * The post-login home per role (the locked homes in the module doc above):
 * staff -> /ops/orders, manager/admin -> /ops/inventory, buyer -> /.
 * @param {string} role
 * @returns {string}
 */
export function postLoginHome(role) {
  if (role === 'staff') return '/ops/orders'
  if (role === 'manager' || role === 'admin') return '/ops/inventory'
  return '/'
}

/**
 * Any signed-in user (all 4 roles); anonymous -> /login.
 * @returns {import('react').ReactElement} the nested route (<Outlet/>) or a
 *   <Navigate to="/login" /> redirect (state.from = the attempted path).
 */
export function RequireUser() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}

/**
 * Buyer-only (cart / checkout / orders). A staff+ session hitting these
 * redirects to its ops home — the buyer catalog is buyer-scoped (the
 * main-store decision #8 note: staff never land on storefront homes).
 * @returns {import('react').ReactElement} the nested route, or a redirect to
 *   /login (anonymous) / the role's ops home (staff+).
 */
export function RequireBuyer() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'buyer') return <Navigate to={postLoginHome(user.role)} replace />
  return <Outlet />
}

/**
 * Ops routes (staff/manager/admin), optionally tightened via `role`.
 * A buyer session on /ops/* -> / ; anonymous -> /login.
 * @param {{role?: string[]}} props  an optional role allowlist, e.g.
 *   router.jsx's `requireManagerOrAdmin` / `requireAdmin` elements pass
 *   role={['manager','admin']} / role={['admin']}.
 * @returns {import('react').ReactElement} the nested route, or a redirect to
 *   /login (anonymous) / the role's post-login home (excluded roles).
 */
export function RequireOps({ role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'buyer' || (role && !role.includes(user.role))) {
    return <Navigate to={postLoginHome(user.role)} replace />
  }
  return <Outlet />
}

/**
 * P3.1 REV 8 — browse routes open to GUESTS or buyers: `/` and `/search`.
 *   anonymous -> Outlet (browse freely; purchase CTAs self-gate to /login)
 *   buyer     -> Outlet
 *   staff/manager/admin -> Navigate to their post-login ops home (staff
 *   never land on storefront browse pages — the main-store decision #8 note).
 * Sanctioned multi-export module: this is the 6th export inside guards.jsx
 * (no-split ruling — do NOT carve it into its own file).
 * @returns {import('react').ReactElement} the nested route, or a redirect to
 *   the staff+ role's ops home.
 */
export function RequireGuestOrBuyer() {
  const { user } = useAuth()
  if (user && user.role !== 'buyer') return <Navigate to={postLoginHome(user.role)} replace />
  return <Outlet />
}

/**
 * Anonymous only (login/register); a signed-in session -> its role home.
 * P3.1 REV 8: this guard OWNS post-login routing for the auth pair. A guest
 * CTA (ProductCard / ProductDetailsPage "Sign in to buy") lands on /login
 * with location.state = {from, pendingAdd, buyNow}; when that intent is
 * present, return the user to state.from carrying the pending payload (the
 * product page performs the deferred add on mount) instead of the role
 * home. A normal sign-in (no "from") still redirects to postLoginHome(role).
 * @returns {import('react').ReactElement} the nested route, or a redirect to
 *   the signed-in user's post-login home (or the guest-CTA origin).
 */
export function RequireAnon() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Outlet />
  const intent = location.state?.from
  if (intent) return <Navigate to={intent} state={location.state} replace />
  return <Navigate to={postLoginHome(user.role)} replace />
}
