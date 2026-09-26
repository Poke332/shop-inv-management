import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Link, useLocation, useParams } from 'react-router'

import { ToastHost } from '../components/ToastHost.jsx'
import { AlertBanner } from '../components/inventory-dashboard/AlertBanner.jsx'
import { ProductTable } from '../components/inventory-dashboard/ProductTable.jsx'
import { OrderQueue } from '../components/ongoing-orders/OrderQueue.jsx'
import { ProductForm } from '../components/per-product-dashboard/ProductForm.jsx'
import { ProductList } from '../components/per-product-dashboard/ProductList.jsx'
import { UserTable } from '../components/user-dashboard/UserTable.jsx'
import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useToasts } from '../hooks/useToasts.js'
import { CATEGORY_LABEL, stockStatus } from '../utils/utils.js'

/**
 * Ops route-slot placeholder. The real pages (ongoing-orders,
 * inventory-dashboard, per-product-dashboard, review panel, user-dashboard —
 * see each docs/<page>/IMPLEMENTATION.md) fill these slots. The slot renders
 * inside the OpsShell's .ops-content gutter, so the gutter is live on every
 * ops route now. It echoes the live URL + the signed-in session (AuthContext)
 * so the RBAC redirects stay visible while the real pages are placeholders.
 * @param {string} title  the h1 shown in the slot card.
 * @param {string} [subtitle]  helper line under the h1 (defaults to a placeholder note).
 */
export function OpsPlaceholder({ title, subtitle }) {
  const location = useLocation()
  const user = useAuth().user
  return (
    <div className="ops-page">
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding max-w-content">
        <h1 className="text-h1 font-h1 text-ink">{title}</h1>
        <p className="text-body text-inkMuted mt-section-label-gap">
          {subtitle || 'Placeholder route slot — a real page replaces this placeholder.'}
        </p>
        <p className="text-meta text-blueSlate-700 mt-2" data-echo>
          URL: {location.pathname}{location.search}
          {user ? ` · session ${user.username} (${user.role})` : ''}
        </p>
      </div>
    </div>
  )
}

/**
 * Ongoing-orders queue page (docs/ongoing-orders). Route /ops/orders —
 * OpsShell, staff/manager/admin (RequireOps): the OrderQueue with status
 * tabs + receipt-table detail expand. Data = mockApi.getOrders (oldest
 * pending first); advances are optimistic (chip + button move forward on
 * click, success flash on settle, REVERT + error toast on failure). The
 * first pending order in the freshly loaded queue (the just-placed order,
 * WB-1042 in the fixture) expands by default; a 30s poll keeps the open
 * queue live.
 * @returns {object} the page.
 */
export function OngoingOrdersPage() {
  const [tab, setTab] = useState('all')
  const [items, setItems] = useState(null)
  const [tabs, setTabs] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState(() => new Set())
  const [optimistic, setOptimistic] = useState(() => new Map())
  const [flashing, setFlashing] = useState(() => new Set())
  const { toasts, toast, dismiss } = useToasts()

  const load = useCallback((silent = false) => {
    if (!silent) {
      setItems(null)
      setError(false)
    }
    mockApi
      .getOrders(tab === 'all' ? undefined : tab)
      .then((d) => {
        setItems(d.items)
        setTabs(d.tabs)
      })
      .catch(() => setError(true))
  }, [tab])

  useEffect(() => {
    load()
  }, [load, retry])

  // 30s poll of the open queue (the ongoing-orders assumption — mirrors
  // Orders Placed polling). Silent: the visible queue is NOT blanked into
  // skeletons on a tick; it stops while the error state is showing.
  useEffect(() => {
    if (error) return undefined
    const id = setInterval(() => load(true), 30000)
    return () => clearInterval(id)
  }, [load, error])

  // the just-placed order (the newest pending in the queue) expands by
  // default on the first data load (the WB-1042 fixture). One-shot via a
  // ref so later queue reloads don't keep auto-expanding.
  const autoExpanded = useRef(false)
  useEffect(() => {
    if (!items?.length || autoExpanded.current) return
    const pendings = items.filter((o) => o.status === 'pending')
    const newest = pendings[pendings.length - 1]
    if (newest) {
      setExpanded((s) => new Set([...s, newest.id]))
      autoExpanded.current = true
    }
  }, [items])

  const toggle = (id) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const onOptimistic = (id, next) => setOptimistic((m) => new Map(m).set(id, next))
  // The optimistic forward-move stays visible (chip + button) until the
  // reconciling refetch lands — clearing it first would open a window
  // where the chip snaps back to the stale status. The refetch replaces
  // items + the derived tab counts together, so clear after it settles.
  const onOk = (id, next) => {
    setFlashing((s) => new Set(s).add(id))
    setTimeout(
      () =>
        setFlashing((cur) => {
          const cleared = new Set(cur)
          cleared.delete(id)
          return cleared
        }),
      2000,
    )
    mockApi
      .getOrders(tab === 'all' ? undefined : tab)
      .then((d) => {
        setItems(d.items)
        setTabs(d.tabs)
        setOptimistic((m) => {
          const cleared = new Map(m)
          cleared.delete(id)
          return cleared
        })
      })
      .catch(() => {
        // the refetch is a reconciliation nicety — if it fails, drop the
        // optimistic hold so the button re-enables on the next attempt.
        setOptimistic((m) => {
          const cleared = new Map(m)
          cleared.delete(id)
          return cleared
        })
      })
  }
  const onFail = (id) => {
    setOptimistic((m) => {
      const next = new Map(m)
      next.delete(id)
      return next
    })
    toast('Status update failed — retry')
  }

  const displayStatusOf = (id) => {
    const opt = optimistic.get(id)
    if (opt) return opt
    const o = items?.find((x) => x.id === id)
    return o ? o.status : 'pending'
  }

  return (
    <div className="ops-page">
      <h1 className="text-h1 font-h1 text-ink">Ongoing orders</h1>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The order queue could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <OrderQueue
            items={items || []}
            displayStatusOf={displayStatusOf}
            tabs={tabs || { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 }}
            tab={tab}
            onTab={setTab}
            expanded={expanded}
            onToggle={toggle}
            flashing={flashing}
            onOptimistic={onOptimistic}
            onOk={onOk}
            onFail={onFail}
            loading={!items && !error}
          />
        </div>
      )}

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

