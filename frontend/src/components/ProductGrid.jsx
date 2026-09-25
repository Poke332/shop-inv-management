import { ProductCard } from './ProductCard.jsx'

/**
 * The shared ProductGrid (round-11 card spec via ProductCard). Column counts
 * follow the design docs: main-store = 4-up at >=1024, 3-up 768-1023, 2-up
 * 390-767 (24px gutter), 1-up <390; search-browse (columns="3") = 3-up at
 * >=768, 2-up 390-767 (16px gutter), 1-up <390. `footer` slot renders the
 * load-more button or the exhaustion line per the round-10 note. `onBuy` /
 * `onAdd` pass per-card CTA overrides down to ProductCard (e.g. the
 * product-details read-only variant). One component per file (code-org rule).
 * @param {object[]} items  products to render.
 * @param {'4'|'3'} [columns]  desktop column count (default 4).
 * @param {import('react').ReactNode} [footer]  optional grid footer slot.
 * @param {function} [onBuy]  per-card "Buy now" override.
 * @param {function} [onAdd]  per-card "Add to cart" override.
 * @returns {import('react').ReactElement}
 */
export function ProductGrid({ items, columns = 4, footer, onBuy, onAdd }) {
  // Breakpoints mirror the mockup-build CSS exactly (lib.py .grid4 /
  // .grid-search): main-store 4-up >=1024 / 3-up 768-1023 / 2-up 390-767 /
  // 1-up <390; search-browse (columns=3) 3-up >=768 / 2-up 390-767 / 1-up <390.
  // Tailwind has no 390px screen, so the 2-up floor uses an arbitrary
  // min-[390px]: variant. Gutters: 24px card-gutter everywhere on the catalog
  // grids (the --card-gutter var drops 32 -> 24 below 768 by itself);
  // search-browse tightens to 16px below 768.
  const cols =
    columns === 3
      ? 'grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3'
      : 'grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  const gap = columns === 3 ? 'gap-4 md:gap-card-gutter' : 'gap-card-gutter'
  return (
    <div>
      <ul className={`grid ${gap} ${cols}`}>
        {items.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard p={p} onBuy={onBuy} onAdd={onAdd} />
          </li>
        ))}
      </ul>
      {footer}
    </div>
  )
}
