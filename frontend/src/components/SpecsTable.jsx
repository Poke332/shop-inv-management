/**
 * The round-9 spec table (docs/product-details "SpecsTable"): a 2-col
 * key/value grid, 1px blueSlate-200 borders, 10px radius. The pairs ride
 * on the product record (`specs: [{ key, value }]`, ordered) — P-231 carries
 * the 6 pairs Model / Bluetooth / Battery / ANC / IP rating / Weight.
 * Empty when the record has no spec pairs (nothing renders). One component
 * per file (code-org rule).
 * @param {Array<{key: string, value: string}>} specs  the ordered pairs.
 * @returns {import('react').ReactElement}
 */
export function SpecsTable({ specs }) {
  if (!specs || specs.length === 0) return null
  return (
    <div
      className="overflow-hidden rounded-[10px] border border-blueSlate-200 bg-canvas"
      role="table"
      aria-label="Specifications"
    >
      {specs.map((row, i) => (
        <div
          key={row.key}
          className={`grid grid-cols-2 ${i > 0 ? 'border-t border-blueSlate-200' : ''}`}
        >
          <div
            className="px-4 py-2.5 text-meta text-blueSlate-700 border-r border-blueSlate-200"
            role="cell"
          >
            {row.key}
          </div>
          <div className="px-4 py-2.5 text-body text-ink" role="cell">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  )
}
