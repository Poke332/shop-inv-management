import { useLocation } from 'react-router'

/**
 * The P1 "route slot under construction" placeholder, kept as a shared
 * component so the P4/P6 pages (Cart / Checkout / Orders) that still ship
 * as stubs can render it. P3 replaced the main-store / search / details /
 * auth slots with real pages, so the placeholder moved out of pages/ (one
 * component per route file) into the shared components dir — the stubs
 * import it from here.
 *
 * `useLocation` echoes the live URL so role/redirect behaviour stays visible
 * while the owning page is still a placeholder.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a P3–P6 note).
 * @returns {import('react').ReactElement}
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
          URL: {location.pathname}
          {location.search}
        </p>
      </div>
    </div>
  )
}
