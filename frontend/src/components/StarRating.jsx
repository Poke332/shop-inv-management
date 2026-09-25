/**
 * The StarRating display (scale-agnostic: value / count / readOnly; half-star
 * rendering, filled tuscanSun-500 / empty tuscanSun-200). One component per
 * file (code-org rule).
 * @param {number} value  0–5.
 * @param {number} [count]  optional review count to render after the stars.
 * @returns {import('react').ReactElement}
 */
export function StarRating({ value, count }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  const label = count != null ? `Rated ${value} out of 5, ${count} reviews` : `Rated ${value} out of 5`
  const star = (fill, i) => (
    <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${i}`}>
          <stop offset="50%" stopColor="var(--tuscanSun-500)" />
          <stop offset="50%" stopColor="var(--tuscanSun-200)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.3 6.2 20.3l1.1-6.4L2.6 9.3l6.5-.9L12 2.5z"
        fill={fill ? 'var(--tuscanSun-500)' : 'var(--tuscanSun-200)'}
        stroke={fill ? 'var(--tuscanSun-600)' : 'var(--tuscanSun-300)'}
        strokeWidth="0.75"
      />
    </svg>
  )
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={label}
    >
      <span className="inline-flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="relative inline-block w-4 h-4">
            <span className="absolute inset-0">{star(false, i)}</span>
            {i < full ? (
              <span className="absolute inset-0">{star(true, i)}</span>
            ) : null}
            {i === full && half ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <span className="absolute inset-0">{star(true, i)}</span>
              </span>
            ) : null}
          </span>
        ))}
      </span>
      {count != null ? (
        <span className="text-meta text-blueSlate-700">
          {value.toFixed(1)} / 5 ({count} reviews)
        </span>
      ) : null}
    </span>
  )
}
