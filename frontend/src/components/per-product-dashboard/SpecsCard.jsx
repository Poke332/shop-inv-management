import { FiTrash2, FiPlus } from 'react-icons/fi'

/**
 * SpecsCard — the repeatable name/value spec-pair section of the product
 * editor (docs/per-product-dashboard "SpecsCard"): a white surface card
 * (1px blueSlate-200, 12px radius — same card tokens as the editor card)
 * whose rows are a 2-col grid (130px name input + 1fr value input, 44px
 * min-height) each carrying a 44px trash remove control, and a "+ Add
 * spec" secondary button that appends an empty pair. The new-product
 * form starts with ZERO pairs (specs are optional enrichment, not a
 * save gate); the edit path pre-fills the product's existing pairs
 * (P-231's six).
 * @param {{specs: {key: string, value: string}[],
 *   onChange: (specs: {key: string, value: string}[]) => void}} props
 * @returns {object} the specs card.
 */
export function SpecsCard({ specs, onChange }) {
  const setPair = (i, field, val) =>
    onChange(specs.map((s, j) => (j === i ? { ...s, [field]: val } : s)))

  return (
    <section className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-label="Specs">
      <h3 className="text-section font-semibold text-ink">Specs</h3>
      <div className="flex flex-col gap-3 mt-3">
        {specs.map((s, i) => (
          <div key={i} className="flex items-center gap-2" style={{ minHeight: '44px' }}>
            <div className="grid grid-cols-[130px_1fr] gap-2 flex-1 min-w-0">
              <input
                className="input"
                value={s.key}
                placeholder="Spec"
                aria-label={`Spec ${i + 1} name`}
                onChange={(e) => setPair(i, 'key', e.target.value)}
              />
              <input
                className="input"
                value={s.value}
                placeholder="Value"
                aria-label={`Spec ${i + 1} value`}
                onChange={(e) => setPair(i, 'value', e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-del"
              aria-label={`Remove spec ${i + 1}`}
              onClick={() => onChange(specs.filter((_, j) => j !== i))}
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-secondary mt-3"
        style={{ width: 'auto', gap: 6 }}
        onClick={() => onChange([...specs, { key: '', value: '' }])}
      >
        <FiPlus aria-hidden="true" /> Add spec
      </button>
    </section>
  )
}