/**
 * /ops/orders/:id — the same queue page with that order's receipt detail
 * expanded + linked (docs/ongoing-orders "Surviving state": the :id variant
 * encodes the expanded order in the URL; tab state is in-page, not
 * URL-encoded). The queue loads the full list (all tabs); the linked order
 * starts expanded.
 * @returns {object} the page.
 */
export function OngoingOrderDetailPage() {
  const { id } = useParams()
  const [items, setItems] = useState(null)
  const [tabs, setTabs] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState(() => new Set(id ? [id] : []))
  const [optimistic, setOptimistic] = useState(() => new Map())
  const [flashing, setFlashing] = useState(() => new Set())
  const { toasts, toast, dismiss } = useToasts()

  useEffect(() => {
    setError(false)
    mockApi
      .getOrders()
      .then((d) => {
        setItems(d.items)
        setTabs(d.tabs)
        if (id && d.items.some((o) => o.id === id)) setExpanded(new Set([id]))
      })
      .catch(() => setError(true))
  }, [id, retry])

  const toggle = (oid) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(oid)) next.delete(oid)
      else next.add(oid)
      return next
    })

  const onOptimistic = (oid, next) => setOptimistic((m) => new Map(m).set(oid, next))
  const onOk = (oid) => {
    setOptimistic((m) => {
      const cleared = new Map(m)
      cleared.delete(oid)
      return cleared
    })
    mockApi
      .getOrders()
      .then((d) => {
        setItems(d.items)
        setTabs(d.tabs)
      })
      .catch(() => {})
    setFlashing((s) => new Set(s).add(oid))
    setTimeout(
      () =>
        setFlashing((cur) => {
          const next = new Set(cur)
          next.delete(oid)
          return next
        }),
      2000,
    )
  }
  const onFail = (oid) => {
    setOptimistic((m) => {
      const next = new Map(m)
      next.delete(oid)
      return next
    })
    toast('Status update failed — retry')
  }

  const displayStatusOf = (oid) => {
    const opt = optimistic.get(oid)
    if (opt) return opt
    const o = items?.find((x) => x.id === oid)
    return o ? o.status : 'pending'
  }

  return (
    <div className="ops-page">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-h1 font-h1 text-ink">Ongoing orders</h1>
        <span className="text-meta text-blueSlate-700">
          <Link to="/ops/orders" className="text-atomicTangerine-600 hover:underline">
            Back to queue
          </Link>
        </span>
      </div>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The order queue could not be loaded.{' '}
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => setRetry((r) => r + 1)}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <OrderQueue
            items={items || []}
            displayStatusOf={displayStatusOf}
            tabs={tabs || { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 }}
            tab="all"
            onTab={() => {}}
            expanded={expanded}
            onToggle={toggle}
            flashing={flashing}
            onOptimistic={onOptimistic}
            onOk={onOk}
            onFail={onFail}
            loading={!items && !error}
          />
        </div>
      )}

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

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

/**
 * Per-product dashboard list (docs/per-product-dashboard). Route
 * /ops/products — manager/admin (requireManagerOrAdmin): the 330px
 * ProductList + ProductForm master/detail split. A standalone arrival
 * pre-fills the editor with the first catalog product; "+ New product"
 * seeds the add form (empty spec list — the Specs card starts at zero
 * pairs). A create success highlights the new list row.
 * @returns {object} the page.
 */
