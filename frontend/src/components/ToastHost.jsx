/**
 * ToastHost — the ops pages' toast stack (ongoing-orders "Status update
 * failed — retry"; user-dashboard role/disable failures). Pages own the
 * toast list (id + tone + text) and hand it here; each toast auto-dismisses
 * after 4s. Fixed bottom-right, above the ops content; success toasts are
 * willowGreen-100/willowGreen-700, error toasts strawberryRed-100/
 * strawberryRed-600 (a11y: role="alert" on errors, role="status" on
 * success). Shared by 2+ ops pages, so it lives at the components/ root.
 * @param {{toasts: {id: string, tone: string, text: string}[],
 *   onDismiss: (id: string) => void}} props
 * @returns {object} the fixed toast stack (empty when there are none).
 */
export function ToastHost({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[360px]" role="presentation">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-body font-medium ${
            t.tone === 'error'
              ? 'bg-strawberryRed-100 border-strawberryRed-300 text-strawberryRed-600'
              : 'bg-willowGreen-100 border-willowGreen-300 text-willowGreen-700'
          }`}
        >
          <span className="min-w-0">{t.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="ml-auto text-meta font-semibold opacity-60 hover:opacity-100 min-h-[44px] px-2"
            onClick={() => onDismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
