import { useState } from 'react'

import { CATEGORY_GRADIENT } from '../utils/utils.js'
import { TileGlyph } from './TileGlyph.jsx'

/**
 * The product-details hero gallery (docs/product-details "ProductImageGallery"):
 * a 4:3 category-keyed gradient hero tile with the category glyph + sale /
 * featured badges, and the 84×64 thumbnail row. When the hero is a CSS
 * gradient tile (the decided v1 treatment — no asset swap), each thumbnail is
 * a variant of the SAME category gradient (per-index angle shift on the same
 * two-stop family). Selecting a thumb re-angles the hero tile; the active
 * thumb carries the 2px atomicTangerine-500 ring. P-231 renders 3 thumbs.
 * A swap is announced via aria-live. One component per file (code-org rule).
 * @param {object} product  the product record.
 * @returns {object}
 */
export function ProductImageGallery({ product }) {
  const [selected, setSelected] = useState(0)
  const stops = CATEGORY_GRADIENT[product.category] || ['var(--blueSlate-50)', 'var(--blueSlate-400)']
  // per-index angle variants on the same two-stop family (135/180/90 …)
  const angles = [135, 180, 90, 120]
  const thumbCount = 3
  const gradient = (deg) => `linear-gradient(${deg}deg, ${stops[0]}, ${stops[1]})`
  const oos = product.stock === 0

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-lg border border-blueSlate-200 ${oos ? 'opacity-40' : ''}`}
        style={{ aspectRatio: '4 / 3', background: gradient(angles[selected]) }}
      >
        <div className="absolute inset-0 grid place-items-center">
          <TileGlyph category={product.category} />
        </div>
        {product.onSale ? (
          <span className="badge badge-sale absolute top-2 left-2">On sale</span>
        ) : null}
        {product.featured ? (
          <span className="badge badge-featured absolute top-2 right-2">Featured</span>
        ) : null}
        {oos ? <span className="badge badge-out absolute bottom-2 left-2">Out of stock</span> : null}
        <span className="sr-only" aria-live="polite">
          {oos ? 'Out of stock. ' : ''}
          Image angle {angles[selected]} degrees.
        </span>
      </div>

      {/* thumbnail row: 84×64 gradient variants, active = 2px atomicTangerine-500 ring */}
      <div className="flex gap-2 mt-2" role="tablist" aria-label="Product image angles">
        {Array.from({ length: thumbCount }, (_, i) => {
          const active = selected === i
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`View angle ${angles[i]} degrees`}
              onClick={() => setSelected(i)}
              className="overflow-hidden rounded-lg border transition-shadow"
              style={{
                width: 84,
                height: 64,
                background: gradient(angles[i]),
                borderColor: active ? 'var(--atomicTangerine-500)' : 'var(--blueSlate-200)',
                boxShadow: active ? '0 0 0 2px var(--atomicTangerine-500)' : 'none',
              }}
            >
              <span className="grid place-items-center w-full h-full text-blueSlate-900">
                <TileGlyph category={product.category} size={32} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
