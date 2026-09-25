import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * Slot placeholder — the real cart page + CartStore wiring lands here.
 * Route /cart — buyer only (RequireBuyer); the live cart count already feeds
 * the StorefrontHeader badge via CartContext.
 */
export default function CartPage() {
  return (
    <StorefrontPlaceholder
      title="Cart"
      subtitle="Placeholder — the cart page lists the CartStore lines + quantities."
    />
  )
}
