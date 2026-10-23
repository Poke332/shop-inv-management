/**
 * The payment-method icon row (Card / Bank transfer) — the mockup
 * set's stroke icons in tangerine, 20px. One component per file.
 * @param {string} method  "card" | "bank_transfer".
 * @returns {object} the <svg> icon.
 */
export function PaymentMethodIcon({ method }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'var(--atomicTangerine-600)',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (method === 'card') {
    return (
      <svg {...p}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </svg>
    )
  }
  if (method === 'bank_transfer') {
    return (
      <svg {...p}>
        <path d="M3 9l9-6 9 6M5 9v10M9 9v10M15 9v10M19 9v10M3 21h18" />
      </svg>
    )
  }
  return null
}
