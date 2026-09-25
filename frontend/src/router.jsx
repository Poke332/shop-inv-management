import { Route, Routes } from 'react-router'

import {
  RequireBuyer,
  RequireOps,
  RequireAnon,
  RequireGuestOrBuyer,
} from './guards.jsx'
import StorefrontLayout from './layouts/StorefrontLayout.jsx'
import OpsShell from './layouts/OpsShell.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import DevTokenSmokePage from './pages/DevTokenSmokePage.jsx'
import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import ProductDetailsPage from './pages/ProductDetailsPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import {
  OngoingOrdersPage,
  OngoingOrderDetailPage,
  InventoryPage,
  ProductsPage,
  ProductEditPage,
  ReviewsPage,
  UsersPage,
} from './pages/OpsPages.jsx'

/**
 * The single route tree (docs/IMPLEMENTATION.md §route table, the source
 * of truth). All 14 routes + the dev-only token-smoke check:
 *
 *   /                main-store        storefront, guest or buyer (RequireGuestOrBuyer)
 *   /search          search-browse     storefront, guest or buyer (RequireGuestOrBuyer)
 *   /products/:id    product-details   storefront, PUBLIC (guests: variant A; staff+: variant B)
 *   /cart            cart              storefront, buyer (RequireBuyer)
 *   /checkout        checkout         storefront, buyer (RequireBuyer)
 *   /orders          orders-placed    storefront, buyer (RequireBuyer)
 *   /login /register auth pair        AuthLayout, anonymous (RequireAnon)
 *   /ops/*           7 ops routes     OpsShell (RequireOps + per-route roles)
 *
 * Guards REDIRECT non-actors (staff+ hitting browse -> their ops home,
 * anonymous hitting cart/checkout/orders -> /login, buyer on ops routes -> /)
 * — NEVER a 403 page. Browse (/, /search) is guest-or-buyer and
 * /products/:id is public; the purchase CTAs inside them self-gate to /login
 * for guests.
 *
 * /dev/token-smoke keeps the theme smoke check available in dev; it is NOT
 * part of the route table.
 */

/**
 * Pre-created guard elements for the nested /ops role tiers. (Rolldown's
 * parser choked on a string-array literal inside a JSX *attribute*
 * expression; top-level element constants avoid the quirk entirely —
 * behaviour is identical: each is a <RequireOps role=…/> wrapper.)
 *
 * @type {object}
 */
const requireManagerOrAdmin = <RequireOps role={['manager', 'admin']} />
const requireAdmin = <RequireOps role={['admin']} />

/**
 * The single route tree (module doc = the route table): 14 storefront /
 * auth / ops routes, the dev-only /dev/token-smoke, and the top-level
 * 404 catch-all.
 * @returns {object} the <Routes/> tree.
 */
export default function AppRoutes() {
  const DevSmoke = import.meta.env.DEV ? DevTokenSmokePage : null
  return (
    <Routes>
      {/* ---- storefront routes: StorefrontHeader layout ---- */}
      {/* browse is guest-or-buyer; product-details is PUBLIC;
          cart/checkout/orders stay buyer-only. */}
      <Route element={<StorefrontLayout />}>
        <Route element={<RequireGuestOrBuyer />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
        {/* product-details is the one storefront route open to EVERYONE
            (guests see variant A; staff+ still see variant B via the
            null-safe user?.role check in the page). Unguarded/public. */}
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route element={<RequireBuyer />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Route>
      </Route>

      {/* ---- auth pair: AuthLayout, anonymous only ---- */}
      <Route element={<AuthLayout />}>
        <Route element={<RequireAnon />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* ---- ops console: OpsShell, staff/manager/admin only ---- */}
      <Route element={<RequireOps />}>
        <Route element={<OpsShell />}>
          <Route path="/ops/orders" element={<OngoingOrdersPage />} />
          <Route path="/ops/orders/:id" element={<OngoingOrderDetailPage />} />
          <Route path="/ops/inventory" element={<InventoryPage />} />
          <Route element={requireManagerOrAdmin}>
            <Route path="/ops/products" element={<ProductsPage />} />
            <Route path="/ops/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/ops/reviews" element={<ReviewsPage />} />
          </Route>
          <Route element={requireAdmin}>
            <Route path="/ops/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* dev-only token smoke check, not in the route table */}
      {DevSmoke ? <Route path="/dev/token-smoke" element={<DevSmoke />} /> : null}

      {/* unknown path: the dedicated 404 page (replaced the old
          <Navigate to="/" /> redirect). Top-level, outside the layout/guard
          groups, so it applies to ANY unknown path (incl. unknown /ops/*) and
          is reachable regardless of auth state — anon sees the 404, not a
          forced /login. Known-route RBAC redirects are untouched. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
