import { Link } from 'react-router'

import { formatIdr } from '../../utils/utils.js'
import { SquareTile } from '../SquareTile.jsx'
import { PlaceOrderButton } from './PlaceOrderButton.jsx'

/**
 * The persistent "Order review" panel of the checkout page
 * (docs/checkout "OrderReview"): a 340px blueSlate-50 card on the right
 * of every wizard step (hidden <768px — the mobile layout drops the panel
 * and takes over with the fixed bottom CTA bar on step 3). It lists the
 * live cart lines (44px thumbs + "Name ×qty" + line price), the Subtotal
 * + "Total (to be settled)*" (20/28 w600 value, the "*payment TBD —
 * order stays pending until settled" hint), the "Edit cart" secondary
 * button, and — on step 3 only — the "Place order" CTA.
 *
 * On the step-3 submit it also shows the 3a stock-conflict outcome
 * (NO state change): the conflicting lines get the strawberryRed-100
 * tint + border + the "Only N left" / "Out of stock" assertive note, and
 * the CTA label flips to "Update quantities & retry". At the receipt
 * view (step 4) the cart has cleared, so the panel renders the
 * just-placed preview lines + total (the mockup keeps it populated).
 * @param {{lines: object[], subtotal: number, step: number,
 *   preview?: {lines: object[], total: number},
 *   conflicts?: {productId: string, available: number}[],
 *   onPlace: () => void, placing: boolean, placeDisabled: boolean,
 *   placeLabel?: string, editDisabled?: boolean}} props
 * @returns {object} the panel.
 */
export function OrderReview({
  lines,
  subtotal,
  step,
  preview,
  conflicts,
  onPlace,
  placing,
  placeDisabled,
  placeLabel,
  editDisabled = false,
}) {
  const receipt = step === 4 && preview
  const rowList = receipt ? preview.lines : lines
  const rowSubtotal = receipt ? preview.total : subtotal
  const showCta = step === 3
  const conflictFor = (productId) =>
    conflicts?.find((c) => c.productId === productId) || null

  return (
    <aside
      aria-label="Order review"
      className="hidden md:flex w-[340px] flex-none flex-col bg-surface border border-blueSlate-200 rounded-xl p-card-padding self-start"
    >
      <h2 className="text-section text-ink font-semibold mb-4">Order review</h2>

      <ul className="flex flex-col">
        {rowList.map((l) => {
          const conflict = receipt ? null : conflictFor(l.productId)
          return (
            <li
              key={l.key || l.lineId || l.productId}
              className={`flex flex-col gap-1 py-2 border-b border-blueSlate-200 last:border-b-0 ${
                conflict ? 'line-conflict' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <SquareTile category={l.category} size={44} />
                <span className="flex-1 min-w-0 text-body font-medium text-ink truncate">
                  {l.name} ×{l.qty}
                </span>
                <span className="text-price font-semibold text-atomicTangerine-600 shrink-0">
                  {formatIdr(l.amount != null ? l.amount : l.price * l.qty)}
                </span>
              </div>
              {conflict ? (
                <span
                  className="text-meta text-strawberryRed-600"
                  role="alert"
                  aria-live="assertive"
                >
                  {conflict.available === 0
                    ? 'Out of stock'
                    : `Only ${conflict.available} left — reduce the quantity`}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 py-3 text-body text-blueSlate-700">
        <span>Subtotal</span>
        <span className="font-semibold text-ink">{formatIdr(rowSubtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-body text-blueSlate-700">Total (to be settled)*</span>
        <span className="text-[20px] leading-7 font-semibold text-ink">{formatIdr(rowSubtotal)}</span>
      </div>
      <p className="text-meta text-blueSlate-700 mt-2">
        *payment TBD — order stays pending until settled
      </p>

      <div className="text-center mt-4">
        <Link to="/cart" className="btn-secondary w-full" aria-disabled={editDisabled}>
          Edit cart
        </Link>
      </div>

      {showCta ? (
        <div className="mt-4">
          <PlaceOrderButton
            onClick={onPlace}
            placing={placing}
            disabled={placeDisabled}
            label={placeLabel}
            full
          />
        </div>
      ) : null}
    </aside>
  )
}
