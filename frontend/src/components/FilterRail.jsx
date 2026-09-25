import { CATEGORY_LABEL } from '../utils/utils.js'

import { PriceRange } from './PriceRange.jsx'

/**
 * The desktop-only 220px filter rail (docs/search-browse "FilterRail"): white
 * surface, right border blueSlate-200, Category / Brand / Price sections.
 * Category rows select on click (single-select — the URL contract carries one
 * category), selected row = atomicTangerine-50 bg + atomicTangerine-600 text;
 * brand = checkboxes (accent atomicTangerine-500); Price = the dual-range
 * control. Hidden on mobile <768 (catalog-only view). One component per file
 * (code-org rule); the rail renders from props the page derives from the
 * URL.
 * @param {{categories: string[], brands: string[], activeBrands: string[],
 *          category: string|null, priceMin: number, priceMax: number,
 *          floor: number, ceil: number, step: number, busy: boolean,
 *          onCategory: (slug: string|null) => void,
 *          onBrand: (brand: string) => void,
 *          onPrice: (min: number, max: number) => void}} props
 * @returns {object}
 */
export function FilterRail({
  categories,
  brands,
  activeBrands,
  category,
  priceMin,
  priceMax,
  floor,
  ceil,
  step,
  busy,
  onCategory,
  onBrand,
  onPrice,
}) {
  return (
    <aside
      aria-label="Filters"
      className="hidden md:block w-[220px] flex-none border-r border-blueSlate-200 bg-canvas pt-5"
    >
      <h2 className="text-section text-ink tracking-[0.05em] px-5 pb-4">Filters</h2>

      <section className="px-5 pb-5">
        <h3 className="text-meta font-semibold text-blueSlate-950 mb-2">Category</h3>
        <ul className="flex flex-col gap-1">
          {categories.map((slug) => {
            const selected = category === slug
            return (
              <li key={slug}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onCategory(selected ? null : slug)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-body transition-colors ${
                    selected
                      ? 'bg-atomicTangerine-50 text-atomicTangerine-600 font-medium'
                      : 'text-ink hover:bg-blueSlate-50'
                  }`}
                >
                  {selected ? '✓ ' : null}
                  {CATEGORY_LABEL[slug] || slug}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="px-5 pb-5">
        <h3 className="text-meta font-semibold text-blueSlate-950 mb-2">Brand</h3>
        <ul className="flex flex-col gap-1.5">
          {brands.map((b) => (
            <li key={b}>
              <label className="flex items-center gap-2 text-body text-ink py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeBrands.includes(b)}
                  onChange={() => onBrand(b)}
                  className="h-4 w-4"
                  style={{ accentColor: 'var(--atomicTangerine-500)' }}
                  disabled={busy}
                />
                {b}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pb-8">
        <h3 className="text-meta font-semibold text-blueSlate-950 mb-2">Price</h3>
        <PriceRange
          min={priceMin}
          max={priceMax}
          floor={floor}
          ceil={ceil}
          step={step}
          busy={busy}
          onChange={onPrice}
        />
      </section>
    </aside>
  )
}
