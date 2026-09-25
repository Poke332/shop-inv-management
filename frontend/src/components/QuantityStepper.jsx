/**
 * The 44px quantity stepper (product-details + cart; docs: min 1, max =
 * stock, "+" disabled at max). One component per file (code-org rule).
 * @param {number} value  @param {number} min  @param {number} max
 * @param {(n:number)=>void} onChange
 * @returns {object}
 */
export function QuantityStepper({ value, min, max, onChange }) {
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="Decrease quantity"
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
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
