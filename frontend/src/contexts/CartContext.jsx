import {
  createContext, useCallback, useEffect, useMemo, useRef, useState,
} from 'react'

import { useLocation } from 'react-router'

import { mockApi } from '../data'
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
 * accessors live in src/hooks/ — this module keeps the two contexts + the
 * provider co-located (sanctioned multi-export module).
 */
/** The cart context value (exported so hooks/useCart.js reads the state). */
export const CartContext = createContext(null)

/** The checkout-wizard context value (exported so hooks/useCheckoutWizard.js
 * reads it). */
export const CheckoutWizardContext = createContext(null)

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
  const booted = useRef(false)

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
  }))
  const wizardRef = useRef(wizard)
  wizardRef.current = wizard
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
    })
  }, [])

  const location = useLocation()
  const inFlow = location.pathname === '/checkout' || location.pathname === '/cart'
  // Leaving the order flow (any non-cart/checkout route) drops the wizard —
  // the next arrival rebuilds from step 1 off the cart (docs "Surviving
  // state"). "Edit cart" stays inside the flow, so it preserves the state.
  useEffect(() => {
    if (!inFlow) finishWizard()
  }, [inFlow, finishWizard])

  // refresh() never rejects: a failed read (5xx) flips the error flag so
  // the cart page can render its load-failure panel + retry.
  const refresh = useCallback(async () => {
    try {
      const d = await mockApi.getCart()
      lastGood.current = d
      booted.current = true
      setCart(d)
      setCartError(false)
    } catch {
      setCartError(true)
    }
  }, [])

  useEffect(() => {
    if (!booted.current) refresh()
    // the provider is above the routes: leaving the tree (a refresh / a
    // full reload) must re-hydrate the session cart on the next mount,
    // so the boot latch resets on unmount.
    return () => {
      booted.current = false
    }
  }, [refresh])

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
      orderNumber: orderNumberRef.current,
    }),
    [wizard, beginWizard, patchWizard, finishWizard, placeOrder],
  )

  return (
    <CartContext.Provider value={cartMemo}>
      <CheckoutWizardContext.Provider value={wizardMemo}>{children}</CheckoutWizardContext.Provider>
    </CartContext.Provider>
  )
}
