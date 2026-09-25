import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FiCheck, FiPlus } from 'react-icons/fi'

import { mockApi } from '../data'
import { useCart } from '../contexts/CartContext.jsx'
import { CATEGORY_TILE, CATEGORY_LABEL, formatIdr, fireToast } from '../utils/utils.js'
import { TileGlyph } from './TileGlyph.jsx'

/**
 * The round-11 product card (docs/main-store "ProductGrid + ProductCard").
 * Tile = image asset when the product carries one (`image` field starting
 * with "/products/" / "/img/"), else the category-keyed gradient tile with
 * its glyph; out of stock dims the tile and flips both CTAs to disabled.
 * Single export (code-org rule: one component per file; helpers in utils).
 * @param {object} p  a product record (mockApi shape).
 * @param {function} [onBuy]  custom "Buy now" override (default = add qty 1 +
 *   navigate to /cart, per the CTA-target decision in the main-store doc).
 * @param {function} [onAdd]  custom "Add to cart" override (default = the
 *   optimistic in-place add below, with the ~600ms willowGreen check flash).
 * @returns {import('react').ReactElement}
 */
export function ProductCard({ p, onBuy, onAdd }) {
  const navigate = useNavigate()
  const { refresh } = useCart()
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(null)
  const [imgOk, setImgOk] = useState(true)

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  const oos = p.stock === 0
  const low = !oos && p.stock <= p.lowStockThreshold
  const tileClass = `${CATEGORY_TILE[p.category] || 'tile-fallback'}${oos ? ' tile-outstock' : ''}`
  const hasImage = /^\/(products|img)\//.test(p.image || '') && imgOk

  const doAdd = onAdd
    ? onAdd
    : async () => {
        setFlash(true)
        flashTimer.current = setTimeout(() => setFlash(false), 600)
        try {
          await mockApi.addToCart({ productId: p.id, qty: 1 })
          await refresh()
        } catch {
          fireToast({
            tone: 'error',
            text: "Couldn't add to cart — stock changed. Reload.",
          })
        }
      }

  const doBuy = onBuy
    ? onBuy
    : async () => {
        try {
          await mockApi.addToCart({ productId: p.id, qty: 1 })
        } catch {
          fireToast({
            tone: 'error',
            text: "Couldn't add to cart — stock changed. Reload.",
          })
          return
        }
        navigate('/cart')
      }

  return (
    <article className="card group">
      <div className={`tile ${tileClass}`}>
        {hasImage ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <TileGlyph category={p.category} />
        )}
        {p.onSale ? (
          <span className="badge badge-sale absolute top-2 left-2">On sale</span>
        ) : null}
        {p.featured ? (
          <span className="badge badge-featured absolute top-2 right-2">Featured</span>
        ) : null}
        {oos ? (
          <span className="badge badge-out absolute bottom-2 left-2">Out of stock</span>
        ) : null}
        {low ? (
          <span className="badge badge-lowstock absolute bottom-2 left-2">
            Only {p.stock} left
          </span>
        ) : null}
      </div>

      <Link
        to={`/products/${p.id}`}
        className="card-title text-card font-semibold text-ink"
        aria-label={p.name}
      >
        {p.name}
      </Link>

      <p className="text-meta text-blueSlate-700">
        {CATEGORY_LABEL[p.category] || p.category} · {p.brand}
      </p>

      <p>
        <span className="text-price font-semibold text-atomicTangerine-600">
          {formatIdr(p.price)}
        </span>
        {p.onSale && p.originalPrice ? (
          <span className="ml-2 text-meta font-normal text-blueSlate-600 line-through">
            {formatIdr(p.originalPrice)}
          </span>
        ) : null}
      </p>

      <div className="card-cta-row flex items-center gap-2">
        <button
          type="button"
          className="btn-primary flex-1 text-center"
          disabled={oos}
          aria-disabled={oos}
          aria-label={`Buy ${p.name} now`}
          onClick={doBuy}
        >
          Buy now
        </button>
        <button
          type="button"
          className={`btn-secondary flex-1 text-center ${flash ? 'bg-willowGreen-100' : ''}`}
          disabled={oos}
          aria-disabled={oos}
          aria-label={`Add ${p.name} to cart`}
          onClick={doAdd}
        >
          {flash ? <FiCheck className="mr-1 text-willowGreen-600" /> : <FiPlus className="mr-1" />}
          Add to cart
        </button>
      </div>
    </article>
  )
}
