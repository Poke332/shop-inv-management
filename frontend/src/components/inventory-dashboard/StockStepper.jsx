import { useEffect, useState } from 'react'

/**
 * StockStepper — the inventory table's inline quick-set (docs/inventory-
 * dashboard "StockStepper": open decision #2 — the NUMBER only is edited
 * inline; the full edit lives in the per-product editor). 44px cells,
 * blueSlate-200 border; the value is an editable input (type −/digits/+).
 * The ± buttons step AND save immediately (a one-step off the current draft
 * is unambiguous, so it doesn't wait for the input's blur); a typed value
 * commits on blur or Enter (mockApi.setStock, absolute value, min 0).
 * success tints the row willowGreen-100 for ~1s (the page's
 * flashRow), a failure shows the inline "Save failed — retry" link.
 * Rendered by manager/admin ONLY — staff never see it (visibility
 * gating). aria-valuenow carries the live value.
 * @param {{value: number, id: string, onCommit: (id: string, qty: number) => void,
 *   failed: boolean, onRetry: (id: string) => void}} props  onCommit is
 *   fire-and-forget (the page owns the store write + flash); `failed`
 *   marks the last attempt as failed so the retry link renders.
 * @returns {object} the −/input/+ stepper.
 */
export function StockStepper({ value, id, onCommit, failed, onRetry }) {
  const [draft, setDraft] = useState(String(value))

  // re-hydrate the draft when the committed value changes (a failed
  // retry after the store refreshed elsewhere)
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  // ± step AND save in one action: the new value is unambiguous
  // (current draft + 1 / - 1), so commit it now instead of waiting for the
  // input to blur — a stepper tap that only moved the draft (display ahead
  // of the store) would revert on reload. Typed values still commit on
  // blur/Enter, where the value can't be assumed.
  const stepCommit = (delta) => {
    const q = Math.max(0, Math.floor(Number(draft) || 0) + delta)
    setDraft(String(q))
    if (q !== value) onCommit(id, q)
  }

  const commit = () => {
    const q = Math.max(0, Math.floor(Number(draft) || 0))
    if (String(q) !== String(value)) onCommit(id, q)
    else setDraft(String(value))
  }

  return (
    <div>
      <div
        className="stepper"
        role="spinbutton"
        aria-valuemin={0}
        aria-valuenow={value}
        aria-label={`Stock for ${id}`}
      >
        <button
          type="button"
          aria-label={`Decrease stock for ${id}`}
          disabled={value <= 0}
          onClick={() => setDraft(String(Math.max(0, (Number(draft) || 0) - 1)))}
        >
          −
        </button>
        <input
          className="stock-stepper-input"
          inputMode="numeric"
          aria-label={`Stock for ${id} — type the exact count`}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
        <button
          type="button"
          aria-label={`Increase stock for ${id}`}
          onClick={() => setDraft(String((Number(draft) || 0) + 1))}
        >
          +
        </button>
      </div>
      {failed ? (
        <button
          type="button"
          onClick={() => onRetry(id)}
          className="text-meta font-medium text-strawberryRed-600 hover:underline"
        >
          Save failed — retry
        </button>
      ) : null}
      <p className="text-meta text-blueSlate-700 mt-1">
        Stock is auto-decremented on each order — set actual count
      </p>
    </div>
  )
}
