import { storage } from '../data/persistence.js'

/**
 * The 44px quantity stepper (product-details + cart; docs: min 1, max =
 * stock, "+" disabled at max). One component per file (code-org rule).
 * @param {number} value  @param {number} min  @param {number} max
 * @param {(n:number)=>void} onChange
 * @param {string} [labelFor]  optional product name; when set the buttons
 *   read "Decrease/increase quantity for <labelFor>" (the cart a11y spec),
 *   otherwise the generic labels.
 * @param {boolean} [disabled]  inert both buttons (the cart's per-line
 *   pending state, while an op is in flight).
 * @returns {object}
 */
export function QuantityStepper({ value, min, max, onChange, labelFor, disabled = false }) {
  const dec = labelFor ? `Decrease quantity for ${labelFor}` : 'Decrease quantity'
  const inc = labelFor ? `Increase quantity for ${labelFor}` : 'Increase quantity'

  const changeQty = (v) => {
    const ls = storage();
    if (!ls) return
    ls.setItem('quantity', JSON.stringify({ value: v }));
  }
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label={dec}
        disabled={disabled || value <= min}
        onClick={() => {
          changeQty(value - 1);
          onChange(Math.max(min, value - 1));
        }}
      >
        −
      </button>
      <span className="stepper-val" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={inc}
        disabled={disabled || value >= max}
        onClick={() => {
          changeQty(value + 1); 
          onChange(Math.min(max, value + 1));
        }}
      >
        +
      </button>
    </div>
  )
}
