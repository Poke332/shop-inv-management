import { Link } from 'react-router'

import { formatIdr, ORDER_STATUS_CHIP, ORDER_STATUS_GLYPH } from '../utils/utils.js'
import { SquareTile } from './SquareTile.jsx'
import { StatusTimeline } from './StatusTimeline.jsx'
import { ReviewForm } from './ReviewForm.jsx'

/**
 * One order card (docs/orders-placed "OrderCard"): the collapsed header
 * row (order id 14/600 ink + date 13/400 + status chip + the "Details
 * ▾/▴" tangerine toggle), and — when expanded — the StatusTimeline, the
 * line summary (40px gradient thumbs + "name ×qty" + line price + Total),
 * and — for a delivered order — a ReviewForm per purchased, not-yet-rated
 * product. The buyer is read-only: the only affordance is the expand
 * toggle + the rating block. Links the line names to /products/:id.
 * @param {{order: object, expanded: boolean, onToggle: () => void,
 *   productById: Map<string, object>}} props
 * @returns {object} the card.
 */
export function OrderCard({ order, expanded, onToggle, productById }) {
  const chip = ORDER_STATUS_CHIP[order.status] || 'chip-pending'
  const glyph = ORDER_STATUS_GLYPH[order.status] || '●'
  const unratedLines =
    order.status === 'delivered'
      ? order.lines.filter((l) => !order.reviewed.includes(l.productId))
      : []

  const lineThumb = (line) => {
    const p = productById.get(line.productId)
    return p ? p.category : null
  }

  return (
    <article
      aria-label={`Order ${order.id}`}
      className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding"
    >
      {/* collapsed header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-price font-semibold text-ink">#{order.id}</span>
        <span className="text-meta text-blueSlate-700">{order.createdAt}</span>
        <span className={`chip ${chip}`}>
          <span aria-hidden="true">{glyph}</span>
          {order.status}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="ml-auto text-price font-medium text-atomicTangerine-600 hover:underline min-h-11"
        >
          Details {expanded ? '▴' : '▾'}
        </button>
      </div>

      {expanded ? (
        <div className="mt-5 flex flex-col gap-5">
          <StatusTimeline status={order.status} orderId={order.id} />

          <ul className="flex flex-col gap-3">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3 min-w-0">
                <SquareTile category={lineThumb(line)} size={40} />
                <Link
                  to={`/products/${line.productId}`}
                  className="flex-1 min-w-0 text-body font-medium text-ink truncate hover:underline"
                >
                  {line.name} ×{line.qty}
                </Link>
                <span className="text-price font-semibold text-atomicTangerine-600 shrink-0">
                  {formatIdr(line.amount)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <span className="text-body text-blueSlate-700">Total</span>
            <span className="text-price font-semibold text-ink">{formatIdr(order.total)}</span>
          </div>

          {unratedLines.map((line) => (
            <ReviewForm key={line.productId} order={order} line={line} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
