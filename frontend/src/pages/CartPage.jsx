import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * P1 slot placeholder — P4 lands the real cart page + CartStore wiring.
 * Route /cart — buyer only (RequireBuyer); the live cart count already feeds
 * the StorefrontHeader badge via CartContext.
 */
export default function CartPage() {
  return (
    <StorefrontPlaceholder
      title="Cart"
      subtitle="Placeholder — P4 lands the cart page + CartStore lines/quantities."
    />
  )
}
