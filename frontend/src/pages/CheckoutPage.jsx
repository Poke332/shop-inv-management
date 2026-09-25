import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * Slot placeholder — the 3-step checkout wizard + receipt view lands here.
 * Route /checkout — buyer only (RequireBuyer).
 */
export default function CheckoutPage() {
  return (
    <StorefrontPlaceholder
      title="Checkout"
      subtitle="Placeholder — the 4-state checkout wizard (Personal info → Shipping → Payment → Receipt)."
    />
  )
}
