import { useLocation, useParams } from 'react-router'

import { useAuth } from '../hooks/useAuth.js'

/**
 * Ops route-slot placeholder. The real pages (ongoing-orders,
 * inventory-dashboard, per-product-dashboard, review panel, user-dashboard —
 * see each docs/<page>/IMPLEMENTATION.md) fill these slots. The slot renders
 * inside the OpsShell's .ops-content gutter, so the gutter is live on every
 * ops route now. It echoes the live URL + the signed-in session (AuthContext)
 * so the RBAC redirects stay visible while the real pages are placeholders.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a placeholder note).
 */
export function OpsPlaceholder({ title, subtitle }) {
  const location = useLocation()
  const user = useAuth().user
  return (
    <div className="ops-page">
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding max-w-content">
        <h1 className="text-h1 font-h1 text-ink">{title}</h1>
        <p className="text-body text-inkMuted mt-section-label-gap">
          {subtitle || 'Placeholder route slot — a real page replaces this placeholder.'}
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
 * Ongoing-orders slot: queue + status tabs + receipt-table expand.
 * Route /ops/orders — OpsShell, staff/manager/admin (RequireOps); the
 * mockApi.getOrders queue (api/orders.js) lands here.
 */
export function OngoingOrdersPage() {
  return <OpsPlaceholder title="Ongoing Orders" subtitle="Placeholder — the fulfillment console lands here." />
}

/**
 * /ops/orders/:id — same page, receipt detail for that order expanded.
 * Route /ops/orders/:id — staff/manager/admin; the receipt-table detail
 * expand + advanceOrderStatus (api/orders.js) lands here for this order.
 */
export function OngoingOrderDetailPage() {
  const { id } = useParams()
  return (
    <OpsPlaceholder
      title={`Ongoing Orders — ${id}`}
      subtitle="Placeholder — the receipt-table detail expand lands for this order."
    />
  )
}

/**
 * Inventory-dashboard slot: needs-attention banner + stock table.
 * Route /ops/inventory — OpsShell, staff/manager/admin (RequireOps); the slot
 * shows the staff read-only note (visibility gating) via AuthContext.
 */
export function InventoryPage() {
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title="Inventory Dashboard"
      subtitle={
        role === 'staff'
          ? 'Read-only for staff (visibility gating, not disabled styling).'
          : 'Placeholder — the inventory dashboard lands here.'
      }
    />
  )
}

/**
 * Per-product-dashboard list slot: 330px list + pre-filled editor.
 * Route /ops/products — manager/admin (router.jsx's requireManagerOrAdmin
 * element); the slot shows the staff read-only note until the guard
 * tightens (routePaths.js decision #8 note).
 */
export function ProductsPage() {
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title="Products"
      subtitle={
        role === 'staff'
          ? 'Read-only for staff — editing is manager/admin (the guard tightens for this route).'
          : 'Placeholder — the per-product dashboard lands here.'
      }
    />
  )
}

/**
 * /ops/products/:id/edit — pre-filled editor.
 * Route /ops/products/:id/edit — manager/admin (requireManagerOrAdmin); the
 * pre-filled editor + create/updateProduct (api/products.js) lands here.
 */
export function ProductEditPage() {
  const { id } = useParams()
  const role = useAuth().user?.role
  return (
    <OpsPlaceholder
      title={`Edit product — ${id}`}
      subtitle={
        role === 'staff'
          ? 'Read-only for staff — the editor is manager/admin (the guard tightens for this route).'
          : 'Placeholder — the pre-filled editor lands here.'
      }
    />
  )
}

/**
 * Review panel slot (moderation model).
 * Route /ops/reviews — manager/admin (requireManagerOrAdmin); the
 * per-product review panel + setReviewHidden / setSellerComment (api/reviews.js)
 * lands here.
 */
export function ReviewsPage() {
  return (
    <OpsPlaceholder
      title="Review Panel"
      subtitle="Placeholder — the per-product review panel lands here (manager/admin)."
    />
  )
}

/**
 * User-dashboard slot (admin only).
 * Route /ops/users — admin (router.jsx's requireAdmin element); the admin
 * user console + setUserRole / setUserActive (api/users.js) lands here.
 */
export function UsersPage() {
  return (
    <OpsPlaceholder
      title="User Dashboard"
      subtitle="Placeholder — the admin user console lands here (role select, disable toggle, self-protection)."
    />
  )
}
