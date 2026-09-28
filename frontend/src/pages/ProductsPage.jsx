import { useEffect, useState } from 'react'

import { ProductForm } from '../components/per-product-dashboard/ProductForm.jsx'
import { ProductList } from '../components/per-product-dashboard/ProductList.jsx'
import { ProductReadonly } from '../components/per-product-dashboard/ProductReadonly.jsx'
import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Per-product dashboard (docs/per-product-dashboard). Route /ops/products,
 * the base ops tier (RequireOps): the 330px ProductList on the left, and
 * the detail pane on the right gated by the session role — manager/admin
 * get the ProductForm master/detail split (a standalone arrival pre-fills
 * the editor with the first catalog product; "+ New product" seeds the
 * add form; a create success highlights the new list row); staff get the
 * read-only ProductReadonly view of the selected product (list + data,
 * no editor controls — the /ops/products/:id/edit deep-link stays
 * manager/admin, so a read-only session has no editor to open).
 * @returns {object} the page.
 */
export function ProductsPage() {
  const role = useAuth().user?.role
  const canEdit = role === 'manager' || role === 'admin'
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('edit') // "edit" | "create"
  const [createdId, setCreatedId] = useState(null)

  useEffect(() => {
    let alive = true
    setProducts(null)
    setError(false)
    mockApi
      .getProducts({ sort: 'catalog' })
      .then((d) => {
        if (!alive) return
        setProducts(d.items)
        setSelectedId((cur) => cur || (d.items[0] ? d.items[0].id : null))
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [retry])

  const onSaved = (p, isCreate) => {
    setProducts((ps) => (ps ? [p, ...ps.filter((x) => x.id !== p.id)] : [p]))
    if (isCreate) {
      // the add form keeps its "Product created" flash for 2s (the list row
      // is highlighted in that window too); then the split switches to the
      // pre-filled editor for the new product.
      setCreatedId(p.id)
      setTimeout(() => {
        setCreatedId(null)
        setMode('edit')
        setSelectedId(p.id)
      }, 2000)
    }
  }

  const selected = products?.find((p) => p.id === selectedId) || null

  return (
    <div className="ops-page">
      <h1 className="text-h1 font-h1 text-ink">Products</h1>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The product list could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-8 md:grid-cols-[330px_minmax(0,1fr)]">
          <ProductList
            products={products || []}
            loading={!products && !error}
            selectedId={canEdit && mode === 'create' ? null : selectedId}
            createdId={createdId}
            onSelect={(pid) => {
              setMode('edit')
              setSelectedId(pid)
            }}
            onNew={canEdit ? () => { setMode('create'); setSelectedId(null) } : undefined}
          />
          {canEdit ? (
            <ProductForm
              key={mode === 'create' ? 'create' : selectedId || 'blank'}
              product={mode === 'create' ? null : selected}
              onSaved={(p, isCreate) => onSaved(p, isCreate)}
            />
          ) : (
            <ProductReadonly product={selected} loading={!products} />
          )}
        </div>
      )}
    </div>
  )
}
