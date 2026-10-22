import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react'

import { useLocation } from 'react-router'

import { mockApi } from '../data'
import { HTTP_ENABLED } from '../data/runtime.js'
import { profile, onAuthChange } from '../data/authStorage.js'
import { CartContext, CheckoutWizardContext } from './contextObjects.js'
import { estimatedArrival, generateOrderNumber } from '../utils/utils.js'

/**
 * CartStore (ARCHITECTURE §4.3 CartStore exception): the live cart — lines,
 * count, subtotal — feeding the StorefrontHeader badge, the cart page, and
 * the checkout wizard. The lines live in the session-based mock module
 * (api/cart.js — survives refresh via the session key), so this provider
 * hydrates on mount and mirrors every mutation.
 *
 * Two op modes (the mode is per-call, so a page keeps its own UX):
 *  - optimistic (the add-to-cart default): the store — and therefore the
 *    subtotal + badge — updates in the same render; a failed op rolls back
 *    to the last confirmed shape.
 *  - pessimistic (the cart page's qty/remove default): the row stays
 *    visible until the mock confirms; a failed op leaves it in place with
 *    a per-line retry, and the store is only touched on success.
 *
 * This provider ALSO carries the checkout wizard's surviving state
 * (docs/checkout "Surviving state"): step index + the three form states
 * live in in-memory state ABOVE the routes (this provider stays mounted
 * across every route), so "Edit cart" back-and-forth at any step returns
 * to the same step with fields intact. The wizard state is NOT in the URL
 * (deep-linking /checkout is disallowed) and NOT in the cart store (the
 * cart holds lines only). Leaving the order flow entirely (any route that
 * is not /checkout or /cart) DROPS the wizard — the provider watches the
 * location and resets it, so the next arrival rebuilds from step 1 off the
 * cart. A client-generated order id is kept on a ref so a 5xx retry
 * resubmits the same id (idempotent retry).
 *
 * Code-org rule (one custom hook per file): the useCart + useCheckoutWizard
 * accessors live in src/hooks/; shared context objects live in contextObjects.js.
 */
/** The cart context value (exported so hooks/useCart.js reads the state). */
// Cart context is declared in contextObjects.js.

/** The checkout-wizard context value (exported so hooks/useCheckoutWizard.js
 * reads it). */
// Checkout context is declared in contextObjects.js.

/** The wizard's step-1 (personal) shape. */
const PERSONAL_INIT = { name: '', phone: '', email: '', note: '' }
/** The wizard's step-2 (shipping) shape. */
const SHIPPING_INIT = { address: '', district: '', city: '', province: '', postalCode: '' }
/** The wizard's step-3 (payment) shape — card preselected. */
const PAYMENT_INIT = { method: 'card', cardNumber: '', expiry: '', cvv: '', vaNumber: '' }
/** The wizard's receipt snapshot (post-success): the order record + the
 * payment form values + the estimate, captured at place time. */
const RECEIPT_INIT = null

/** Drop one line from a cart shape. */
function withoutLine(lines, lineId) {
  return lines.filter((l) => l.lineId !== lineId)
}

/** Rebuild the count + subtotal after a local (optimistic) mutation. */
function reshaped(data, lines) {
  return {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
  }
}

/**
 * The CartStore provider: hydrates from mockApi.getCart() on mount,
 * mirrors every cart mutation (optimistic or pessimistic, per call), and
 * carries the checkout wizard's step + form state for the whole order flow.
 * @param {{children: object}} props
 */
