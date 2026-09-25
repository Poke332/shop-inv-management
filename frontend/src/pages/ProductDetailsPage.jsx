import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router'

import { mockApi } from '../data'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import { discountPercent, formatIdr, fireToast } from '../utils/utils.js'
import { ProductImageGallery } from '../components/ProductImageGallery.jsx'
import { SpecsTable } from '../components/SpecsTable.jsx'
import { ReviewList } from '../components/ReviewList.jsx'
import { StarRating } from '../components/StarRating.jsx'
import { QuantityStepper } from '../components/QuantityStepper.jsx'

/**
 * P3 product-details page (docs/product-details/IMPLEMENTATION.md): the one
 * storefront route open to all 4 roles. Buyer variant = full purchase
 * affordances; variant B (staff/manager/admin) is read-only — no Add to
 * Cart, no quantity stepper, plus the "Manage stock →" / "Review panel →"
 * links on the stock line. hero-info split (media 440px col, gap 32 -> 24
 * mobile, stacks <768); SpecsTable (P-231 = the 6-pair spec table);
 * ReviewList = PUBLIC reviews only (hidden never render but count in the
 * "Reviews (128)" total); stock line states (in-stock willowGreen / 1–5
 * "Only N left" / 0 out-of-stock) per the doc; AddToCart is wired to the
 * P2 cart module via mockApi.addToCart + CartContext.refresh (the P1
 * seam), firing the "Added — View cart" toast.
 *
 * Route /products/:id — RequireUser; back link is history-aware (falls
 * back to /). Page-local state (selected thumb, quantity) resets on
 * navigation; the quantity chosen here seeds the cart line.
 */
