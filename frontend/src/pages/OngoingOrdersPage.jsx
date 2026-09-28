import { useCallback, useEffect, useRef, useState } from 'react'

import { ToastHost } from '../components/ToastHost.jsx'
import { OrderQueue } from '../components/ongoing-orders/OrderQueue.jsx'
import { mockApi } from '../data'
import { useToasts } from '../hooks/useToasts.js'

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
