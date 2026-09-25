import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * Slot placeholder — the real Orders Placed list lands here.
 * Route /orders — buyer only (RequireBuyer); the buyer's order history comes
 * from mockApi.getMyOrders (api/orders.js).
 */
export default function OrdersPage() {
  return (
    <StorefrontPlaceholder
      title="Orders Placed"
      subtitle="Placeholder — the buyer's order list lands with the checkout flow."
    />
  )
}
