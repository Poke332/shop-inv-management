import { formatIdr } from '../utils/utils.js'

/**
 * The dual-range price control (docs/search-browse "PriceRange"): two native
 * range inputs overlaid on one track — min clamped so it can never exceed
 * max (dragging min past max snaps min back to max; dragging max below min
 * snaps max back to min), so the effective range is always [min, max].
 * P3.1 REV 6: a visible 4px rail (blueSlate-200 base) renders BEHIND the
 * two knobs, with the selected min→max span filled atomicTangerine-500 —
 * fill % computed from the current min/max against floor/ceil. Thumbs
 * disabled while a request is in flight; visible values = the clamped ones.
 * Labels follow the mockup "Rp 50k – Rp 5.000.000". One component per file
 * (code-org rule).
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
  // P3.1 REV 6: the fill bar's span as % of the track (floor -> ceil).
  const span = ceil - floor
  const fillLeft = span > 0 ? ((min - floor) / span) * 100 : 0
  const fillRight = span > 0 ? ((ceil - max) / span) * 100 : 0
  return (
    <div>
      <div className="relative h-6" role="group" aria-label="Price range">
        {/* the visible rail: 4px blueSlate-200 base + the tangerine
            min→max fill, behind the two knob inputs (pointer-events-none
            so the native thumbs stay fully draggable) */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blueSlate-200">
          <div
            className="absolute inset-y-0 rounded-full bg-atomicTangerine-500"
            style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
          />
        </div>
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
