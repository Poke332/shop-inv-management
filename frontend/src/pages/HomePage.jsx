import { useEffect, useState } from 'react'

import { Link } from 'react-router'

import { mockApi } from '../data'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton.jsx'

/** First 8 items = 4 FEATURED + first-4 SHOP_ALL (the round-11 2 desktop rows). */
const HOME_SLICE = 8

/**
 * P3 main-store page (docs/main-store/IMPLEMENTATION.md): full-bleed hero
 * banner -> 3x2 category image grid (deep-links /search?category=<slug>) ->
 * "Our Products" 8-item grid with "See more" on the heading row (right side;
 * full-width on <768 where the row stacks). Load-more is in-place state:
 * clicking "See more" fetches the full catalog and grows the slice; when
 * exhausted the button is replaced by the centered "All N products shown"
 * line. Section order per round-11: header -> hero (full-bleed, outside the
 * centered container) -> "Browse by category" -> "Our Products". Route / —
 * buyer only (RequireBuyer).
 */
export default function HomePage() {
  const [catalog, setCatalog] = useState(null) // null = first paint (skeletons)
  const [catalogError, setCatalogError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [heroOk, setHeroOk] = useState(true)
  const [loaded, setLoaded] = useState(HOME_SLICE)

  // One fetch with sort=catalog keeps the ARCHITECTURE §4.2 record order
  // intact so the home slice rows match the committed mockup-bottom.png:
  // row 1 = first 4 FEATURED (P-231/198/140/087), row 2 = first-4 SHOP_ALL
  // (P-052/111/064/208). Load-more grows the slice from the SAME in-memory
  // fetch (no second request), so the grid can never blank out mid-click.
  useEffect(() => {
    let alive = true
    setCatalogError(false)
    mockApi
      .getProducts({ sort: 'catalog' })
      .then((res) => {
        if (alive) setCatalog(res.items)
      })
      .catch(() => {
        if (alive) setCatalogError(true)
      })
    return () => {
      alive = false
    }
  }, [retry])

  // Home slice = 4 FEATURED + first-4 SHOP_ALL, taken in record order.
  const ordered = catalog
    ? [
        ...catalog.filter((p) => p.featured),
        ...catalog.filter((p) => !p.featured),
      ]
    : []
  const items = ordered.slice(0, Math.min(loaded, ordered.length))
  const total = ordered.length
  const done = loaded >= total && total > 0

  const loadMore = () => setLoaded(ordered.length) // reveal the rest locally

  return (
    <>
      {/* ---- full-bleed hero (edge-to-edge, outside the .page container) ---- */}
      <div
        className={`relative w-full overflow-hidden mb-section-rhythm ${heroOk ? '' : 'h-40'}`}
        style={heroOk ? { aspectRatio: '16 / 9' } : { background: 'var(--atomicTangerine-50)' }}
      >
        {heroOk ? (
          <img
            src="/hero-banner.png"
            alt="Sunset Glow: headphones, smartwatches, laptop, phone, speaker and game controller on a dark reflective surface"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center right' }}
            loading="eager"
            fetchPriority="high"
            onError={() => setHeroOk(false)}
          />
        ) : null}
        {/* copy overlay: right-third, vertically centered on desktop; bottom
             flow on mobile (H2 -> 26/36, CTA full-width) per the design doc */}
        <div
          className={`absolute flex flex-col gap-3 text-left left-4 right-4 bottom-4 max-w-none ${
            heroOk
              ? 'md:left-auto md:right-12 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:max-w-[380px]'
              : ''
          }`}
        >
          <p
            className={`text-meta font-semibold tracking-[0.05em] uppercase ${
              heroOk ? 'text-tuscanSun-300' : 'text-blueSlate-700'
            }`}
          >
            New season gear
          </p>
          <h2
            className={`font-semibold text-h1 ${
              heroOk ? 'text-white md:text-[32px] md:leading-10' : 'text-ink'
            }`}
          >
            Power everything.
          </h2>
          <p className={`text-body max-w-md ${heroOk ? 'text-blueSlate-100' : 'text-blueSlate-700'}`}>
            Audio to wearables — new drops this week.
          </p>
          <a href="#shop-all" className={`btn-primary w-full md:w-auto ${heroOk ? 'md:self-start' : ''}`}>
            Shop the drop
          </a>
        </div>
      </div>

      <div className="page pb-section-rhythm">
        {/* ---- Browse by category: 3x2 image grid (round-11) ---- */}
        <section aria-labelledby="browse-category" className="mb-section-rhythm">
          <h2
            id="browse-category"
            className="text-section text-ink tracking-[0.05em] mb-section-label-gap"
          >
            Browse by category
          </h2>
          {/* round-11: 3×2 image grid on desktop; a horizontal-scroll rail
               (tile min-width 320px, 24px gutter) on mobile <768 */}
          <div className="flex gap-card-gutter overflow-x-auto pb-1 md:grid md:grid-cols-3">
            {[
              ['audio', 'Audio'],
              ['smart-home', 'Smart Home'],
              ['gaming', 'Gaming'],
              ['laptops', 'Laptops & PC'],
              ['accessories', 'Accessories'],
              ['wearables', 'Wearables'],
            ].map(([slug, label]) => (
              <Link
                key={slug}
                to={`/search?category=${slug}`}
                className="block flex-1 overflow-hidden rounded-lg border border-blueSlate-200 bg-canvas transition-colors hover:border-atomicTangerine-400 focus-visible:outline-2 focus-visible:outline-atomicTangerine-500 md:min-w-[320px] md:flex-none"
              >
                <div className="relative w-full" style={{ aspectRatio: '4 / 1' }}>
                  <img
                    src={`/cat-${slug}.png`}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="px-4 py-3 text-card text-ink">{label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ---- Our Products: heading row + See more + 8-item grid ---- */}
        <section
          id="shop-all"
          className="pb-section-rhythm"
          style={{ scrollMarginTop: 80 }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-section-label-gap">
            <h2 className="text-section text-ink tracking-[0.05em]">Our Products</h2>
            {catalog && !done ? (
              <button
                type="button"
                className="btn-primary btn-loadmore"
                onClick={loadMore}
              >
                See more
              </button>
            ) : null}
          </div>

          {catalogError ? (
            <div className="state-error" role="alert">
              Couldn't load products.{' '}
              <button type="button" className="btn-destructive ml-2" onClick={() => setRetry((n) => n + 1)}>
                Try again
              </button>
            </div>
          ) : !catalog ? (
            <ProductCardSkeleton n={8} />
          ) : catalog.length === 0 ? (
            <div className="state-empty">
              <h2>No products yet</h2>
              <p>New drops land here weekly.</p>
              <button type="button" className="btn-primary mt-4" onClick={() => setRetry((n) => n + 1)}>
                Refresh
              </button>
            </div>
          ) : (
            <>
              <ProductGrid items={items} />
              {done ? (
                <p className="loadmore-done mt-section-label-gap">All {total} products shown</p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  )
}
