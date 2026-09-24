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
 */
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './contexts/AuthContext.jsx'

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
 * Anonymous only (login/register); a signed-in session -> its role home.
 * @returns {import('react').ReactElement} the nested route, or a redirect to
 *   the signed-in user's post-login home.
 */
export function RequireAnon() {
  const { user } = useAuth()
  if (user) return <Navigate to={postLoginHome(user.role)} replace />
  return <Outlet />
}
