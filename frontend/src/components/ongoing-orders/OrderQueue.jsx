import { OrderStatusTabs } from './OrderStatusTabs.jsx'
import { OrderRow } from './OrderRow.jsx'

/**
 * The open-order queue for ongoing-orders: the All/Pending/…/Delivered
 * tabs with live counts, the OrderRow list (sorted by age, oldest
 * pending first — fulfillment priority), and the footer note line.
 * Rows render the status the page resolved for them (live status, or
 * the optimistic one mid-advance) — the queue itself holds no
 * mutation state; changes are announced aria-live="polite". Shipped /
 * Delivered are the recent read-only audit tabs.
 * @param {{items: object[], displayStatusOf: (id: string) => string,
 *   tabs: object, tab: string, onTab: (tab: string) => void,
 *   expanded: Set<string>, onToggle: (id: string) => void,
 *   flashing: Set<string>,
 *   onOptimistic: (id: string, next: string) => void,
 *   onOk: (id: string) => void, onFail: (id: string) => void,
 *   loading: boolean}} props
 * @returns {object} the queue (skeleton rows while loading).
 */
export function OrderQueue({
  items,
  displayStatusOf,
  tabs,
  tab,
  onTab,
  expanded,
  onToggle,
  flashing,
  onOptimistic,
  onOk,
  onFail,
  loading,
}) {
  return (
    <div className="flex flex-col gap-5">
      <OrderStatusTabs active={tab} counts={tabs} onSelect={onTab} />

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding">
              <div className="skeleton skeleton-line-sm" />
              <div className="skeleton skeleton-line mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <div aria-live="polite" className="flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="state-empty">
              <h2>No orders in this view</h2>
              <p>Open orders land here as buyers check out.</p>
            </div>
          ) : (
            items.map((o) => {
              const status = displayStatusOf(o.id)
              return (
                <OrderRow
                  key={o.id}
                  order={{ ...o, status }}
                  displayStatus={status}
                  expanded={expanded.has(o.id)}
                  flashing={flashing.has(o.id)}
                  onToggle={onToggle}
                  onOptimistic={onOptimistic}
                  onOk={onOk}
                  onFail={onFail}
                />
              )
            })
          )}
        </div>
      )}

      <p className="text-meta text-blueSlate-700">
        Queue sorted by age · status advances forward-only
      </p>
    </div>
  )
}
