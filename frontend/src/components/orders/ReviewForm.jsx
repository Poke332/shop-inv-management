import { useState } from 'react'

import { mockApi } from '../../data'

/**
 * The purchase-rating block (docs/orders-placed "ReviewForm"): per
 * delivered order, per purchased product not yet rated (server flag
 * `reviewed`) — "Rate this purchase — <product>" in a blueSlate-50 inset
 * card: 5 clickable stars (filled tuscanSun-500 / empty tuscanSun-200,
 * the TBD scale note), an optional comment input (44px min), and the
 * "Send" filled primary CTA. 0 stars on submit = the inline
 * strawberryRed-600 "Please pick a rating"; success replaces the block
 * with the confirmation line "Thanks — you rated <product> [stars]"
 * (the stars mirror the rating actually chosen), willowGreen-600 on
 * willowGreen-100, non-re-openable for that item.
 * @param {{order: object, line: object}} props  the delivered order + one
 *   of its lines (productId + name).
 * @returns {object} the rating block, or the confirmation line.
 */
export function ReviewForm({ order, line }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [err, setErr] = useState(null)
  const [sent, setSent] = useState(null) // {rating, comment} once confirmed
  const [busy, setBusy] = useState(false)

  if (sent) {
    const stars = '★'.repeat(sent.rating) + '☆'.repeat(5 - sent.rating)
    return (
      <div className="rounded-[10px] border border-blueSlate-200 bg-willowGreen-100 p-5">
        <p className="text-body font-medium text-willowGreen-600">
          Thanks — you rated {line.name}{' '}
          <span aria-label={`${sent.rating} out of 5 stars`}>{stars}</span>
        </p>
      </div>
    )
  }

  const send = async () => {
    if (busy) return
    if (rating < 1) {
      setErr('Please pick a rating')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      await mockApi.submitReview(order.id, line.productId, rating, comment)
      setSent({ rating, comment })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[10px] border border-blueSlate-200 bg-surface p-5">
      <h3 className="text-body font-semibold text-ink mb-3">
        Rate this purchase — {line.name}
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating >= n}
              onClick={() => setRating(n)}
              className="text-2xl leading-none focus-visible:outline-2 focus-visible:outline-atomicTangerine-500 focus-visible:outline-offset-2"
              style={{
                color: rating >= n ? 'var(--tuscanSun-500)' : 'var(--tuscanSun-200)',
                transition: 'color 120ms ease',
              }}
            >
              ★
            </button>
          ))}
        </div>
        {err ? (
          <span className="text-meta text-strawberryRed-600" role="alert">{err}</span>
        ) : null}
      </div>
      <label htmlFor={`review-${order.id}-${line.productId}`} className="sr-only">
        Comment (optional)
      </label>
      <textarea
        id={`review-${order.id}-${line.productId}`}
        rows={2}
        value={comment}
        disabled={busy}
        placeholder="comment (optional)"
        onChange={(e) => setComment(e.target.value)}
        className="mt-3 w-full min-h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 py-2.5 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 resize-y"
      />
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={send}
          disabled={busy}
          aria-busy={busy}
          className="btn-primary"
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
