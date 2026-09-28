import { useEffect, useState } from 'react'

import { Link, useParams } from 'react-router'

import { ToastHost } from '../components/ToastHost.jsx'
import { OrderQueue } from '../components/ongoing-orders/OrderQueue.jsx'
import { mockApi } from '../data'
import { useToasts } from '../hooks/useToasts.js'

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
