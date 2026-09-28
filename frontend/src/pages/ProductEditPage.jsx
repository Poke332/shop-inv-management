import { useEffect, useState } from 'react'

import { Link, useParams } from 'react-router'

import { ProductForm } from '../components/per-product-dashboard/ProductForm.jsx'
import { mockApi } from '../data'

/**
 * /ops/products/:id/edit — the pre-filled product editor (docs/per-
 * product-dashboard "Edit"). Route /ops/products/:id/edit — manager/admin.
 * Arrival: the Inventory Dashboard "Open editor" deep link or the list
 * selection; the form re-hydrates from the product record on arrival, and
 * the ProductForm's dirty-leave confirm guards the unsaved draft.
 * @returns {object} the page.
 */
export function ProductEditPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setProduct(null)
    setNotFound(false)
    mockApi
      .getProduct(id)
      .then((p) => {
        if (alive) setProduct(p)
      })
      .catch(() => {
        if (alive) setNotFound(true)
      })
    return () => {
      alive = false
    }
  }, [id, retry])

  return (
    <div className="ops-page">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-h1 font-h1 text-ink">Edit product — {id}</h1>
        <Link to="/ops/products" className="text-meta text-atomicTangerine-600 hover:underline">
          Back to list
        </Link>
      </div>

      {notFound ? (
        <div className="state-error mt-5" role="alert">
          Product {id} could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : product ? (
        <div className="mt-5 max-w-[560px]">
          <ProductForm product={product} onSaved={(p) => setProduct(p)} />
        </div>
      ) : (
        <div className="mt-5 max-w-[560px]">
          <div className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-3" aria-busy="true">
            <div className="skeleton skeleton-line-sm" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
          </div>
        </div>
      )}
    </div>
  )
}
