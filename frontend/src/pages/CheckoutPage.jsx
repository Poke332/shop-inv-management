import { StorefrontPlaceholder } from '../components/StorefrontPlaceholder.jsx'

/**
 * P1 slot placeholder — P4 lands the 3-step checkout wizard + receipt view.
 * Route /checkout — buyer only (RequireBuyer).
 */
export default function CheckoutPage() {
  return (
    <StorefrontPlaceholder
      title="Checkout"
      subtitle="Placeholder — P4 lands the 4-state checkout wizard (Personal info → Shipping → Payment → Receipt)."
    />
  )
}
