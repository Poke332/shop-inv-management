import { FiTrash2 } from 'react-icons/fi'

import { QuantityStepper } from '../QuantityStepper.jsx'
import { SquareTile } from '../SquareTile.jsx'
import { formatIdr, isLowStock } from '../../utils/utils.js'

/**
 * One cart line row (docs/cart "CartLine"): 84px category tile + name
 * (15/24 w600 ink) + muted unit price + "Model · Category · Brand" subline;
 * below, the quantity stepper (stock-clamped) + line total (tangerine) +
 * 44px trash button (blueSlate-500 -> strawberryRed-600 hover, with the
 * aria-label). A low-stock line shows the "Low · N left" hint; a server
 * clamp shows the "Only N available — quantity reduced" note; a failed
 * qty / remove op shows a per-line retry link. Presentational — the parent
 * (CartPage) owns the store ops + this line's transient UI state.
 * @param {object} line  an enriched cart line (productId, name, subline,
 *   category, price, stock, qty, lineId).
 * @param {(qty: number) => void} onQtyChange
 * @param {() => void} onRemove
 * @param {boolean} removing  this line is mid exit-animation.
 * @param {boolean} failed  the last qty / remove op for this line failed.
 * @param {() => void} onRetry
 * @param {string|null} clampedNote  "Only N available — quantity reduced".
 * @returns {object} the row (a list item exposing name + total).
 */
export function CartLine({ line, onQtyChange, onRemove, removing, failed, onRetry, clampedNote }) {
  const low = isLowStock(line)
  const oos = line.stock === 0
  return (
    <li
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 ${removing ? 'cart-line-exit' : ''}`}
      aria-label={`${line.name} — ${formatIdr(line.price * line.qty)}`}
    >
      <SquareTile category={line.category} size={84} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-card font-semibold text-ink">{line.name}</span>
          <span className="text-meta font-normal text-blueSlate-700">— {formatIdr(line.price)}</span>
        </div>
        {line.subline ? <div className="text-meta text-blueSlate-700 mt-0.5">{line.subline}</div> : null}
        {oos ? (
          <div className="text-meta text-strawberryRed-600 mt-1">Out of stock</div>
        ) : low ? (
          <div className="text-meta text-carrotOrange-600 mt-1">Low · {line.stock} left</div>
        ) : null}
        {clampedNote ? <div className="text-meta text-strawberryRed-600 mt-1">{clampedNote}</div> : null}

        <div className="flex items-center gap-3 flex-wrap mt-3">
          <QuantityStepper
            value={line.qty}
            min={1}
            max={Math.max(line.stock, 1)}
            onChange={onQtyChange}
            labelFor={line.name}
          />
          <span className="text-price font-semibold text-atomicTangerine-600">
            {formatIdr(line.price * line.qty)}
          </span>
          <button
            type="button"
            aria-label={`Remove ${line.name} from cart`}
            onClick={onRemove}
            disabled={removing || failed}
            className="w-11 h-11 grid place-items-center rounded-lg text-blueSlate-500 hover:text-strawberryRed-600 focus-visible:outline-2 focus-visible:outline-atomicTangerine-500 focus-visible:outline-offset-2"
          >
            <FiTrash2 size={20} />
          </button>
          {failed ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-meta font-medium text-strawberryRed-600 hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
