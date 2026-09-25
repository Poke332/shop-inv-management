import { useLocation, useParams } from 'react-router'

import { useAuth } from '../hooks/useAuth.js'

/**
 * P1 ops route-slot placeholder. P5/P6 fill these with the real pages
 * (ongoing-orders, inventory-dashboard, per-product-dashboard, review panel,
 * user-dashboard — see each docs/<page>/IMPLEMENTATION.md). The slot renders
 * inside the OpsShell's .ops-content gutter, so the v4 gutter is live on
 * every ops route now. Echoes the live URL + the signed-in session
 * (AuthContext) so the RBAC redirects are visible while the real pages are
 * still placeholders.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a P5/P6 note).
 */
export function OpsPlaceholder({ title, subtitle }) {
  const location = useLocation()
  const user = useAuth().user
  return (
    <div className="ops-page">
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding max-w-content">
        <h1 className="text-h1 font-h1 text-ink">{title}</h1>
        <p className="text-body text-inkMuted mt-section-label-gap">
          {subtitle || 'Placeholder route slot — the real page lands in P5/P6.'}
        </p>
        <p className="text-meta text-blueSlate-700 mt-2" data-echo>
          URL: {location.pathname}{location.search}
          {user ? ` · session ${user.username} (${user.role})` : ''}
        </p>
      </div>
    </div>
  )
}

/**
 * P1 ongoing-orders slot (P5: queue + status tabs + receipt-table expand).
 * Route /ops/orders — OpsShell, staff/manager/admin (RequireOps); P5 lands the
 * mockApi.getOrders queue (api/orders.js).
 */
export function OngoingOrdersPage() {
  return <OpsPlaceholder title="Ongoing Orders" subtitle="Placeholder — P5 lands the fulfillment console." />
}

/**
 * P1 /ops/orders/:id — same page, receipt detail for that order expanded.
 * Route /ops/orders/:id — staff/manager/admin; P5 lands the receipt-table
 * detail expand + advanceOrderStatus (api/orders.js) for this order.
 */
export function OngoingOrderDetailPage() {
  const { id } = useParams()
  return (
    <OpsPlaceholder
      title={`Ongoing Orders — ${id}`}
      subtitle="Placeholder — P5 lands the receipt-table detail expand for this order."
    />
  )
}

/**
 * P1 inventory-dashboard slot (P5: needs-attention banner + stock table).
 * Route /ops/inventory — OpsShell, staff/manager/admin (RequireOps); the slot
 * shows the staff read-only note (visibility gating, P5) via AuthContext.
 */
export function InventoryPage() {
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title="Inventory Dashboard"
      subtitle={
        role === 'staff'
          ? 'Read-only for staff (visibility gating, not disabled styling — P5).'
          : 'Placeholder — P5 lands the inventory dashboard.'
      }
    />
  )
}

/**
 * P1 per-product-dashboard list slot (P5: 330px list + pre-filled editor).
 * Route /ops/products — manager/admin (router.jsx's requireManagerOrAdmin
 * element); the slot shows the staff read-only note until P5 tightens the
 * guard (routePaths.js decision #8 note).
 */
export function ProductsPage() {
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title="Products"
      subtitle={
        role === 'staff'
          ? 'Read-only for staff — editing is manager/admin (P5 tightens the guard).'
          : 'Placeholder — P5 lands the per-product dashboard.'
      }
    />
  )
}

/**
 * P1 /ops/products/:id/edit — pre-filled editor (P5).
 * Route /ops/products/:id/edit — manager/admin (requireManagerOrAdmin); P5
 * lands the pre-filled editor + create/updateProduct (api/products.js).
 */
export function ProductEditPage() {
  const { id } = useParams()
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title={`Edit product — ${id}`}
      subtitle={
        role === 'staff'
          ? 'Read-only for staff — the editor is manager/admin (P5 tightens the guard).'
          : 'Placeholder — P5 lands the pre-filled editor.'
      }
    />
  )
}

/**
 * P1 review panel slot (P6: round-6 moderation model).
 * Route /ops/reviews — manager/admin (requireManagerOrAdmin); P6 lands the
 * per-product review panel + setReviewHidden / setSellerComment (api/reviews.js).
 */
export function ReviewsPage() {
  return (
    <OpsPlaceholder
      title="Review Panel"
      subtitle="Placeholder — P6 lands the per-product review panel (manager/admin)."
    />
  )
}

/**
 * P1 user-dashboard slot (P6/P5: admin only).
 * Route /ops/users — admin (router.jsx's requireAdmin element); P5 lands the
 * admin user console + setUserRole / setUserActive (api/users.js).
 */
export function UsersPage() {
  return (
    <OpsPlaceholder
      title="User Dashboard"
      subtitle="Placeholder — P5 lands the admin user console (role select, disable toggle, self-protection)."
    />
  )
}
