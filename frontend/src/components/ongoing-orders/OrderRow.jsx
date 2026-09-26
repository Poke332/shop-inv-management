import { Link } from 'react-router'

import { formatIdr, ORDER_STATUS_CHIP, ORDER_STATUS_GLYPH } from '../../utils/utils.js'
import { StatusAdvanceButton } from './StatusAdvanceButton.jsx'

/**
 * One white order card (docs/ongoing-orders "OrderRow"): the collapsed
 * header row — order id (blueSlate-950 14/600), date + "N lines"
 * (13/400 blueSlate-700), total (atomicTangerine-600), the status chip
 * (color-tokens §3: chip + glyph, never color-only), and the "Details
 * ▾/▴" tangerine toggle — and, when expanded, the receipt-table detail:
 * itemized rows (Item / Unit price / Qty / Amount, numerics right-
 * aligned), the Subtotal / Shipping / Total rows (Total in tangerine;
 * shipping 0 renders "Free"), and the ship-to block below the table.
 * The StatusAdvanceButton sits on the header row; delivered orders
 * (terminal) render no button. Header rows flex-wrap at 390px.
 * @param {{order: object, displayStatus: string, expanded: boolean,
 *   flashing: boolean, onToggle: (id: string) => void,
 *   onOptimistic: (id: string, next: string) => void,
 *   onOk: (id: string) => void, onFail: (id: string) => void}} props
 *   displayStatus = the optimistic (or live) status shown in the chip —
 *   the page resolves it so the button + chip move forward together.
 * @returns {object} the order card.
 */
export function OrderRow({
  order,
  displayStatus,
  expanded,
  flashing,
  onToggle,
  onOptimistic,
  onOk,
  onFail,
}) {
  const chip = ORDER_STATUS_CHIP[displayStatus] || 'chip-pending'
  const glyph = ORDER_STATUS_GLYPH[displayStatus] || '●'
  const shippingLabel = order.shipping > 0 ? formatIdr(order.shipping) : 'Free'

  return (
    <article
      aria-label={`Order ${order.id}`}
      className={`bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-4 ${
        flashing ? 'flash-row' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to={`/ops/orders/${order.id}`}
          className="text-price font-semibold text-ink hover:text-atomicTangerine-600"
        >
          #{order.id}
        </Link>
        <span className="text-meta text-blueSlate-700">
          {order.createdAt} · {order.lines.length} lines
        </span>
        <span className="text-price font-semibold text-atomicTangerine-600">
          {formatIdr(order.total)}
        </span>
        <span className={`chip ${chip}`}>
          <span aria-hidden="true">{glyph}</span>
          {displayStatus}
        </span>
        <div className="ml-auto flex items-center gap-3 min-w-0">
          <StatusAdvanceButton
            order={{ ...order, status: displayStatus }}
            onOptimistic={onOptimistic}
            onOk={onOk}
            onFail={onFail}
          />
          <button
            type="button"
            onClick={() => onToggle(order.id)}
            aria-expanded={expanded}
            className="text-price font-medium text-atomicTangerine-600 hover:underline min-h-11"
          >
            Details {expanded ? '▴' : '▾'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div>
          <table className="ops-receipt">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="ops-receipt-num">Unit price</th>
                <th scope="col" className="ops-receipt-num">Qty</th>
                <th scope="col" className="ops-receipt-num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.productId}>
                  <td className="font-medium">{l.name}</td>
                  <td className="ops-receipt-num">{formatIdr(l.unitPrice)}</td>
                  <td className="ops-receipt-num">{l.qty}</td>
                  <td className="ops-receipt-num">{formatIdr(l.amount)}</td>
                </tr>
              ))}
              <tr className="ops-receipt-totals">
                <td>Subtotal</td>
                <td aria-hidden="true" />
                <td aria-hidden="true" />
                <td className="ops-receipt-num">{formatIdr(order.subtotal)}</td>
              </tr>
              <tr className="ops-receipt-totals">
                <td>Shipping</td>
                <td aria-hidden="true" />
                <td aria-hidden="true" />
                <td className="ops-receipt-num">{shippingLabel}</td>
              </tr>
              <tr className="ops-receipt-totals ops-receipt-total">
                <td>Total</td>
                <td aria-hidden="true" />
                <td aria-hidden="true" />
                <td className="ops-receipt-num">{formatIdr(order.total)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ops-receipt-ship">
            <span className="ops-receipt-ship-label">Ship to</span>
            {order.shippingAddress ? (
              <span className="ops-receipt-ship-address">
                {order.shippingAddress.address}, {order.shippingAddress.city}
              </span>
            ) : (
              <span className="ops-receipt-ship-address">—</span>
            )}
            <span className="ops-receipt-ship-buyer">
              Buyer: <span className="font-medium">{order.buyer || '—'}</span>
            </span>
          </div>
        </div>
      ) : null}
    </article>
  )
}
