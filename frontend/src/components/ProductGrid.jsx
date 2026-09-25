import { ProductCard } from './ProductCard.jsx'

/**
 * The ProductGrid (main-store 4-up; search-browse passes a `columns` prop to
 * render the 3-up results grid). `footer` slot renders the load-more button
 * or the exhaustion line per the round-10 note. One component per file.
 * @param {object[]} items  products to render.
 * @param {'4'|'3'} [columns]  desktop column count (default 4).
 * @param {import('react').ReactNode} [footer]  optional grid footer slot.
 * @returns {import('react').ReactElement}
 */
export function ProductGrid({ items, columns = 4, footer }) {
  const cols =
    columns === 3
      ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  return (
    <div>
      <ul className={`grid gap-card-gutter ${cols}`}>
        {items.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
      {footer}
    </div>
  )
}
