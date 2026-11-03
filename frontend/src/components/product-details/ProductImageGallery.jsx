import { useState } from 'react'

import { CATEGORY_GRADIENT, IMAGE_SRC_RE } from '../../utils/utils.js'
import { TileGlyph } from '../TileGlyph.jsx'

/**
 * The product-details hero gallery. A product carries a single thumbnail
 * (`product.image`) and this app has no extra/detail images, so the gallery
 * is just that one image — no fabricated "angle" variants. The category
 * gradient is only a backdrop/fallback: it shows behind the image while it
 * loads and stands in (with the glyph) when the product has no image or it
 * fails to load. An 84×64 thumbnail strip appears only when a product ever
 * has more than one image to switch between. Out of stock dims the tile;
 * sale/featured badges ride on top. A swap is announced via aria-live. One
 * component per file (code-org rule).
 * @param {object} product  the product record.
 * @returns {object}
 */
export function ProductImageGallery({ product }) {
  const [selected, setSelected] = useState(0)
  const [imgBroken, setImgBroken] = useState(false)
  const stops = CATEGORY_GRADIENT[product.category] || ['var(--blueSlate-50)', 'var(--blueSlate-400)']
  const gradient = `linear-gradient(135deg, ${stops[0]}, ${stops[1]})`
  const oos = product.stock === 0

  // The real images this product has (today: just the thumbnail). Empty when
  // the product has no image -> the gradient tile + glyph stands in.
  const images = [product.image].filter((src) => src && IMAGE_SRC_RE.test(src))
  const active = images[selected]
  const showImage = Boolean(active) && !imgBroken

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-lg border border-blueSlate-200 ${oos ? 'opacity-40' : ''}`}
        style={{ aspectRatio: '4 / 3', background: gradient }}
      >
        {showImage ? (
          <img
            src={active}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <TileGlyph category={product.category} />
          </div>
        )}
        {product.onSale ? (
          <span className="badge badge-sale absolute top-2 left-2">On sale</span>
        ) : null}
        {product.featured ? (
          <span className="badge badge-featured absolute top-2 right-2">Featured</span>
        ) : null}
        {oos ? <span className="badge badge-out absolute bottom-2 left-2">Out of stock</span> : null}
        <span className="sr-only" aria-live="polite">
          {oos ? 'Out of stock. ' : ''}
          {showImage ? 'Product image.' : 'No product image; showing category tile.'}
        </span>
      </div>

      {/* thumbnail strip: only when there is more than one image to switch between */}
      {images.length > 1 ? (
        <div className="flex gap-2 mt-2" role="tablist" aria-label="Product images">
          {images.map((src, i) => {
            const activeThumb = selected === i
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={activeThumb}
                aria-label={`View image ${i + 1}`}
                onClick={() => setSelected(i)}
                className="overflow-hidden rounded-lg border transition-shadow"
                style={{
                  width: 84,
                  height: 64,
                  background: gradient,
                  borderColor: activeThumb ? 'var(--atomicTangerine-500)' : 'var(--blueSlate-200)',
                  boxShadow: activeThumb ? '0 0 0 2px var(--atomicTangerine-500)' : 'none',
                }}
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