export default function ProductDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refresh } = useCart()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const isBuyer = user?.role === 'buyer'

  useEffect(() => {
    let alive = true
    setError(false)
    setProduct(null)
    setReviews(null)
    setQty(1)
    mockApi
      .getProduct(id)
      .then((p) => {
        if (alive) setProduct(p)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    mockApi
      .getProductReviews(id)
      .then((r) => {
        if (alive) setReviews(r)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [id, retry])

  // Reset the quantity when the product (or its stock) changes so the
  // stepper never clamps above the live stock.
  useEffect(() => {
    setQty(1)
  }, [product?.id, product?.stock])

  const addToCart = async () => {
    if (!isBuyer || !product || adding || product.stock === 0) return
    setAdding(true)
    try {
      await mockApi.addToCart({ productId: product.id, qty })
      await refresh()
      fireToast({ tone: 'success', text: 'Added — View cart', actionLabel: 'View cart', to: '/cart' })
    } catch {
      // P4 owns the full cart; on failure clamp qty to the live stock and
      // report the error per the doc.
      setQty(Math.min(qty, product.stock))
      fireToast({ tone: 'error', text: "Couldn't add to cart — stock changed. Reload." })
    } finally {
      setAdding(false)
    }
  }

  const back = () => {
    if (window.history.length > 2) navigate(-1)
    else navigate('/')
  }

  if (error && !product) {
    return (
      <div className="page pt-section-rhythm">
        <div className="state-error" role="alert">
          Couldn't load this product.{' '}
          <button type="button" className="btn-destructive ml-2" onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page pt-section-rhythm">
        <div className="grid gap-card-gutter" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="skeleton skeleton-tile" style={{ aspectRatio: '4 / 3' }} />
          <div className="flex flex-col gap-3">
            <div className="skeleton skeleton-line-sm" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-11 w-40" />
          </div>
        </div>
      </div>
    )
  }

  const discount = discountPercent(product)
  const oos = product.stock === 0
  const low = !oos && product.stock <= product.lowStockThreshold

  return (
    <div className="page pt-section-rhythm pb-section-rhythm">
      <button type="button" onClick={back} className="text-meta font-medium text-atomicTangerine-600 hover:underline mb-4">
        ← Back to shop
      </button>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* media column: 440px on desktop, stacks on top <768 */}
        <div className="w-full md:w-[440px] md:flex-none">
          <ProductImageGallery product={product} />
        </div>

        {/* info column */}
        <div className="flex-1 min-w-0">
          <p className="text-meta text-blueSlate-700">{product.brand}</p>
          <h1 className="text-h1 font-h1 text-ink mt-1">{product.name}</h1>

          {reviews ? (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={reviews.average} />
              <span className="text-meta text-blueSlate-700">
                {reviews.average.toFixed(1)} ({reviews.total} reviews)
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2.5 mt-3 flex-wrap">
            <span className="text-[24px] leading-8 font-semibold text-atomicTangerine-600">
              {formatIdr(product.price)}
            </span>
            {product.onSale && product.originalPrice ? (
              <span className="text-body text-blueSlate-600 line-through">{formatIdr(product.originalPrice)}</span>
            ) : null}
            {discount > 0 ? (
              <span className="badge" style={{ background: 'var(--strawberryRed-100)', color: 'var(--strawberryRed-700)' }}>
                −{discount}%
              </span>
            ) : null}
          </div>

          {/* stock line: in-stock willowGreen / 1–5 "Only N left" / 0 out-of-stock */}
          <div className="mt-4 flex items-center gap-4 flex-wrap" aria-live="polite">
            {oos ? (
              <span className="badge badge-out">Out of stock</span>
            ) : low ? (
              <span className="text-body font-medium text-willowGreen-600">
                Only {product.stock} left
              </span>
            ) : (
              <span className="text-body font-medium text-willowGreen-600">
                In stock · {product.stock} left
              </span>
            )}

            {/* variant B extra links (staff+ only, per the doc) */}
            {!isBuyer ? (
              <>
                <Link to={user.role === 'staff' ? '/ops/orders' : `/ops/products/${id}/edit`} className="text-meta font-medium text-atomicTangerine-600 hover:underline">
                  Manage stock →
                </Link>
                {user.role !== 'staff' ? (
                  <Link to={`/ops/reviews?product=${id}`} className="text-meta font-medium text-atomicTangerine-600 hover:underline">
                    Review panel →
                  </Link>
                ) : null}
              </>
            ) : null}
          </div>

          {/* buyer purchase row: quantity stepper + Add to Cart (variant B removes both) */}
          {isBuyer ? (
            <div className="flex items-center gap-4 mt-5">
              <QuantityStepper value={qty} min={1} max={Math.max(product.stock, 1)} onChange={setQty} />
              {oos ? (
                <button type="button" disabled className="h-11 px-7 rounded-lg text-body font-medium" style={{ background: 'var(--strawberryRed-100)', color: 'var(--strawberryRed-700)', cursor: 'not-allowed' }}>
                  Out of stock
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={adding}
                  aria-busy={adding}
                  className="btn-primary px-7"
                >
                  {adding ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="spinner" aria-hidden="true" />
                      Adding…
                    </span>
                  ) : (
                    'Add to cart'
                  )}
                </button>
              )}
            </div>
          ) : null}

          {/* specs */}
          {product.specs?.length ? (
            <div className="mt-10">
              <h2 className="text-section text-ink tracking-[0.05em] mb-4">Specs</h2>
              <SpecsTable specs={product.specs} />
            </div>
          ) : null}

          {/* description */}
          {product.description ? (
            <div className="mt-10">
              <h2 className="text-section text-ink tracking-[0.05em] mb-4">Description</h2>
              <div className="rounded-[10px] border border-blueSlate-200 bg-canvas p-4">
                <p className="text-body text-blueSlate-700 leading-[22px]">{product.description}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* reviews: public only (hidden count in the total but never render) */}
      {reviews ? (
        <div className="mt-10">
          <h2 className="text-section text-ink tracking-[0.05em] mb-4">Reviews ({reviews.total})</h2>
          <div className="rounded-[10px] border border-blueSlate-200 bg-canvas p-4">
            <ReviewList reviews={reviews} productName={product.name} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