export function CartProvider({ children }) {
  // ---- the cart (CartStore) ----
  const [cart, setCart] = useState(null)
  const [cartError, setCartError] = useState(false)
  const lastGood = useRef(null)

  // The storage-level session owner the cart rows belong to (the http
  // per-buyer keys): 'guest' when signed out. The provider sits ABOVE the
  // auth provider (the main.jsx wiring), so it tracks the owner through
  // the auth storage listeners — not a context, which it can no longer
  // read. Null in the mock (single-session) data source.
  const [owner, setOwner] = useState(() => (HTTP_ENABLED ? profile()?.username || 'guest' : null))
  useEffect(() => {
    if (!HTTP_ENABLED) return undefined
    return onAuthChange(() => setOwner(profile()?.username || 'guest'))
  }, [])
  // The last non-guest owner: a same-owner re-entry (the re-sign-in after a
  // session expiry) keeps the wizard; a different owner starts one afresh.
  const lastRealOwner = useRef(null)

  // ---- the checkout wizard state (above the routes, in-memory only) ----
  const [wizard, setWizard] = useState(() => ({
    active: false, // a fresh /checkout arrival (no wizard context) bounces to /cart
    step: 1,
    personal: PERSONAL_INIT,
    personalErrors: {},
    shipping: SHIPPING_INIT,
    shippingErrors: {},
    payment: PAYMENT_INIT,
    paymentErrors: {},
    receipt: RECEIPT_INIT,
    orderNumber: null,
  }))
  const wizardRef = useRef(wizard)
  useLayoutEffect(() => { wizardRef.current = wizard }, [wizard])
  // the client order id: stable per attempt (idempotent retry on 5xx)
  const orderNumberRef = useRef(null)

  const patchWizard = useCallback((patch) => {
    setWizard((w) => ({ ...w, ...patch }))
  }, [])

  /** Mark the wizard live (the cart "Proceed to checkout" entry). Idempotent —
   * an in-flight wizard keeps its step + fields. */
  const beginWizard = useCallback(() => {
    setWizard((w) => ({ ...w, active: true }))
  }, [])

  /** Drop the wizard entirely: back to step 1, empty forms, not active,
   * the receipt snapshot cleared (the flow restarted). */
  const finishWizard = useCallback(() => {
    orderNumberRef.current = null
    setWizard({
      active: false,
      step: 1,
      personal: PERSONAL_INIT,
      personalErrors: {},
      shipping: SHIPPING_INIT,
      shippingErrors: {},
      payment: PAYMENT_INIT,
      paymentErrors: {},
      receipt: RECEIPT_INIT,
      orderNumber: null,
    })
  }, [])

  const location = useLocation()
  const inFlow = location.pathname === '/checkout' || location.pathname === '/cart'
  // Leaving the order flow (any non-cart/checkout route) drops the wizard —
  // the next arrival rebuilds from step 1 off the cart (docs "Surviving
  // state"). "Edit cart" stays inside the flow, so it preserves the state.
  // The one exception: the session-expired re-auth hop. Its navigation to
  // /login carries location.state.from pointing back into the flow, so the
  // wizard is kept for the return (the same-owner re-entry the G3 gate
  // needs); every other departure still drops it.
  const [previousInFlow, setPreviousInFlow] = useState(inFlow)
  if (inFlow !== previousInFlow) {
    setPreviousInFlow(inFlow)
    if (!inFlow) {
      const fromFlow = location.state?.from
      const reauthReturn =
        typeof fromFlow === 'string' && /^\/(cart|checkout)/.test(fromFlow)
      if (!reauthReturn) {
        setWizard({
          active: false, step: 1, personal: PERSONAL_INIT, personalErrors: {},
          shipping: SHIPPING_INIT, shippingErrors: {}, payment: PAYMENT_INIT,
          paymentErrors: {}, receipt: RECEIPT_INIT, orderNumber: null,
        })
      }
    }
  }
  useLayoutEffect(() => {
    if (!inFlow) orderNumberRef.current = null
  }, [inFlow])

  // refresh() never rejects: a failed read (5xx / unreachable store)
  // flips the error flag so the cart page can render its load-failure
  // panel + retry.
  const refresh = useCallback(async () => {
    try {
      const d = await mockApi.getCart()
      lastGood.current = d
      setCart(d)
      setCartError(false)
    } catch {
      setCartError(true)
    }
  }, [])

  // The provider mounts once (it sits above the keyed region), so the
  // hydration is owner-driven: it re-reads the rows when the session
  // owner changes. A real (non-guest) owner gets the full trio
  // {cart, lastGood, cartError} reset synchronously BEFORE the
  // re-hydrate, so the predecessor's lines are never painted into the
  // new session (and an in-flight order ships none of them). Signing
  // out / the session expiring (owner -> 'guest') does NOT re-hydrate:
  // the visible cart + wizard stay put for the session-expired banner,
  // and the same-owner re-sign-in re-hydrates them without dropping the
  // wizard. A different owner drops the wizard to step 1.
  useEffect(() => {
    if (owner !== null && owner !== 'guest') {
      setCart(null)
      lastGood.current = null
      setCartError(false)
      const sameReal = lastRealOwner.current === owner
      lastRealOwner.current = owner
      if (!sameReal) finishWizard()
      refresh()
    } else if (owner === null) {
      // the mock (single-session) data source: the one-time mount hydrate
      refresh()
    }
    // owner === 'guest' (the http sign-out / expiry): no re-hydrate
  }, [owner, refresh, finishWizard])

  /**
   * Set a line's quantity (the `mode` mirrors the cart doc: optimistic =
   * same-render store update + roll back on failure; pessimistic = store
   * updated only after the mock confirms).
   * @param {string} lineId
   * @param {number} qty
   * @param {'optimistic'|'pessimistic'} [mode='optimistic']
   * @returns {Promise<boolean>} true when the mock confirmed the value.
   */
  const setQty = useCallback(
    async (lineId, qty, mode = 'optimistic') => {
      if (mode === 'optimistic' && cart) {
        setCart(reshaped(cart, cart.lines.map((l) => (l.lineId === lineId ? { ...l, qty } : l))))
      }
      try {
        const d = await mockApi.setQty(lineId, qty)
        lastGood.current = d
        setCart(d)
        return true
      } catch {
        if (mode === 'optimistic' && lastGood.current) setCart(lastGood.current)
        return false
      }
    },
    [cart],
  )

  /**
   * Remove a line (same mode semantics as setQty).
   * @param {string} lineId
   * @param {'optimistic'|'pessimistic'} [mode='optimistic']
   * @returns {Promise<boolean>} true when the mock confirmed the removal.
   */
  const removeLine = useCallback(
    async (lineId, mode = 'optimistic') => {
      if (mode === 'optimistic' && cart) setCart(reshaped(cart, withoutLine(cart.lines, lineId)))
      try {
        const d = await mockApi.removeLine(lineId)
        lastGood.current = d
        setCart(d)
        return true
      } catch {
        if (mode === 'optimistic' && lastGood.current) setCart(lastGood.current)
        return false
      }
    },
    [cart],
  )

  /**
   * Clear the whole cart (checkout success: "order placed = items
   * consumed").
   * @returns {Promise<boolean>} true when the mock confirmed the clear.
   */
  const clear = useCallback(async () => {
    if (cart) setCart(reshaped(cart, []))
    try {
      const d = await mockApi.clearCart()
      lastGood.current = d
      setCart(d)
      return true
    } catch {
      if (lastGood.current) setCart(lastGood.current)
      return false
    }
  }, [cart])

  /**
   * Submit the order at the wizard's current form state: the client order
   * id is generated once per attempt (kept on a ref, reused on retry),
   * stock-conflict and 5xx errors are rethrown for the page to render
   * (3a / 5a). On success the cart clears + the wizard moves to the
   * receipt state carrying the order record.
   * @param {object} [extra]  optional payload fields (shipping amount…).
   * @returns {Promise<object>} the created order record.
   * @throws {Error} err.status 409 + err.conflicts on a stock conflict;
   *   5xx on a connection failure (the same order id is reusable).
   */
  const placeOrder = useCallback(async (extra = {}) => {
    if (!orderNumberRef.current) orderNumberRef.current = generateOrderNumber()
    const requestId = orderNumberRef.current
    setWizard(current => ({ ...current, orderNumber: requestId }))
    const w = wizardRef.current
    const cartLines = (lastGood.current?.lines || cart?.lines || []).map((l) => ({
      productId: l.productId,
      qty: l.qty,
    }))
    const payload = {
      id: orderNumberRef.current,
      buyerContact: {
        name: w.personal.name,
        phone: w.personal.phone,
        email: w.personal.email,
        note: w.personal.note,
      },
      shippingAddress: { ...w.shipping },
      paymentMethod: w.payment.method,
      lines: cartLines,
      ...extra,
    }
    const order = await mockApi.createOrder(payload)
    // Capture the order-review panel's step-4 content BEFORE the clear:
    // the enriched cart lines (category/name/price/subline) + the order
    // total, so the panel still renders the just-placed items after the
    // cart empties (the mockup's receipt view keeps the panel populated).
    const previewLines = (lastGood.current?.lines || cart?.lines || []).map((l) => ({
      key: l.lineId || l.productId,
      productId: l.productId,
      name: l.name,
      subline: l.subline || '',
      category: l.category,
      qty: l.qty,
      price: l.price,
      amount: l.price * l.qty,
    }))
    await clear()
    setWizard((s) => ({
      ...s,
      step: 4,
      receipt: {
        order,
        payment: { ...w.payment },
        estimate: estimatedArrival(),
        previewLines,
        total: order.total,
      },
    }))
    return order
  }, [cart, clear])

  const cartMemo = useMemo(
    () => ({
      lines: cart ? cart.lines : [],
      count: cart ? cart.count : 0,
      subtotal: cart ? cart.subtotal : 0,
      loaded: !!cart,
      error: cartError,
      refresh,
      setQty,
      removeLine,
      clear,
    }),
    [cart, cartError, refresh, setQty, removeLine, clear],
  )

  const wizardMemo = useMemo(
    () => ({
      active: wizard.active,
      step: wizard.step,
      personal: wizard.personal,
      personalErrors: wizard.personalErrors,
      shipping: wizard.shipping,
      shippingErrors: wizard.shippingErrors,
      payment: wizard.payment,
      paymentErrors: wizard.paymentErrors,
      receipt: wizard.receipt,
      beginWizard,
      patchWizard,
      finishWizard,
      placeOrder,
      orderNumber: wizard.orderNumber,
    }),
    [wizard, beginWizard, patchWizard, finishWizard, placeOrder],
  )

  return (
    <CartContext.Provider value={cartMemo}>
      <CheckoutWizardContext.Provider value={wizardMemo}>{children}</CheckoutWizardContext.Provider>
    </CartContext.Provider>
  )
}
