import { ORDER_FLOW } from '../../utils/utils.js'

/**
 * The 4-step order status timeline (docs/orders-placed "StatusTimeline"):
 * 14px dots — completed willowGreen-500, current atomicTangerine-500,
 * upcoming blueSlate-200 — with 44px connectors (willowGreen-500 where
 * done) + step labels (13/500 blueSlate-700, the current step
 * blueSlate-950 w600). A semantic list with the current step
 * aria-current="step"; the order's status is announced aria-live="polite".
 * @param {{status: string, orderId: string}} props
 * @returns {object} the timeline.
 */
export function StatusTimeline({ status, orderId }) {
  const currentIdx = Math.max(ORDER_FLOW.indexOf(status), 0)
  return (
    <ol
      className="flex items-center gap-2"
      aria-label={`Order ${orderId} status: ${status}`}
    >
      {ORDER_FLOW.map((step, i) => {
        const isDone = i < currentIdx
        const isCurrent = i === currentIdx
        const dot = isDone ? 'bg-willowGreen-500' : isCurrent ? 'bg-atomicTangerine-500' : 'bg-blueSlate-200'
        return (
          <li
            key={step}
            className="flex items-center gap-2 min-w-0"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
            <span
              className={`text-meta ${
                isCurrent ? 'text-blueSlate-950 font-semibold' : 'text-blueSlate-700 font-medium'
              }`}
            >
              {step}
            </span>
            {i < ORDER_FLOW.length - 1 ? (
              <span
                className="w-11 h-0.5 shrink-0 bg-blueSlate-200"
                style={isDone ? { background: 'var(--willowGreen-500)' } : undefined}
                aria-hidden="true"
              />
            ) : null}
          </li>
        )
      })}
      <span className="sr-only" aria-live="polite">
        Order {orderId} is now {status}
      </span>
    </ol>
  )
}
