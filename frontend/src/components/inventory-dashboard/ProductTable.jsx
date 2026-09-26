import { useState } from 'react'

import { Link } from 'react-router'

import { StockStepper } from './StockStepper.jsx'
import { CATEGORY_LABEL, formatIdr, STOCK_PILL_CLASS, STOCK_PILL_LABEL, stockStatus } from '../../utils/utils.js'

/**
 * The inventory full product table (docs/inventory-dashboard
 * "ProductTable"): all 48 products in catalog order — name, category,
 * price, current stock, the status pill (in / low / out — text label
 * always present, never color-only), zebra rows + 1px blueSlate-200
 * borders, the in-table debounced search (name/category), and the right-
 * aligned row actions: the inline StockStepper + the "Open editor" link
 * to /ops/products/:id/edit (manager/admin ONLY — staff render the table
 * read-only, the actions are not rendered at all). A successful set
 * flashes the row willowGreen-100 ~1s; a failure marks the row for the
 * inline "Save failed — retry". Mobile <768px: the table collapses to a
 * card list (one product per card, stepper inside).
 * @param {{products: object[], loading: boolean, canEdit: boolean,
 *   onSetStock: (id: string, qty: number) => Promise<void>,
 *   flashRow: string | null, search: string, onSearch: (text: string) => void,
 *   totalNote: string}} props
 * @returns {object} the table (or its mobile card variant).
 */
export function ProductTable({
  products,
  loading,
  canEdit,
  onSetStock,
  flashRow,
  search,
  onSearch,
  totalNote,
}) {
  const [failed, setFailed] = useState(() => new Map()) // id -> attempted qty

  const commit = async (id, qty) => {
    try {
      await onSetStock(id, qty)
      setFailed((m) => {
        const next = new Map(m)
        next.delete(id)
        return next
      })
    } catch {
      setFailed((m) => new Map(m).set(id, qty))
    }
  }

  const retry = (id) => {
    const qty = failed.get(id)
    if (qty != null) commit(id, qty)
  }

  if (loading) {
    return (
      <div className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-blueSlate-200 last:border-0">
            <div className="skeleton skeleton-line-sm flex-1" />
            <div className="skeleton skeleton-line-sm w-24" />
            <div className="skeleton skeleton-line-sm w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="state-empty bg-canvas border border-blueSlate-200 rounded-xl">
        <h2>No products match</h2>
        <p>Try a different name or category.</p>
      </div>
    )
  }

  const rowFlash = (id) => (flashRow === id ? 'flash-row' : '')

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-section font-semibold tracking-wide text-ink">All products</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name / category…"
          aria-label="Search products"
          className="h-11 w-full sm:w-[280px] rounded-lg border border-blueSlate-200 bg-canvas px-4 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 sm:ml-auto"
        />
      </div>

      {/* desktop table (≥768px); mobile card list below */}
      <div className="hidden md:block mt-4 overflow-hidden rounded-xl border border-blueSlate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blueSlate-50">
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Product</th>
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Category</th>
              <th scope="col" className="text-right text-badge font-semibold text-blueSlate-700 px-4 py-3">Price</th>
              {canEdit ? <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Set stock</th> : null}
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Status</th>
              {canEdit ? <th scope="col" className="text-right text-badge font-semibold text-blueSlate-700 px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const status = stockStatus(p)
              return (
                <tr
                  key={p.id}
                  id={`inv-row-${p.id}`}
                  className={`border-b border-blueSlate-200 last:border-0 ${rowFlash(p.id)} ${i % 2 ? 'bg-blueSlate-50' : 'bg-canvas'}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-body font-medium text-ink">{p.name}</span>
                    <span className="block text-meta text-blueSlate-700">{p.id}</span>
                  </td>
                  <td className="px-4 py-3 text-body text-blueSlate-900">{CATEGORY_LABEL[p.category] || p.category}</td>
                  <td className="px-4 py-3 text-right text-body text-blueSlate-900">{formatIdr(p.price)}</td>
                  {canEdit ? (
                    <td className="px-4 py-3">
                      <StockStepper
                        value={p.stock}
                        id={p.id}
                        onCommit={commit}
                        failed={failed.has(p.id)}
                        onRetry={retry}
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <span className={`stock-pill ${STOCK_PILL_CLASS[status]}`}>
                      {STOCK_PILL_LABEL[status]}
                    </span>
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/ops/products/${p.id}/edit`}
                        className="text-price font-medium text-atomicTangerine-600 hover:underline inline-block"
                      >
                        Open editor
                      </Link>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* mobile (<768px): one product per card, stepper inside */}
      <ul className="md:hidden mt-4 flex flex-col gap-3">
        {products.map((p) => {
          const status = stockStatus(p)
          return (
            <li
              key={p.id}
              data-inv-row={p.id}
              className={`bg-canvas border border-blueSlate-200 rounded-xl p-4 flex flex-col gap-2 ${rowFlash(p.id)}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body font-medium text-ink">{p.name}</span>
                <span className={`stock-pill ${STOCK_PILL_CLASS[status]}`}>{STOCK_PILL_LABEL[status]}</span>
              </div>
              <p className="text-meta text-blueSlate-700">
                {p.id} · {CATEGORY_LABEL[p.category] || p.category} · {formatIdr(p.price)} · stock {p.stock}
              </p>
              {canEdit ? (
                <div className="flex items-end gap-3 flex-wrap">
                  <StockStepper value={p.stock} id={p.id} onCommit={commit} failed={failed.has(p.id)} onRetry={retry} />
                  <Link to={`/ops/products/${p.id}/edit`} className="text-price font-medium text-atomicTangerine-600 hover:underline">
                    Open editor
                  </Link>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {totalNote ? <p className="text-meta text-blueSlate-700 mt-3">{totalNote}</p> : null}
    </div>
  )
}
