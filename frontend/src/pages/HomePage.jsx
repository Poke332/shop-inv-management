import { useLocation } from 'react-router'

/**
 * P1 storefront route-slot placeholder. P3 fills these with the real pages
 * (docs/main-store, search-browse, product-details …). The placeholder keeps
 * the P1 tree fully navigable + the guards testable now.
 *
 * `useLocation` echoes the live URL so role/redirect behaviour is visible
 * while the real pages are still placeholders.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a P3–P6 note).
 */
export function StorefrontPlaceholder({ title, subtitle }) {
  const location = useLocation()
  return (
    <div className="page">
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding">
        <h1 className="text-h1 font-h1 text-ink">{title}</h1>
        <p className="text-body text-inkMuted mt-section-label-gap">
          {subtitle || 'Placeholder route slot — the real page lands in P3–P6.'}
        </p>
        <p className="text-meta text-blueSlate-700 mt-2" data-echo>
          URL: {location.pathname}{location.search}
        </p>
      </div>
    </div>
  )
}

/**
 * P1 main-store slot (P3 fills: hero, 3x2 category grid, 8-item product grid).
 * Route / — StorefrontLayout, buyer only (RequireBuyer; staff+ -> their ops home).
 */
export default function HomePage() {
  return <StorefrontPlaceholder title="Main Store" />
}
