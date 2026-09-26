import { useState } from 'react'

import { FiChevronDown, FiSliders } from 'react-icons/fi'

import { CATEGORY_LABEL } from '../../utils/utils.js'

/**
 * The mobile filter disclosure panel (docs/search-browse "mobile filters"):
 * the <768px stand-in for the desktop FilterRail, which is hidden on
 * mobile. A "Filters" disclosure button (44px target, aria-expanded) opens
 * a panel that exposes the SAME Category (single-select) + Brand
 * (multi-select) controls the desktop rail does, driven by the page's
 * shared handlers (onCategory / onBrand) so they stay in sync with the
 * URL params, the chip row, and the desktop rail. Category = a
 * horizontally-scrolling single-select chip row (selected = tangerine
 * tint, aria-pressed); Brand = wrapping checkboxes (44px rows). Does NOT
 * replace or duplicate the rail — the rail keeps its `hidden md:block`
 * desktop 220px form. One component per file (code-org rule).
 * @param {{categories: string[], brands: string[], activeBrands: string[],
 *          category: string|null, busy: boolean,
 *          onCategory: (slug: string|null) => void,
 *          onBrand: (brand: string) => void}} props
 * @returns {object} the disclosure button + panel (hidden on >=768).
 */
export function MobileFilterPanel({
  categories,
  brands,
  activeBrands,
  category,
  busy,
  onCategory,
  onBrand,
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden mb-5">
      {/* disclosure trigger: full-width 44px target, chevron mirrors state */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-filter-panel"
        className="btn-secondary w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <FiSliders size={18} />
          Filters
        </span>
        <FiChevronDown
          size={18}
          aria-hidden="true"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open ? (
        <div
          id="mobile-filter-panel"
          className="mt-3 rounded-lg border border-blueSlate-200 bg-canvas p-4"
        >
          {/* Category — single-select chip row (scrolls horizontally at 320) */}
          <h3 className="text-meta font-semibold text-blueSlate-950 mb-2">Category</h3>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((slug) => {
              const selected = category === slug
              return (
                <button
                  key={slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onCategory(selected ? null : slug)}
                  disabled={busy}
                  className={`flex-none rounded-pill px-3 h-11 text-meta transition-colors ${
                    selected
                      ? 'bg-atomicTangerine-50 text-atomicTangerine-600 font-medium'
                      : 'bg-surface text-ink'
                  }`}
                >
                  {CATEGORY_LABEL[slug] || slug}
                </button>
              )
            })}
          </div>

          {/* Brand — multi-select checkboxes, 44px rows, wrapping */}
          <h3 className="text-meta font-semibold text-blueSlate-950 mt-4 mb-2">Brand</h3>
          <div className="grid grid-cols-2 gap-x-4">
            {brands.map((b) => (
              <label
                key={b}
                className="flex items-center gap-2 min-h-11 text-body text-ink cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeBrands.includes(b)}
                  onChange={() => onBrand(b)}
                  className="h-4 w-4"
                  style={{ accentColor: 'var(--atomicTangerine-500)' }}
                  disabled={busy}
                />
                <span className="truncate">{b}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
