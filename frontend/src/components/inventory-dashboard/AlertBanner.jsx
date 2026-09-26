import { FiAlertTriangle } from 'react-icons/fi'

import { Link } from 'react-router'

/**
 * The inventory "Needs attention" section (docs/inventory-dashboard
 * "AlertBanner"): carrotOrange-100 banner + carrotOrange-300 border,
 * the count in a carrotOrange-600 badge, and the low/out rows — out-of-
 * stock FIRST, then low, by stock asc (the getStockOverview order).
 * Clicking a row scrolls to + flashes its table row; manager/admin get
 * an "Open editor" deep link per row (staff: absent — visibility
 * gating). role="alert" announces the count.
 * @param {{items: {productId: string, name: string, category: string,
 *   price: number, stock: number, status: string}[], canEdit: boolean,
 *   onOpen: (productId: string) => void}} props
 * @returns {object|null} the banner (null when nothing needs attention).
 */
export function AlertBanner({ items, canEdit, onOpen }) {
  if (!items.length) return null
  return (
    <section className="alert-banner" role="alert" aria-label="Products that need attention">
      <div className="flex items-center gap-2">
        <FiAlertTriangle aria-hidden="true" />
        <span className="text-section font-semibold tracking-wide">Needs attention</span>
        <span className="alert-count" aria-label={`${items.length} products`}>
          {items.length}
        </span>
      </div>
      <div className="flex flex-col mt-3">
        {items.map((it) => (
          <div key={it.productId} className="alert-row">
            <button
              type="button"
              onClick={() => onOpen(it.productId)}
              className="text-left text-body font-medium text-ink hover:underline min-h-0"
            >
              {it.name}
            </button>
            <span className="text-meta text-blueSlate-700">{it.category}</span>
            <span
              className={`stock-pill ${it.status === 'out' ? 'stock-pill-out' : 'stock-pill-low'}`}
            >
              {it.status === 'out' ? 'Out of stock' : `Low · ${it.stock}`}
            </span>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-meta text-blueSlate-700">stock {it.stock}</span>
              {canEdit ? (
                <Link
                  to={`/ops/products/${it.productId}/edit`}
                  className="text-price font-medium text-atomicTangerine-600 hover:underline"
                >
                  Open editor
                </Link>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
