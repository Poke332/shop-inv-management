/**
 * The step-3-only "Place order" CTA (docs/checkout "PlaceOrderButton"):
 * filled 44px tangerine stack; loading keeps the -600 fill + spinner +
 * "Placing order…" (aria-busy); disabled = blueSlate-100 / blueSlate-400.
 * Rendered on desktop inside the payment card + the order-review panel,
 * and on mobile (<768px) in the fixed bottom CTA bar. One component per
 * file (code-org rule).
 * @param {{onClick: () => void, placing: boolean, disabled: boolean,
 *   label?: string, className?: string, full?: boolean}} props
 * @returns {object} the CTA button.
 */
export function PlaceOrderButton({ onClick, placing, disabled, label = 'Place order', className = '', full = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || placing}
      aria-busy={placing}
      className={`btn-primary ${full ? 'w-full' : ''} ${className}`.trim()}
    >
      {placing ? (
        <span className="inline-flex items-center gap-2">
          <span className="spinner" aria-hidden="true" />
          Placing order…
        </span>
      ) : (
        label
      )}
    </button>
  )
}
