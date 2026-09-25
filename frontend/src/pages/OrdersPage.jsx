import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * P1 slot placeholder — P3/P4 land the real Orders Placed list.
 * Route /orders — buyer only (RequireBuyer); the buyer's order history comes
 * from mockApi.getMyOrders (api/orders.js).
 */
export default function OrdersPage() {
  return (
    <StorefrontPlaceholder
      title="Orders Placed"
      subtitle="Placeholder — the buyer's order list lands with the checkout flow (P4)."
    />
  )
}
