import { useEffect, useMemo, useState } from 'react'

import { AlertBanner } from '../components/inventory-dashboard/AlertBanner.jsx'
import { ProductTable } from '../components/inventory-dashboard/ProductTable.jsx'
import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { CATEGORY_LABEL, stockStatus } from '../utils/utils.js'

/**
 * Inventory dashboard (docs/inventory-dashboard). Route /ops/inventory —
 * OpsShell, staff/manager/admin with feature gating INSIDE: staff sees the
 * stock overview + "Needs attention" alerts READ-ONLY (the steppers and the
 * "Open editor" links are not rendered — visibility gating, not disabled
 * styling); manager/admin get the inline StockStepper quick-set + editor
 * deep links. Data = mockApi.getProducts (catalog order, all 48) +
 * getStockOverview (stock ≤ 5, out-of-stock first).
 * @returns {object} the page.
 */
export function InventoryPage() {
  const role = useAuth().user?.role
  const canEdit = role === 'manager' || role === 'admin'
  const [products, setProducts] = useState(null)
  const [attention, setAttention] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim().toLowerCase(), 300)
  const [flashRow, setFlashRow] = useState(null)

  useEffect(() => {
    let alive = true
    setProducts(null)
    setAttention(null)
    setError(false)
    Promise.all([mockApi.getProducts({ sort: 'catalog' }), mockApi.getStockOverview()])
      .then(([cat, att]) => {
        if (!alive) return
        setProducts(cat.items)
        setAttention(att.items)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [retry])

  const filtered = useMemo(() => {
    if (!products) return null
    if (!debounced) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(debounced) ||
        p.category.toLowerCase().includes(debounced) ||
        (CATEGORY_LABEL[p.category] || '').toLowerCase().includes(debounced),
    )
  }, [products, debounced])

  const onStockSet = async (id, qty) => {
    // re-throw: ProductTable owns the inline "Save failed — retry" link
    // (failed row set); the page re-fetches the committed product on success.
    const p = await mockApi.setStock(id, qty)
    setProducts((ps) => (ps ? ps.map((x) => (x.id === p.id ? p : x)) : ps))
    const status = stockStatus(p)
    setAttention((a) =>
      a
        ? a
            .map((x) =>
              x.productId === p.id
                ? { ...x, stock: p.stock, status: status === 'out' ? 'out' : 'low' }
                : x,
            )
            .filter((x) => x.stock === 0 || x.stock <= 5)
        : a,
    )
    setFlashRow(id)
    setTimeout(() => setFlashRow(null), 1000)
  }

  const scrollToRow = (productId) => {
    // the desktop tr owns the id; the mobile card (data attribute) is the
    // visible one at <768px — scroll whichever is rendered
    const els = document.querySelectorAll(`#inv-row-${productId}, [data-inv-row="${productId}"]`)
    const el = [...els].find((e) => e.offsetParent !== null) || els[0]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const totalProducts = products?.length || 0

  return (
    <div className="ops-page">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-h1 font-h1 text-ink">Inventory</h1>
        <span className="text-meta text-blueSlate-700">
          {totalProducts ? `${totalProducts} products` : '…'} · {attention?.length ?? '…'} need attention
        </span>
      </div>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The stock overview could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {attention ? (
            <div className="mt-5">
              <AlertBanner
                items={attention}
                canEdit={canEdit}
                onOpen={(pid) => scrollToRow(pid)}
              />
            </div>
          ) : null}

          <div className="mt-5">
            <ProductTable
              products={filtered || []}
              loading={!products && !error}
              canEdit={canEdit}
              onSetStock={onStockSet}
              flashRow={flashRow}
              search={search}
              onSearch={setSearch}
              totalNote={totalProducts ? `${totalProducts} products · stock ≤ 5 flagged LOW` : ''}
            />
          </div>
        </>
      )}
    </div>
  )
}
