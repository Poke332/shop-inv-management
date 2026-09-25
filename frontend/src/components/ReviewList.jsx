import { StarRating } from './StarRating.jsx'

/**
 * The product-details review rows (docs/product-details "ReviewList"): the
 * PUBLIC reviews only, newest first — hidden reviews never render (no
 * description, no stars) but DO count in the section total the page shows:
 * "Reviews (128)" = 122 public + 6 hidden. Each row: stars + quoted body +
 * right-aligned date, then "buyer · purchased …" meta, then the optional
 * seller-comment block (indented 16px, 2px blueSlate-200 left border,
 * "Seller" label 13/600, body 14/22 blueSlate-700, date blueSlate-500
 * 13/400 — absent when no comment, no placeholder). The page owns the
 * section label + white panel; this is the row list. One component per
 * file (code-org rule).
 * @param {object} reviews  getProductReviews() result: { items, total,
 *            publicCount, hiddenCount, average }.
 * @param {string} [productName]  for the "purchased …" provenance line.
 * @param {number} [limit]  max rows to render (default 5 — the list is a
 *            newest-first sample; the full public set stays in the data).
 * @returns {object}
 */
export function ReviewList({ reviews, productName, limit = 5 }) {
  const rows = (reviews?.items || []).slice(0, limit)
  return (
    <ul className="flex flex-col gap-6">
      {rows.map((r) => (
        <li key={r.id}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <StarRating value={r.rating} />
            <span className="text-body font-medium text-ink">“{r.body}”</span>
            <span className="text-meta text-blueSlate-500 ml-auto">{r.createdAt}</span>
          </div>
          <p className="text-meta text-blueSlate-700 mt-2">
            {r.buyer}
            {productName ? ` · purchased ${productName} ×1` : ''}
          </p>
          {r.sellerComment ? (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-blueSlate-200">
              <p className="text-meta font-semibold text-ink">Seller</p>
              <p className="text-body text-blueSlate-700 mt-0.5">{r.sellerComment.text}</p>
              <p className="text-meta text-blueSlate-500 mt-1">{r.sellerComment.at}</p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
