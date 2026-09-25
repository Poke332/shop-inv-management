import { formatIdr } from '../utils/utils.js'

/**
 * The dual-range price control (docs/search-browse "PriceRange"): two native
 * range inputs overlaid on one track — min clamped so it can never exceed
 * max (dragging min past max snaps min back to max; dragging max below min
 * snaps max back to min), so the effective range is always [min, max].
 * Thumbs disabled while a request is in flight; visible values = the
 * clamped ones. Labels follow the mockup "Rp 50k – Rp 5.000.000". One
 * component per file (code-org rule).
 * @param {{min: number, max: number, floor: number, ceil: number,
 *          step: number, busy: boolean,
 *          onChange: (min: number, max: number) => void}} props
 * @returns {import('react').ReactElement}
 */
export function PriceRange({ min, max, floor, ceil, step, busy, onChange }) {
  const setMin = (v) => {
    const n = Math.min(v, max) // never exceed max
    onChange(n, max)
  }
  const setMax = (v) => {
    const n = Math.max(v, min) // never drop below min
    onChange(min, n)
  }
  return (
    <div>
      <div className="relative h-6" role="group" aria-label="Price range">
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={min}
          disabled={busy}
          aria-label="Minimum price"
          onChange={(e) => setMin(Number(e.target.value))}
          className="price-range absolute inset-0 w-full appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={max}
          disabled={busy}
          aria-label="Maximum price"
          onChange={(e) => setMax(Number(e.target.value))}
          className="price-range absolute inset-0 w-full appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      </div>
      <p className="text-meta text-blueSlate-700" aria-live="off">
        {formatIdr(min)} – {formatIdr(max)}
      </p>
    </div>
  )
}
