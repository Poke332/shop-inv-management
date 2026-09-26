import { useState } from 'react'

import { mockApi } from '../../data'
import { ORDER_FLOW } from '../../utils/utils.js'

/**
 * The one advance button per order — the ongoing-orders core action
 * (forward-only machine: pending -> processing -> shipped -> delivered;
 * no backward step, no skip). Labels: "Start processing" / "Mark shipped"
 * / "Mark delivered"; delivered (terminal) renders no button at all.
 *
 * Optimistic: on click the status chip + button move forward immediately
 * (onOptimistic, which the page pairs with the success-flash row tint);
 * the PATCH then settles — onOk confirms, onFail reverts the status and
 * the page fires the "Status update failed — retry" error toast. Double-
 * advance guarded: the button is disabled mid-flight ("Saving…").
 * @param {{order: object, onOptimistic: (id: string, next: string) => void,
 *   onOk: (id: string) => void, onFail: (id: string) => void}} props
 * @returns {object|null} the button (null when the order is delivered).
 */
export function StatusAdvanceButton({ order, onOptimistic, onOk, onFail }) {
  const [busy, setBusy] = useState(false)
  const idx = ORDER_FLOW.indexOf(order.status)
  const next = ORDER_FLOW[idx + 1]
  if (!next) return null

  const label = next === 'processing' ? 'Start processing' : `Mark ${next}`

  const advance = async () => {
    setBusy(true)
    onOptimistic(order.id, next)
    try {
      await mockApi.advanceOrderStatus(order.id, next)
      onOk(order.id, next)
    } catch {
      onFail(order.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className="btn-primary"
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={advance}
    >
      {busy ? 'Saving…' : label}
    </button>
  )
}
