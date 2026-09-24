import { useLocation } from 'react-router'

import { StorefrontPlaceholder } from './HomePage.jsx'

/**
 * P1 slot placeholder. P3 fills this with the real pages (docs/search-browse:
 * FilterRail + URL param state + result grid). The placeholder keeps the P1
 * tree fully navigable now. Route /search — buyer only (RequireBuyer); the
 * ?query=/?category= URL params echo into the slot subtitle.
 */
export default function SearchPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const query = params.get('query')
  const category = params.get('category')
  const bits = [query ? `query="${query}"` : null, category ? `category="${category}"` : null]
  return (
    <StorefrontPlaceholder
      title="Search / Browse"
      subtitle={bits.length ? `URL params received: ${bits.join(' + ')}` : 'Placeholder — no filters yet (P3: FilterRail + URL state).'}
    />
  )
}
