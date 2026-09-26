import { useEffect, useRef } from 'react'

/**
 * ConfirmDialog — the shared confirm primitive (user-dashboard: role-change
 * and disable confirmations; per-product-dashboard: the unsaved-changes
 * dialog). One centered modal over a dimmed overlay: strawberryRed-100
 * panel, strawberryRed-700 heading, Cancel (secondary) + Confirm. Three
 * confirm tones: 'default' = tangerine (role change), 'danger' =
 * strawberryRed (disable), 'success' = willowGreen (enable). Closes on
 * Cancel, Confirm, Escape, or overlay click; the Confirm button takes
 * initial focus. Shared by 2+ ops pages, so it lives at the components/
 * root.
 * @param {{open: boolean, title: string, body: (string | object),
 *   confirmLabel?: string, tone?: 'default' | 'danger' | 'success',
 *   onConfirm: () => void, onCancel: () => void}} props
 * @returns {object|null} the modal (null when closed).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  const confirmClass =
    tone === 'danger' ? 'btn-destructive' : tone === 'success' ? 'btn-success' : 'btn-primary'
  return (
    <div
      className="confirm-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <div>{body}</div>
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" ref={confirmRef} className={confirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
