import { FiX } from 'react-icons/fi'

import { CATEGORY_LABEL } from '../utils/utils.js'

/**
 * The active-filter chip row (docs/search-browse "FilterChips"): one removable
 * pill per active filter (query / category / brand) + the "Clear all"
 * link. Pill = blueSlate-100 bg, blueSlate-900 label, removable × glyph in
 * strawberryRed-600; "Clear all" = atomicTangerine-600 13px. Renders above
 * the results grid, on the warm ground. One component per file (code-org
 * rule); the chip set is derived by the page (its single export owns the
 * state mapping).
 * @param {{query?: string, category?: string, brands: string[],
 *          onRemove: (key: string, value?: string) => void,
 *          onClearAll: () => void}} props
 * @returns {object} the chip row, or null when idle.
 */
export function FilterChips({ query, category, brands, onRemove, onClearAll }) {
  const hasAny = !!query || !!category || brands.length > 0
  if (!hasAny) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {query ? (
        <span className="chip bg-blueSlate-100 text-blueSlate-900">
          “{query}”
          <button
            type="button"
            aria-label={`Remove query filter “${query}”`}
            className="text-strawberryRed-600 hover:no-underline"
            onClick={() => onRemove('query')}
          >
            <FiX size={14} />
          </button>
        </span>
      ) : null}
      {category ? (
        <span className="chip bg-blueSlate-100 text-blueSlate-900">
          {CATEGORY_LABEL[category] || category}
          <button
            type="button"
            aria-label={`Remove ${CATEGORY_LABEL[category] || category} filter`}
            className="text-strawberryRed-600"
            onClick={() => onRemove('category')}
          >
            <FiX size={14} />
          </button>
        </span>
      ) : null}
      {brands.map((b) => (
        <span key={b} className="chip bg-blueSlate-100 text-blueSlate-900">
          {b}
          <button
            type="button"
            aria-label={`Remove ${b} filter`}
            className="text-strawberryRed-600"
            onClick={() => onRemove('brand', b)}
          >
            <FiX size={14} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-meta font-medium text-atomicTangerine-600 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
