/**
 * The 44px quantity stepper (product-details + cart; docs: min 1, max =
 * stock, "+" disabled at max). One component per file (code-org rule).
 * @param {number} value  @param {number} min  @param {number} max
 * @param {(n:number)=>void} onChange
 * @param {string} [labelFor]  optional product name; when set the buttons
 *   read "Decrease/increase quantity for <labelFor>" (the cart a11y spec),
 *   otherwise the generic labels.
 * @returns {object}
 */
export function QuantityStepper({ value, min, max, onChange, labelFor }) {
  const dec = labelFor ? `Decrease quantity for ${labelFor}` : 'Decrease quantity'
  const inc = labelFor ? `Increase quantity for ${labelFor}` : 'Increase quantity'
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label={dec}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="stepper-val" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={inc}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
