import { useState } from 'react'

import { Navigate, useNavigate } from 'react-router'

import { useCart } from '../hooks/useCart.js'
import { useCheckoutWizard } from '../hooks/useCheckoutWizard.js'
import { formatIdr } from '../utils/utils.js'
import { CheckoutWizard } from '../components/CheckoutWizard.jsx'
import { OrderReview } from '../components/OrderReview.jsx'
import { PlaceOrderButton } from '../components/PlaceOrderButton.jsx'

/**
 * The checkout page (docs/checkout): the 3-step wizard + receipt view.
 * No deep-link entry — the wizard state lives in the provider context
 * above the routes, so a fresh arrival with no wizard context bounces to
 * /cart; the "Proceed to checkout" entry marks the wizard live. All four
 * states render here: the three step forms, the 3a stock-conflict state
 * (the conflicting lines stay tinted + the CTA label flips, no state
 * change), and the 5a banner (retry resubmits the same client order id).
 * Mobile <768px: single column, the order panel drops, and step 3 keeps
 * the fixed bottom CTA bar.
 */
export default function CheckoutPage() {
  const { lines, subtotal } = useCart()
  const w = useCheckoutWizard()
  const navigate = useNavigate()

  const [placing, setPlacing] = useState(false)
  // the 5a banner text + the 3a stock-conflict rows (409 err.conflicts)
  const [failMsg, setFailMsg] = useState(null)
  const [conflicts, setConflicts] = useState(null)

  // no wizard context (deep-link / refresh) → the doc bounce to /cart;
  // the receipt view is only reachable after a successful submit in this
  // session, so !active + no receipt is always a fresh arrival.
  if (!w.active && !w.receipt) {
    return <Navigate to="/cart" replace />
  }

  // an "unresolved stock conflict" = any line whose requested qty exceeds
  // the live stock (stock may have dropped since the cart was built); the
  // step-3 CTA stays enabled only when the cart is non-empty AND none.
  const conflict = lines.some((l) => l.qty > l.stock)
  const step3Enabled = lines.length > 0 && !conflict

  // 3a: a 409 keeps the SAME client order id (no state change — no order
  // row, no stock moved); the panel tints the conflicting lines + the
  // CTA label flips to "Update quantities & retry". 5a: a 5xx banner
  // offers the idempotent Retry (same order id).
  const stockConflict = failMsg?.code === 'STOCK_CONFLICT'
  const bannerText = stockConflict
    ? 'Stock conflict — some quantities could not be placed.'
    : failMsg
      ? 'Something went wrong — your order was not placed.'
      : null

  const submit = async () => {
    setPlacing(true)
    setFailMsg(null)
    setConflicts(null)
    try {
      await w.placeOrder()
    } catch (e) {
      if (e.status === 409 && e.code === 'STOCK_CONFLICT') {
        setFailMsg({ code: e.code })
        setConflicts(e.conflicts || [])
      } else {
        setFailMsg(true)
      }
    } finally {
      setPlacing(false)
    }
  }

  const placeLabel = stockConflict
    ? 'Update quantities & retry'
    : failMsg
      ? 'Retry'
      : 'Place order'

  const preview =
    w.receipt && w.receipt.previewLines?.length
      ? { lines: w.receipt.previewLines, total: w.receipt.total }
      : null

  return (
    <div className="page pt-section-rhythm pb-section-rhythm">
      <h1 className="text-h1 font-h1 text-ink mb-6">Checkout</h1>

      {bannerText ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-lg bg-strawberryRed-100 px-4 py-3 text-body text-strawberryRed-700"
        >
          <span className="flex items-center justify-between gap-4 flex-wrap">
            <span>{bannerText}</span>
            <button
              type="button"
              onClick={stockConflict ? () => setFailMsg(null) : submit}
              className="text-meta font-semibold text-strawberryRed-600 underline"
            >
              {stockConflict ? 'Dismiss' : 'Retry'}
            </button>
          </span>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-card-gutter items-stretch md:items-start">
        <CheckoutWizard
          onPlace={submit}
          placing={placing}
          placeDisabled={!step3Enabled}
          placeLabel={placeLabel}
          onEditCart={() => navigate('/cart')}
        />
        <OrderReview
          lines={lines}
          subtotal={subtotal}
          step={w.step}
          preview={preview}
          conflicts={stockConflict ? conflicts : null}
          onPlace={submit}
          placing={placing}
          placeDisabled={!step3Enabled}
          placeLabel={placeLabel}
        />
      </div>

      {/* mobile <768px: the fixed bottom CTA bar takes over on step 3 */}
      {w.step === 3 ? (
        <div
          className="sticky-cta md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="min-w-0">
            <div className="sticky-cta-label">Total (to be settled)</div>
            <div className="sticky-cta-total">{formatIdr(subtotal)}</div>
          </div>
          <PlaceOrderButton
            onClick={submit}
            placing={placing}
            disabled={!step3Enabled}
            label={placeLabel}
          />
        </div>
      ) : null}
    </div>
  )
}
