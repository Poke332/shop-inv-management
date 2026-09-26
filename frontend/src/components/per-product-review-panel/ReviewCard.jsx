import { StarRating } from '../StarRating.jsx'
import { SellerCommentComposer } from './SellerCommentComposer.jsx'

/**
 * One review row — shared by BOTH sections (public + hidden) of the review
 * panel (docs/per-product-review-panel "ReviewCard"): read-only StarRating
 * + anonymized buyer + order provenance (#WB-…, 13/400 blueSlate-700) +
 * description + the state pill (Public = willowGreen-100/-700; Hidden =
 * strawberryRed-100/-700 — soft, never danger-colored) + the stored seller
 * comment. Exactly the two valid actions per state — public → [Hide]
 * [Add/Edit comment]; hidden → [Unhide] [Add/Edit comment]. Unhide renders
 * as text on the same secondary shape in willowGreen-600 (reversible,
 * non-destructive — not the danger style). "Edit comment" carries a small
 * blueSlate-500 dot when a comment already exists. The page owns every
 * callback (optimistic move + comment draft live there).
 * @param {object} props
 * @param {object} props.review  the review record (public + hidden shape).
 * @param {boolean} props.flashing  the success-flash row tint is on (2s).
 * @param {boolean} props.busy  the state toggle is in flight.
 * @param {boolean} props.composerOpen  the inline SellerCommentComposer is open.
 * @param {string} props.draft  the seller-comment draft ("" = add).
 * @param {(text: string) => void} props.onDraft  update the draft.
 * @param {() => void} props.onCommentAction  open/close the composer.
 * @param {() => void} props.onStateToggle  the Hide / Unhide click.
 * @param {() => void} props.onCommentSave  Save the draft (empty clears).
 * @param {() => void} props.onCommentCancel  Cancel (discards the draft).
 * @param {boolean} props.saving  the comment commit is in flight.
 * @returns {object} the review card.
 */
export function ReviewCard({
  review,
  flashing,
  busy,
  composerOpen,
  draft,
  onDraft,
  onCommentAction,
  onStateToggle,
  onCommentSave,
  onCommentCancel,
  saving,
}) {
  const publicState = review.state === 'public'
  const hasComment = !!review.sellerComment?.text
  const composerId = `${review.id}-seller-comment`
  return (
    <article
      data-review-card={review.id}
      aria-label={`Review ${review.id} by ${review.buyer}`}
      className={`bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-3 ${
        flashing ? 'flash-row' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <StarRating value={review.rating} />
        <span className="text-body font-medium text-blueSlate-950">{review.buyer}</span>
        <span className="text-meta text-blueSlate-700">
          {review.orderId} · {review.createdAt}
        </span>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-meta font-medium ${
            publicState
              ? 'bg-willowGreen-100 text-willowGreen-700'
              : 'bg-strawberryRed-100 text-strawberryRed-700'
          }`}
          aria-label={publicState ? 'Public' : 'Hidden'}
        >
          {publicState ? 'Public' : 'Hidden'}
        </span>
      </div>

      <p className="text-body text-blueSlate-900">{review.body}</p>

      {hasComment ? (
        <div className="text-meta text-blueSlate-700 border-l-2 border-blueSlate-200 pl-3">
          <span className="font-medium">Seller: </span>
          {review.sellerComment.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {publicState ? (
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onStateToggle} disabled={busy}>
            Hide
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto text-willowGreen-600"
            onClick={onStateToggle}
            disabled={busy}
          >
            Unhide
          </button>
        )}
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCommentAction} disabled={busy}>
          {hasComment ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blueSlate-500" aria-hidden="true" />
              Edit comment
            </span>
          ) : (
            'Add comment'
          )}
        </button>
      </div>

      {composerOpen ? (
        <SellerCommentComposer
          inputId={composerId}
          value={draft}
          onChange={onDraft}
          onSave={onCommentSave}
          onCancel={onCommentCancel}
          saving={saving}
        />
      ) : null}
    </article>
  )
}
