import { Link } from 'react-router'

import { formatIdr } from '../utils/utils.js'

/**
 * The receipt confirmation view (docs/checkout "Receipt", step 4): the
 * success check (26px willowGreen-500 circle + white tick), the
 * "Order placed · Order #WB-…" line with the order number + the pending
 * chip, the line-item table (item / qty / amount header on blueSlate-50
 * + body rows + the "Total (to be settled)" row + the payment-method
 * summary line), the delivery-estimate meta, and the "View my orders"
 * CTA -> /orders. No "Place order" CTA on this view (the order is placed).
 * @param {{order: object, paymentLine: string, estimate: string,
 *   onEditCart?: () => void}} props
 * @returns {object} the receipt card.
 */
export function Receipt({ order, paymentLine, estimate, onEditCart }) {
  const amount = (n) => formatIdr(n)
  return (
    <section className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-label="Order receipt">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-[26px] h-[26px] rounded-full bg-willowGreen-500 grid place-items-center shrink-0" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L19 7" />
          </svg>
        </span>
        <div className="flex-1 min-w-0 text-section text-ink font-semibold">
          Order placed
          <span className="text-body font-normal text-blueSlate-700">
            {' '}· Order <span className="font-semibold text-ink">{`#${order.id}`}</span>
          </span>
        </div>
        <span className="chip chip-pending" role="status">{order.status}</span>
      </div>

      <div className="border border-blueSlate-200 rounded-lg overflow-hidden mt-4">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface text-meta font-semibold text-blueSlate-700 border-b border-blueSlate-200">
          <span className="flex-1 min-w-0">Item</span>
          <span className="w-10 text-center">Qty</span>
          <span className="w-24 text-right">Amount</span>
        </div>
        {order.lines.map((l) => (
          <div key={l.productId} className="flex items-center gap-3 px-4 py-2.5 bg-canvas border-b border-blueSlate-200">
            <span className="flex-1 min-w-0 text-body font-medium text-ink truncate">{l.name}</span>
            <span className="w-10 text-center text-body text-blueSlate-700">{l.qty}</span>
            <span className="w-24 text-right text-price font-semibold text-atomicTangerine-600">{amount(l.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface border-t border-blueSlate-200 text-body text-blueSlate-700 font-semibold">
          <span>Total (to be settled)</span>
          <span className="text-[20px] leading-7 font-semibold text-ink">{amount(order.total)}</span>
        </div>
      </div>

      <p className="text-body text-blueSlate-950 font-medium mt-4">{paymentLine}</p>

      {estimate ? (
        <p className="text-meta text-blueSlate-700 mt-3">
          Ships from Sunset Electronics — estimated delivery {estimate}. Payment settles after the order is confirmed.
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 mt-6 flex-wrap">
        {onEditCart ? (
          <button type="button" onClick={onEditCart} className="btn-secondary">
            Edit cart
          </button>
        ) : null}
        <Link to="/orders" state={{ justPlaced: order.id }} className="btn-primary">
          View my orders
        </Link>
      </div>
    </section>
  )
}
