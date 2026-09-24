import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './contexts/AuthContext.jsx'

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
export function postLoginHome(role) {
  if (role === 'staff') return '/ops/orders'
  if (role === 'manager' || role === 'admin') return '/ops/inventory'
  return '/'
}

/** Any signed-in user; anonymous -> /login. */
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
 */
export function RequireOps({ role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'buyer' || (role && !role.includes(user.role))) {
    return <Navigate to={postLoginHome(user.role)} replace />
  }
  return <Outlet />
}

/** Anonymous only (login/register); signed-in -> their role home. */
export function RequireAnon() {
  const { user } = useAuth()
  if (user) return <Navigate to={postLoginHome(user.role)} replace />
  return <Outlet />
}
