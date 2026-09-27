import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router'

import { mockApi } from '../data'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton.jsx'
import { FilterRail } from '../components/search/FilterRail.jsx'
import { FilterChips } from '../components/search/FilterChips.jsx'
import { MobileFilterPanel } from '../components/search/MobileFilterPanel.jsx'

/** Load-more batch for the 3-col results grid (the mockup's 3x2 row). */
const PAGE = 6

/**
 * Search-browse page (docs/search-browse/IMPLEMENTATION.md): FilterRail
 * (220px, white, Category/Brand) + FilterChips + SearchResults
 * (count + sort + 3-col ProductGrid, dual CTA). ALL filter state
 * lives in URL query params (query/category/brand/sort) —
 * filters refetch in place via param updates, never a route change. Free
 * text is debounced 300ms; category/brand are immediate; the result
 * count is announced aria-live; empty = "No matches for …" + Clear all
 * (blueSlate-50 panel), error = strawberryRed panel + retry with the last
 * good results kept on screen behind it. The load-more offset is
 * component-local, reset on ANY param change (decided: not URL-encoded).
 *
 * Route /search — buyer (RequireBuyer). Arrival: header search submit
 * (?query=), the main-store category tiles (/search?category=<slug> — the
 * arriving chip renders active like any other filter chip), or deep-link.
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('query') || ''
  const category = params.get('category')
  // `brand` is a CSV list (URL contract keeps one param name; the rail's
  // checkboxes are multi-select).
  const activeBrands = useMemo(
    () => (params.get('brand') ? params.get('brand').split(',').filter(Boolean) : []),
    [params],
  )
  const sort = params.get('sort') || 'featured'

  const [items, setItems] = useState(null) // last good results (null = first paint)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)
  const [visible, setVisible] = useState(PAGE)
  const [catalogBrands, setCatalogBrands] = useState([])

  // The rail's brand options reflect the catalog (docs: "reflect catalog
  // brands … not hard-coded") — fetch the unfiltered catalog once for it.
  useEffect(() => {
    let alive = true
    mockApi
      .getProducts()
      .then((res) => {
        if (!alive) return
        const brands = [...new Set(res.items.map((p) => p.brand))].sort()
        setCatalogBrands(brands)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // join every filter into one key so ANY change refetches + resets the load-more offset
  const paramKey = [query, category, activeBrands.join('|'), sort].join('~')

  // Refetch on ANY param change. Free-text is debounced 300ms; every other
  // filter (category/brand/sort) is immediate.
  useEffect(() => {
    let alive = true
    const run = () => {
      setBusy(true)
      setError(false)
      const filter = { sort }
      if (query) filter.query = query
      if (category) filter.category = category
      // the mock API takes one brand — pass it only for the single-brand
      // case; multi-brand is refined client-side (order preserved: the API
      // sorts before we filter).
      if (activeBrands.length === 1) filter.brand = activeBrands[0]
      mockApi
        .getProducts(filter)
        .then((res) => {
          if (!alive) return
          let list = res.items
          if (activeBrands.length > 1) list = list.filter((p) => activeBrands.includes(p.brand))
          setItems(list)
          setTotal(list.length)
          setVisible(PAGE) // the load-more offset resets on any param change
          setBusy(false)
        })
        .catch(() => {
          if (!alive) return
          setError(true) // last good results stay on screen behind the panel
          setBusy(false)
        })
    }
    if (query) {
      const t = setTimeout(run, 300) // free-text debounce
      return () => {
        alive = false
        clearTimeout(t)
      }
    }
    run()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, retryTick])

  const set = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, String(v))
    }
    setParams(next)
  }

  const clearAll = () => setParams(new URLSearchParams())
  const removeChip = (key, value) => {
    if (key === 'brand') {
      const rest = activeBrands.filter((b) => b !== value)
      set({ brand: rest.length ? rest.join(',') : null })
    } else {
      const map = {
        query: 'query',
        category: 'category',
      }
      const patch = {}
      if (key === 'query') patch.query = null
      if (key === 'category') patch.category = null
      set(patch)
    }
  }

  const toggleBrand = (b) => {
    const next = activeBrands.includes(b)
      ? activeBrands.filter((x) => x !== b)
      : [...activeBrands, b]
    set({ brand: next.length ? next.join(',') : null })
  }

  const toggleCategory = (slug) => set({ category: slug })

  const showAll = items && visible >= total && total > 0
  const slice = items ? items.slice(0, visible) : []
  const empty = !busy && !error && items && total === 0

  return (
    <div className="page">
      <div className="flex gap-card-gutter pt-section-rhythm pb-section-rhythm">
        <FilterRail
          categories={['audio', 'smart-home', 'gaming', 'laptops', 'accessories', 'wearables']}
          brands={catalogBrands}
          activeBrands={activeBrands}
          category={category}
          busy={busy}
          onCategory={toggleCategory}
          onBrand={toggleBrand}
        />

        <div className="flex-1 min-w-0 pt-5">
          {/* mobile (<768): the filter disclosure panel stands in for the
              hidden desktop rail; desktop shows the 220px rail instead */}
          <MobileFilterPanel
            categories={['audio', 'smart-home', 'gaming', 'laptops', 'accessories', 'wearables']}
            brands={catalogBrands}
            activeBrands={activeBrands}
            category={category}
            busy={busy}
            onCategory={toggleCategory}
            onBrand={toggleBrand}
          />

          <FilterChips
            query={query}
            category={category}
            brands={activeBrands}
            onRemove={removeChip}
            onClearAll={clearAll}
          />

          {/* results header: count (aria-live) + sort control */}
          <div className="flex flex-wrap items-center gap-3 mt-5 mb-5">
            <p className="text-meta text-blueSlate-700" aria-live="polite">
              {busy && !items ? 'Searching…' : `${total} result${total === 1 ? '' : 's'}`}
            </p>
            <label className="ml-auto flex items-center gap-2">
              <span className="sr-only">Sort results by</span>
              <select
                value={sort}
                disabled={busy}
                onChange={(e) => set({ sort: e.target.value === 'featured' ? null : e.target.value })}
                className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body text-ink focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Sort: Price ↑</option>
                <option value="price-desc">Sort: Price ↓</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="state-error mb-5" role="alert">
              Couldn't load results.{' '}
              <button type="button" className="btn-destructive ml-2" onClick={() => setRetryTick((n) => n + 1)}>
                Try again
              </button>
            </div>
          ) : null}

          {empty ? (
            <div className="state-empty bg-blueSlate-50 rounded-lg">
              <h2>No matches for {query ? `“${query}”` : 'these filters'}</h2>
              <p>Try removing a filter, or start from the full catalog.</p>
              <button type="button" className="btn-primary mt-4" onClick={clearAll}>
                Clear all
              </button>
            </div>
          ) : null}

          {busy && !items ? (
            <ProductCardSkeleton n={6} />
          ) : !error && slice.length > 0 ? (
            <ProductGrid
              items={slice}
              columns={3}
              footer={
                !showAll ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      className="btn-primary btn-loadmore mx-auto block"
                      onClick={() => setVisible((v) => v + PAGE)}
                    >
                      See more
                    </button>
                  </div>
                ) : (
                  <p className="loadmore-done mt-5">All {total} products shown</p>
                )
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