export function ProductsPage() {
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
            selectedId={mode === 'create' ? null : selectedId}
            createdId={createdId}
            onSelect={(pid) => {
              setMode('edit')
              setSelectedId(pid)
            }}
            onNew={() => {
              setMode('create')
              setSelectedId(null)
            }}
          />
          <ProductForm
            key={mode === 'create' ? 'create' : selectedId || 'blank'}
            product={mode === 'create' ? null : selected}
            onSaved={(p, isCreate) => onSaved(p, isCreate)}
          />
        </div>
      )}
    </div>
  )
}

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

/**
 * Review panel slot (moderation model — P6).
 * Route /ops/reviews — manager/admin (requireManagerOrAdmin); the
 * per-product review panel + setReviewHidden / setSellerComment (api/reviews.js)
 * lands here.
 */
export function ReviewsPage() {
  return (
    <OpsPlaceholder
      title="Review Panel"
      subtitle="Placeholder — the per-product review panel lands here (manager/admin)."
    />
  )
}

/**
 * User dashboard (docs/user-dashboard). Route /ops/users — admin only
 * (requireAdmin): the user table with per-row RoleSelect + StatusToggle,
 * the confirm dialogs (inside UserTable), the "Role updated to <role> ·
 * <username>" success flash, the 50-per-page "Load more" list, and SELF-
 * PROTECTION — the signed-in admin's own row carries no controls (absent,
 * not disabled). Role/status changes are optimistic in the row, reverted
 * on failure with the error toast.
 * @returns {object} the page.
 */
export function UsersPage() {
  const user = useAuth().user
  const [users, setUsers] = useState(null)
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim().toLowerCase(), 300)
  const [limit, setLimit] = useState(50)
  const [flash, setFlash] = useState(null)
  const { toasts, toast, dismiss } = useToasts()

  useEffect(() => {
    let alive = true
    setUsers(null)
    setCounts(null)
    setError(false)
    mockApi
      .getUsers()
      .then((d) => {
        if (!alive) return
        setUsers(d.items)
        setCounts({ total: d.items.length, ...d.counts })
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [retry])

  const filtered = useMemo(() => {
    if (!users) return null
    if (!debounced) return users
    return users.filter(
      (u) => u.username.toLowerCase().includes(debounced) || u.email.toLowerCase().includes(debounced),
    )
  }, [users, debounced])

  // Optimistic role/status patch: apply in state, confirm via mockApi,
  // revert + toast on failure (the page re-queries on navigation, so no
  // cross-page state survives).
  const patchUser = async (username, next, apiCall, onDone) => {
    const prev = users.find((u) => u.username === username)
    if (!prev) return
    setUsers((us) => (us ? us.map((u) => (u.username === username ? next(u) : u)) : us))
    try {
      await apiCall(username)
      onDone()
    } catch {
      setUsers((us) => (us ? us.map((u) => (u.username === username ? prev : u)) : us))
      toast('Update failed — retry')
    }
  }

  const showFlash = (text) => {
    setFlash({ text })
    setTimeout(() => setFlash(null), 4000)
  }

  const visible = filtered ? filtered.slice(0, limit) : null
  const remaining = filtered ? filtered.length - limit : 0

  return (
    <div className="ops-page">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-h1 font-h1 text-ink">Users</h1>
        <span className="badge bg-blueSlate-100 text-blueSlate-900">Admin only</span>
      </div>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The user list could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / email…"
              aria-label="Search users"
              className="h-11 w-full sm:w-[320px] rounded-lg border border-blueSlate-200 bg-canvas px-4 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
            />
            {counts ? (
              <span className="text-meta text-blueSlate-700 sm:ml-auto">
                {counts.total} users · {counts.staff} staff · {counts.managers} managers · {counts.admin} admin
              </span>
            ) : null}
          </div>

          {flash ? (
            <div className="flash-banner mt-4" role="status">
              {flash.text}
            </div>
          ) : null}

          <div className="mt-5">
            <UserTable
              users={visible || []}
              loading={!users && !error}
              currentUsername={user?.username}
              onRoleCommit={(row, newRole) =>
                patchUser(
                  row.username,
                  (u) => ({ ...u, role: newRole }),
                  (id) => mockApi.setUserRole(id, newRole),
                  () => showFlash(`Role updated to ${newRole} · ${row.username}`),
                )
              }
              onStatusCommit={(row, active) =>
                patchUser(
                  row.username,
                  (u) => ({ ...u, active }),
                  (id) => mockApi.setUserActive(id, active),
                  () =>
                    showFlash(active ? `${row.username} re-enabled` : `${row.username} disabled`),
                )
              }
            />
            {remaining > 0 ? (
              <button type="button" className="btn-primary btn-loadmore mt-4" onClick={() => setLimit((l) => l + 50)}>
                Load more
              </button>
            ) : filtered && filtered.length > 1 ? (
              <p className="loadmore-done mt-4">{filtered.length} users shown</p>
            ) : null}
          </div>

          <p className="text-meta text-blueSlate-700 mt-5">
            Toggle = disable / enable account — a disabled user cannot log in (their next attempt shows
            the "Account not available" banner). Disabling is not deleting.
          </p>
        </>
      )}

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
