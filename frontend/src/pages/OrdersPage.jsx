import { useEffect, useMemo, useState } from 'react'

import { Link, useLocation } from 'react-router'

import { mockApi } from '../data'
import { OrderCard } from '../components/orders/OrderCard.jsx'

/**
 * The Orders Placed page (docs/orders-placed): "My orders" h1 + the
 * buyer's order list, newest first (the just-placed order — detected via
 * the post-checkout redirect context, not the URL — pinned on top +
 * auto-expanded, pending chip). Each card links its lines to the
 * product page; a delivered, not-yet-rated line carries its review
 * block. States: static row skeletons, the 5xx panel with retry, and
 * the empty "No orders yet" card with the "Start shopping" CTA. The
 * buyer is read-only — no status-edit affordances.
 */
export default function OrdersPage() {
  const location = useLocation()
  // the just-placed order id arrives via the receipt's "View my orders"
  // redirect state (the post-checkout context, not the URL)
  const justPlaced = location.state?.justPlaced || null

  const [orders, setOrders] = useState(null)
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  const [expanded, setExpanded] = useState(() => new Set())

  useEffect(() => {
    let alive = true
    setError(false)
    setOrders(null)
    mockApi
      .getMyOrders()
      .then((o) => {
        if (!alive) return
        // newest first: the redirect context pins the just-placed order
        // on top; the rest keep the mock's descending-id order
        const pinned = justPlaced ? o.filter((x) => x.id === justPlaced) : []
        const rest = o.filter((x) => x.id !== justPlaced)
        setOrders([...pinned, ...rest])
      })
      .catch(() => {
        if (alive) setError(true)
      })
    mockApi
      .getProducts()
      .then((d) => {
        if (alive) setProducts(d.items)
      })
      .catch(() => {
        /* thumbnails fall back to the generic tile when the catalog read fails */
      })
    return () => {
      alive = false
    }
  }, [justPlaced, retry])

  // the just-placed (or, on a direct arrival, the newest) order starts expanded
  useEffect(() => {
    if (orders?.length) {
      const target = justPlaced ? justPlaced : orders[0].id
      setExpanded(new Set([target]))
    }
  }, [orders, justPlaced])

  const productById = useMemo(
    () => new Map((products || []).map((p) => [p.id, p])),
    [products],
  )

  const toggle = (id) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="page pt-section-rhythm pb-section-rhythm">
      <h1 className="text-h1 font-h1 text-ink mb-6">My orders</h1>

      {error ? (
        <div className="state-error mb-6" role="alert">
          Couldn't load your orders.{' '}
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => setRetry((n) => n + 1)}
          >
            Try again
          </button>
        </div>
      ) : null}

      {orders === null && !error ? (
        <div className="flex flex-col gap-card-gutter">
          <div className="skeleton w-full" style={{ height: 72 }} />
          <div className="skeleton w-full" style={{ height: 72 }} />
        </div>
      ) : null}

      {orders?.length === 0 ? (
        <div className="state-empty bg-canvas border border-blueSlate-200 rounded-xl">
          <h2>No orders yet</h2>
          <p className="mb-6">Your placed orders will show up here.</p>
          <Link to="/" className="btn-primary">
            Start shopping
          </Link>
        </div>
      ) : null}

      {orders?.length ? (
        <div className="flex flex-col gap-card-gutter">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expanded.has(order.id)}
              onToggle={() => toggle(order.id)}
              productById={productById}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
