/**
 * The seller-comment composer (docs/per-product-review-panel): the inline
 * "merchant reply" form that opens under a review row. Full-width textarea
 * (1px blueSlate-200, 10px radius) — empty for Add, pre-filled for Edit
 * (the page passes the draft, so it survives a Hidden-section collapse);
 * Save = filled atomicTangerine-600 44px CTA, Cancel = secondary
 * (discards). Saving an empty string clears the comment (edit is the
 * replacement — no delete action in v1). The page owns the draft +
 * save/cancel callbacks.
 * @param {object} props
 * @param {string} props.inputId  the textarea's id (the visible "Seller
 *   comment" label is htmlFor it).
 * @param {string} props.value  the current draft text.
 * @param {(text: string) => void} props.onChange  draft update.
 * @param {() => void} props.onSave  commit the draft (empty clears).
 * @param {() => void} props.onCancel  discard the draft.
 * @param {boolean} props.saving  the commit is in flight (buttons disabled).
 * @returns {object} the composer block.
 */
export function SellerCommentComposer({ inputId, value, onChange, onSave, onCancel, saving }) {
  return (
    <div className="flex flex-col gap-2 border-t border-blueSlate-200 pt-3">
      <label htmlFor={inputId} className="text-meta font-medium text-blueSlate-700">
        Seller comment
      </label>
      <textarea
        id={inputId}
        className="input w-full"
        style={{ borderRadius: '10px', minHeight: '64px' }}
        rows={2}
        placeholder="Reply to this review — it publishes beneath the review on Product Details while the review is public"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        aria-label="Seller comment"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  )
}
