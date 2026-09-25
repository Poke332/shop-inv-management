/**
 * Static card skeletons (no shimmer, docs §4 loading state).
 * One component per file (code-org rule).
 * @param {number} [n]  how many skeletons (default 8).
 * @returns {object}
 */
export function ProductCardSkeleton({ n = 8 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card">
          <div className="skeleton skeleton-tile" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line-sm" />
          <div className="skeleton h-4 w-24" />
          <div className="card-cta-row flex gap-2">
            <div className="skeleton h-11 flex-1" />
            <div className="skeleton h-11 flex-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
