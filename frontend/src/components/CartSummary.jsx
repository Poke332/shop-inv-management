import { useNavigate } from 'react-router'

import { formatIdr } from '../utils/utils.js'

/**
 * The cart summary panel (docs/cart "CartSummary", 320px, blueSlate-50):
 * Subtotal label + 20/28 w600 value (the store's live subtotal), the
 * payment meta line ("Payment is chosen at checkout — your order settles
 * as pending, 'to be settled'."), the "Proceed to checkout →" CTA
 * (enabled only when ≥1 line AND no unresolved stock conflict), and the
 * "Continue shopping" link. Desktop-only — the cart page renders the
 * sticky bottom bar in its place on <768px. Presentational: the parent
 * passes the derived enable/conflict state + the checkout entry handler.
 * @param {{subtotal: number, loading: boolean, disabled: boolean,
 *   disabledReason: (string|null), onCheckout: () => void}} props
 * @returns {object} the panel.
 */
export function CartSummary({ subtotal, loading, disabled, disabledReason, onCheckout }) {
  const navigate = useNavigate()
  return (
    <aside
      aria-label="Order summary"
      className="hidden md:flex w-[320px] flex-none flex-col bg-surface border border-blueSlate-200 rounded-xl p-card-padding"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-meta text-blueSlate-700">Subtotal</span>
        <span className="text-[20px] leading-7 font-semibold text-ink">
          {loading ? '…' : formatIdr(subtotal)}
        </span>
      </div>
      <p className="text-meta text-blueSlate-700 mt-2 mb-5">
        Payment is chosen at checkout — your order settles as pending, "to be settled".
      </p>

      {!loading ? (
        <div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onCheckout()
              navigate('/checkout')
            }}
            className="btn-primary w-full"
          >
            Proceed to checkout →
          </button>
          {disabledReason ? (
            <p className="text-meta text-strawberryRed-600 mt-2">{disabledReason}</p>
          ) : null}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-meta font-medium text-atomicTangerine-600 hover:underline"
            >
              Continue shopping
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
