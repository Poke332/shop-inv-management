import { useLocation } from 'react-router'

/**
 * The "route slot under construction" placeholder, kept as a shared
 * component so the stub pages (Cart / Checkout / Orders) that still ship as
 * placeholders can render it. The placeholder lives in the shared components
 * dir (one component per route file rule) — the stubs import it from here.
 *
 * `useLocation` echoes the live URL so role/redirect behaviour stays visible
 * while the owning page is still a placeholder.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a placeholder note).
 * @returns {object}
 */
export function StorefrontPlaceholder({ title, subtitle }) {
  const location = useLocation()
  return (
    <div className="page">
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding">
        <h1 className="text-h1 font-h1 text-ink">{title}</h1>
        <p className="text-body text-inkMuted mt-section-label-gap">
          {subtitle || 'Placeholder route slot — a real page replaces this placeholder.'}
        </p>
        <p className="text-meta text-blueSlate-700 mt-2" data-echo>
          URL: {location.pathname}
          {location.search}
        </p>
      </div>
    </div>
  )
}
