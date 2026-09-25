import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { useCart } from '../hooks/useCart.js'
import { useCheckoutWizard } from '../hooks/useCheckoutWizard.js'
import { formatIdr } from '../utils/utils.js'
import { CartLine } from '../components/CartLine.jsx'
import { CartSummary } from '../components/CartSummary.jsx'

/**
 * The cart page (docs/cart): the "Cart (N items)" heading + meta, the
 * lines card (left, flex:1 — CartLine rows in insertion order, 24px
 * rhythm) + the 320px summary panel (right, desktop only); on <768px the
 * summary collapses to a sticky bottom bar ("Subtotal · [Checkout]")
 * reachable without scrolling at 390px.
 *
 * Op modes per the doc: removal is optimistic with a ~150ms fade-out
 * (the row keeps rendering while the store update lands — subtotal +
 * header badge move in the same render; a failed op rolls the store back
 * and the row keeps a per-line retry link; color-only when
 * prefers-reduced-motion). Quantity changes are pessimistic (the value
 * only lands when the mock confirms; the mock clamps to live stock — the
 * reduced-qty diff surfaces the "Only N available — quantity reduced"
 * note; a failed op shows the per-line retry link). Page-load 5xx = the
 * full-width error panel with retry.
 */
export default function CartPage() {
  const { lines, count, subtotal, loaded, error, refresh, setQty, removeLine } = useCart()
  const wizard = useCheckoutWizard()
  const navigate = useNavigate()

  // transient per-line UI: the mid-fade-out ids + their last-known lines
  // (ghost rows), the failed-op ids, and the stock-clamp notes.
  const [ghosts, setGhosts] = useState({})
  const [failed, setFailed] = useState({})
  const [clamped, setClamped] = useState({})
  const timers = useRef({})

  useEffect(() => {
    const t = timers.current
    return () => {
      Object.values(t).forEach((id) => clearTimeout(id))
    }
  }, [])

  // Re-validate the lines on every entry (stock may have dropped since the
  // cart was built) + make the "page-load 5xx" panel reachable on this
  // page: a failed re-read with no lines renders the error panel.
  useEffect(() => {
    refresh()
  }, [refresh])

  // page-level load (5xx): a failed read with no lines to show; retry
  // re-runs the re-validation.
  const loadErr = error && lines.length === 0
  const retryLoad = () => {
    setFailed({})
    refresh()
  }

  const doQty = async (line, requested) => {
    setClamped((c) => ({ ...c, [line.lineId]: undefined }))
    const ok = await setQty(line.lineId, requested, 'pessimistic')
    if (!ok) {
      setFailed((f) => ({ ...f, [line.lineId]: true }))
      return
    }
    // the mock clamps to live stock: requested above stock → the reduced
    // note (the store already holds the clamped value).
    if (requested > line.stock && line.stock > 0) {
      setClamped((c) => ({
        ...c,
        [line.lineId]: `Only ${line.stock} available — quantity reduced`,
      }))
    }
  }

  const doRemove = (line) => {
    // the row keeps rendering for the fade-out window; the optimistic
    // store op (subtotal + badge) lands in the same render.
    setGhosts((g) => ({ ...g, [line.lineId]: line }))
    setFailed((f) => ({ ...f, [line.lineId]: undefined }))
    const t = timers.current
    t[line.lineId] = setTimeout(() => {
      setGhosts((g) => {
        const next = { ...g }
        delete next[line.lineId]
        return next
      })
      delete t[line.lineId]
    }, 150)
    removeLine(line.lineId, 'optimistic').then((ok) => {
      if (!ok) {
        // the store rolled the line back — kill the fade, keep the row
        clearTimeout(t[line.lineId])
        delete t[line.lineId]
        setGhosts((g) => {
          const next = { ...g }
          delete next[line.lineId]
          return next
        })
        setFailed((f) => ({ ...f, [line.lineId]: true }))
      }
    })
  }

  const retryLine = (lineId) => {
    setFailed((f) => ({ ...f, [lineId]: undefined }))
    setGhosts((g) => {
      const next = { ...g }
      delete next[lineId]
      return next
    })
    refresh()
  }

  // "Proceed to checkout" (desktop panel + mobile bar) bounces when the
  // cart is empty or a stock conflict is unresolved; entering /checkout
  // marks the wizard live so its state survives the back-and-forth.
  const conflict = lines.some((l) => l.qty > l.stock)
  const checkoutEnabled = count > 0 && !conflict
  const disabledReason = conflict ? 'A line is out of stock — update its quantity first.' : null

  const enterCheckout = () => {
    if (checkoutEnabled) wizard.beginWizard()
  }

  const loading = !loaded && !error
  // live lines + ghost rows (a failed removal keeps its row visible)
  const ghostRows = Object.values(ghosts)
  const allRows = [
    ...lines,
    ...ghostRows.filter((g) => !lines.some((l) => l.lineId === g.lineId)),
  ]
  const showCard = allRows.length > 0 || loading

  const goCheckout = () => {
    enterCheckout()
    navigate('/checkout')
  }

  return (
    <div className="page pt-section-rhythm pb-section-rhythm">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-h1 font-h1 text-ink">Cart</h1>
        <span className="text-meta text-blueSlate-700">({count} items)</span>
      </div>

      {loadErr ? (
        <div className="state-error mb-6" role="alert">
          Something went wrong while loading your cart.{' '}
          <button type="button" className="underline font-semibold" onClick={retryLoad}>
            Try again
          </button>
        </div>
      ) : null}

      {!error && loaded && allRows.length === 0 ? (
        <div className="state-empty bg-canvas border border-blueSlate-200 rounded-xl">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--blueSlate-300)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4"
            aria-hidden="true"
          >
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h8.8a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
          </svg>
          <h2>Your cart is empty</h2>
          <p className="mb-6">Add something from the store to get started.</p>
          <Link to="/" className="btn-primary">
            Start shopping
          </Link>
        </div>
      ) : null}

      {showCard ? (
        <div className="flex flex-col md:flex-row gap-card-gutter items-start">
          {/* lines card (left, flex:1) */}
          <section
            aria-label="Cart items"
            className="flex-1 min-w-0 bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-6"
          >
            {loading ? (
              <>
                <div className="skeleton w-full" style={{ height: 108 }} />
                <div className="skeleton w-full" style={{ height: 108 }} />
              </>
            ) : (
              <ul className="flex flex-col gap-6">
                {allRows.map((line) => {
                  const live = lines.some((l) => l.lineId === line.lineId)
                  const row = live ? lines.find((l) => l.lineId === line.lineId) : line
                  return (
                    <CartLine
                      key={line.lineId}
                      line={row}
                      onQtyChange={(q) => live && doQty(row, q)}
                      onRemove={live ? () => doRemove(row) : undefined}
                      removing={!live}
                      failed={live ? !!failed[line.lineId] : true}
                      onRetry={() => retryLine(line.lineId)}
                      clampedNote={clamped[line.lineId] || null}
                    />
                  )
                })}
              </ul>
            )}
          </section>

          {/* summary panel (right, 320px, desktop) */}
          <CartSummary
            subtotal={subtotal}
            loading={loading}
            disabled={!checkoutEnabled}
            disabledReason={disabledReason}
            onCheckout={goCheckout}
          />
        </div>
      ) : null}

      {/* mobile (<768px): the summary collapses to the sticky bottom bar */}
      {showCard && !loadErr ? (
        <div className="sticky-cta md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="min-w-0">
            <div className="sticky-cta-label">Subtotal</div>
            <div className="sticky-cta-total">{loading ? '…' : formatIdr(subtotal)}</div>
          </div>
          <button
            type="button"
            disabled={!checkoutEnabled}
            onClick={goCheckout}
            aria-label="Proceed to checkout"
            className="btn-primary"
          >
            Checkout
          </button>
        </div>
      ) : null}
    </div>
  )
}
