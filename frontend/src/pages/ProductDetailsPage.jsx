import { useLocation, useParams } from 'react-router'

import { StorefrontPlaceholder } from './HomePage.jsx'

/**
 * P1 slot placeholder. P3 fills this with the real product-details page
 * (docs/product-details: gallery, specs table, quantity stepper, Add to Cart,
 * ReviewList with hidden states + seller-comment block). All 4 roles resolve
 * here; staff+ get the variant-B read-only treatment once P3 lands.
 */
export default function ProductDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  return (
    <StorefrontPlaceholder
      title={`Product — ${id}`}
      subtitle={location.state?.roleNote ? location.state.roleNote : 'Placeholder — P3 lands the real page.'}
    />
  )
}
