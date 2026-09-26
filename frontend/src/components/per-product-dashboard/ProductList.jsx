import { useMemo, useState } from 'react'

import { useDebounce } from '../../hooks/useDebounce.js'
import { CATEGORY_LABEL, formatIdr, stockBadgeLabel, stockStatus } from '../../utils/utils.js'

/**
 * The 330px product list (docs/per-product-dashboard "ProductList"):
 * id + name, the unified stock badge (In · 34 / Low · 5 / Out · 0 pills),
 * the debounced search filter, hover blueSlate-50, and the selected row
 * (3px atomicTangerine-500 left bar + atomicTangerine-100 bg). The
 * columns are read-only — editing happens in the form, not inline — and
 * the "New product" button is full-width primary. A freshly created
 * product's row flashes willowGreen-100 for 2s.
 * @param {{products: object[], loading: boolean, selectedId: string | null,
 *   createdId: string | null, onSelect: (id: string) => void,
 *   onNew?: () => void}} props  onNew = the "+ New product" control; when
 *   omitted (the staff read-only view) the button is NOT rendered —
 *   visibility gating, not disabled styling.
 * @returns {object} the list column.
 */
export function ProductList({ products, loading, selectedId, createdId, onSelect, onNew }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim().toLowerCase(), 300)

  const filtered = useMemo(() => {
    if (!debounced) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(debounced) ||
        p.id.toLowerCase().includes(debounced) ||
        p.category.toLowerCase().includes(debounced),
    )
  }, [products, debounced])

  return (
    <section
      aria-label="Product list"
      className="bg-canvas border border-blueSlate-200 rounded-xl flex flex-col overflow-hidden"
      style={{ width: '100%' }}
    >
      <div className="p-3 border-b border-blueSlate-200">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="h-11 w-full rounded-lg border border-blueSlate-200 bg-canvas px-4 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
        />
      </div>

      <ul className="flex-1 overflow-y-auto" style={{ maxHeight: '560px' }}>
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <li key={i} className="p-3">
                <div className="skeleton skeleton-line-sm" />
              </li>
            ))
          : filtered.map((p) => {
              const status = stockStatus(p)
              const isSelected = p.id === selectedId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3 min-h-[52px] flex flex-col gap-1 transition-colors ${
                      isSelected
                        ? 'bg-atomicTangerine-100'
                        : p.id === createdId
                          ? 'flash-row'
                          : 'hover:bg-blueSlate-50'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: 'inset 3px 0 0 var(--atomicTangerine-500)' }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-body font-medium text-ink truncate">{p.name}</span>
                      <span
                        className={`stock-pill shrink-0 ${
                          status === 'out'
                            ? 'stock-pill-out'
                            : status === 'low'
                              ? 'stock-pill-low'
                              : 'stock-pill-in'
                        }`}
                      >
                        {stockBadgeLabel(p)}
                      </span>
                    </span>
                    <span className="text-meta text-blueSlate-700">
                      {p.id} · {CATEGORY_LABEL[p.category] || p.category} · {formatIdr(p.price)}
                    </span>
                  </button>
                </li>
              )
            })}
      </ul>

      {filtered.length === 0 && !loading ? (
        <p className="p-4 text-meta text-blueSlate-700">No products match.</p>
      ) : null}

      {onNew ? (
        <div className="p-3 border-t border-blueSlate-200">
          <button type="button" className="btn-primary w-full" onClick={onNew}>
            + New product
          </button>
        </div>
      ) : null}
    </section>
  )
}
