import { CATEGORY_LABEL, CATEGORY_TILE, formatIdr, stockBadgeLabel, stockStatus } from '../../utils/utils.js'
import { TileGlyph } from '../TileGlyph.jsx'

/**
 * The staff read-only product view (the /ops/products detail pane, staff
 * tier): the selected product's data only — image or gradient tile, the
 * name + id/brand/category meta line, the unified stock badge ("In · 34"
 * / "Low · 5" / "Out · 0") + the price (strike price when on sale), the
 * description, and the specs table. No controls: no form inputs, no save,
 * no spec add/remove, no "New product", no editor link — the manager/admin
 * ProductForm pane is simply not rendered for staff (visibility gating,
 * not disabled styling). Data shape = the mockApi Product record.
 * @param {{product: object | null, loading: boolean}} props  product null
 *   = loading skeleton.
 * @returns {object} the read-only detail card.
 */
export function ProductReadonly({ product, loading }) {
  if (loading || !product) {
    return (
      <section aria-label="Product details" className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-busy="true">
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
      </section>
    )
  }

  const status = stockStatus(product)
  const tileClass = CATEGORY_TILE[product.category] || 'tile-fallback'
  const hasImage = /^\/(products|img)\//.test(product.image || '')
  const specRows = (product.specs || []).filter((s) => s.key.trim() || s.value.trim())

  return (
    <section
      aria-label="Product details"
      className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-5"
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className={`shrink-0 rounded-lg overflow-hidden ${tileClass} flex items-center justify-center`}
          style={{ width: 96, height: 96 }}
        >
          {hasImage ? (
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <TileGlyph category={product.category} size={48} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-section font-semibold text-ink">{product.name}</h2>
          <p className="text-meta text-blueSlate-700">
            {product.id} · {product.brand || '—'} · {CATEGORY_LABEL[product.category] || product.category}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`stock-pill ${
                status === 'out' ? 'stock-pill-out' : status === 'low' ? 'stock-pill-low' : 'stock-pill-in'
              }`}
            >
              {stockBadgeLabel(product)}
            </span>
            <span className="text-meta text-blueSlate-700">
              {product.onSale && product.originalPrice ? (
                <>
                  <span className="line-through">{formatIdr(product.originalPrice)}</span> {formatIdr(product.price)}
                </>
              ) : (
                formatIdr(product.price)
              )}
            </span>
          </div>
        </div>
      </div>

      {product.description ? <p className="text-body text-blueSlate-900">{product.description}</p> : null}

      {specRows.length ? (
        <div>
          <h3 className="text-section font-semibold text-ink mb-2">Specs</h3>
          <table className="w-full border border-blueSlate-200 rounded-lg overflow-hidden">
            <tbody>
              {specRows.map((s, i) => (
                <tr key={i} className={i % 2 ? '' : 'bg-blueSlate-50'}>
                  <td className="px-3 py-2 text-meta text-blueSlate-700 w-1/3 align-top">{s.key}</td>
                  <td className="px-3 py-2 text-body text-ink">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
