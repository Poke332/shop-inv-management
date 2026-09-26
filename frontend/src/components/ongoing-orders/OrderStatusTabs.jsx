/**
 * The ongoing-orders filter tabs (All / Pending / Processing / Shipped /
 * Delivered). Active tab = 3px tangerine underline + blueSlate-950 600;
 * idle = blueSlate-700 500. The row scrolls horizontally at 390px.
 * @param {{active: string, counts: {all:number, pending:number,
 *   processing:number, shipped:number, delivered:number},
 *   onSelect: (tab: string) => void}} props
 * @returns {object} the tab row.
 */
export function OrderStatusTabs({ active, counts, onSelect }) {
  const TAB_LABELS = {
    all: 'All',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
  }
  const tabs = ['all', 'pending', 'processing', 'shipped', 'delivered']
  return (
    <div className="ops-tabs" role="tablist" aria-label="Order status filter">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={active === t}
          className={active === t ? 'active' : ''}
          onClick={() => onSelect(t)}
        >
          {TAB_LABELS[t]}
          {` (${counts[t] ?? 0})`}
        </button>
      ))}
    </div>
  )
}
