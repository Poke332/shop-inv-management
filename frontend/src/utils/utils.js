/**
 * Shared storefront utility helpers + category data maps.
 *
 * Code-org rule: non-component helpers and small shared data maps live in a
 * single `utils/utils.js` (NOT inside a component file). Components import
 * from here.
 */

/** 4:3 category-keyed gradient tiles, with a fallback for unknown slugs. */
export const CATEGORY_TILE = {
  audio: 'tile-audio',
  'smart-home': 'tile-smart-home',
  gaming: 'tile-gaming',
  laptops: 'tile-laptops',
  accessories: 'tile-accessories',
  wearables: 'tile-wearables',
}

/** Category labels for the card subline (docs/categories seed). */
export const CATEGORY_LABEL = {
  audio: 'Audio',
  'smart-home': 'Smart Home',
  gaming: 'Gaming',
  laptops: 'Laptops & PC',
  accessories: 'Accessories',
  wearables: 'Wearables',
}

/**
 * The two-stop gradient families behind the .tile-<category> CSS classes
 * (mirror of the tokens.css component layer). The product-details gallery
 * renders miniature gradient-thumb variants of the SAME family (per-index
 * angle shift) via inline styles, so it needs the stops in JS.
 */
export const CATEGORY_GRADIENT = {
  audio: ['var(--tuscanSun-50)', 'var(--tuscanSun-400)'],
  'smart-home': ['var(--seagrass-50)', 'var(--seagrass-400)'],
  gaming: ['var(--atomicTangerine-50)', 'var(--atomicTangerine-400)'],
  laptops: ['var(--blueSlate-50)', 'var(--blueSlate-400)'],
  accessories: ['var(--carrotOrange-50)', 'var(--carrotOrange-400)'],
  wearables: ['var(--strawberryRed-50)', 'var(--strawberryRed-400)'],
}

/**
 * One-line Indonesian price format: 1290000 -> "Rp 1.290.000".
 * @param {number} n  integer IDR.
 * @returns {string}
 */
export function formatIdr(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

/** Discount percent (e.g. P-231: -15% chip). @param {object} p  @returns {number} */
export function discountPercent(p) {
  if (!p.onSale || !p.originalPrice) return 0
  return Math.round((1 - p.price / p.originalPrice) * 100)
}

/**
 * Toast seam: `fireToast({ tone, text, actionLabel, to })` posts a window
 * event that the StorefrontLayout host renders. Both callers (the card
 * add-to-cart and the product-details add) share that host.
 * @param {{tone:'success'|'error', text:string, actionLabel?:string, to?:string}} t
 */
export function fireToast(t) {
  window.dispatchEvent(new CustomEvent('sunset:toast', { detail: t }))
}

/**
 * Payment-method meta (checkout step 3 + receipt summary line): label,
 * radio-card subtitle, and the order-record line shown on the receipt.
 * @type {object}
 */
export const PAYMENT_METHODS = {
  card: { label: 'Card', sub: 'Visa · Mastercard · JCB — charge on delivery' },
  bank_transfer: { label: 'Bank transfer', sub: 'VA number generated after the order is placed' },
  qris: { label: 'QRIS', sub: 'Scan & pay from any e-wallet app' },
}

/**
 * The 4-step order machine, in forward-only order (order status chips,
 * the order-detail timeline, and the "current step" math all index it).
 * @type {string[]}
 */
export const ORDER_FLOW = ['pending', 'processing', 'shipped', 'delivered']

/**
 * Client-generated order id (the idempotent-retry contract): stable per
 * checkout attempt so a failed submit can be retried without duplicating.
 * @returns {string} e.g. "WB-a1b2c3d4"
 */
export function generateOrderNumber() {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `WB-${suffix}`
}

/**
 * Loose phone check: digits and the "+" marker only, at least 8 digits.
 * @param {string} s
 * @returns {boolean}
 */
export function isValidPhone(s) {
  const v = (s || '').trim()
  return /^[+\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 8
}

/**
 * Loose email check (the checkout personal-info field): one non-space
 * segment before an @, one dot-carrying segment after it.
 * @param {string} s
 * @returns {boolean}
 */
export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim())
}

/**
 * Group a card number into 4-digit blocks ("4444 2222 1111 9999"),
 * masking to the last four digits ("•••• 9999") for the receipt line.
 * @param {string} raw  digits as typed.
 * @param {boolean} [masked]  when true, keep only the last four visible.
 * @returns {string}
 */
export function formatCardNumber(raw, masked = false) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (masked) {
    const last = digits.slice(-4)
    return `${'•••• '.repeat(Math.max(0, Math.floor((digits.length - 4) / 4)))}${last}`
  }
  // space-separated 4-digit blocks (a trailing partial group stays unspaced)
  return digits.replace(/(\d{4})/g, '$1 ').trim()
}

/**
 * "Est. arrival" window for the receipt: +2 days from now, same display
 * shape as the store timestamps ("24 Sep 2026").
 * @param {Date} [from]  default now.
 * @returns {string}
 */
export function estimatedArrival(from = new Date()) {
  const d = new Date(from.getTime() + 2 * 86400000)
  const day = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).slice(3)
  return `${day}, 10:00–14:00`
}

/**
 * Product display subline ("Model · Category · Brand"): the explicit
 * `subline` field wins (the two mock-session rows carry one); otherwise
 * the first spec value stands in for the model, with the category label
 * + brand alongside.
 * @param {object} p  a product record (mockApi shape).
 * @returns {string}
 */
export function productSubline(p) {
  if (!p) return 'Unknown product'
  if (p.subline) return p.subline
  const model = p.specs && p.specs[0] ? p.specs[0].value : null
  const parts = [model || p.name, CATEGORY_LABEL[p.category] || p.category, p.brand].filter(Boolean)
  return parts.join(' · ')
}

/**
 * Low-stock flag for a cart / order row: stock known, above zero, and at
 * or under the threshold (P-198 "Low · 5 left" — threshold 5, stock 5).
 * @param {object} p  a product record (stock + lowStockThreshold).
 * @returns {boolean}
 */
export function isLowStock(p) {
  return !!p && Number(p.stock) > 0 && Number(p.stock) <= Number(p.lowStockThreshold)
}

/**
 * Status chip class per order machine state (tokens.css §6 chip set).
 * @type {object}
 */
export const ORDER_STATUS_CHIP = {
  pending: 'chip-pending',
  processing: 'chip-processing',
  shipped: 'chip-shipped',
  delivered: 'chip-delivered',
}

/**
 * The chip's state glyph (state is never color-only — label + glyph).
 * @type {object}
 */
export const ORDER_STATUS_GLYPH = {
  pending: '●',
  processing: '●',
  shipped: '●',
  delivered: '✓',
}

/**
 * The receipt's payment-method summary line (the method is recorded on the
 * order; no funds move in v1 — settlement is a later ops step).
 * @param {string} method  "card" | "bank_transfer" | "qris".
 * @param {object} [payment]  the step-3 payment form values (card number…).
 * @returns {string}
 */
export function paymentSummaryLine(method, payment = {}) {
  if (method === 'card') {
    const last = String(payment.cardNumber || '').replace(/\D/g, '').slice(-4) || '••••'
    return `Card ending in •••• ${last} — charged on delivery`
  }
  if (method === 'bank_transfer') {
    return 'Bank transfer — VA number generated after the order is placed'
  }
  return 'QRIS — QR code available once the order is confirmed'
}

/**
 * Stock status for a product record: "out" (0), "low" (0 < stock ≤ the
 * product's lowStockThreshold — 5 for every product, consistent with
 * Product Details), otherwise "in". Drives the inventory status pill and
 * the product-list badge ("In · 34" / "Low · 5" / "Out · 0").
 * @param {object} p  a product record (stock + lowStockThreshold).
 * @returns {string} "out" | "low" | "in"
 */
export function stockStatus(p) {
  if (!p) return 'out'
  const s = Number(p.stock)
  if (s === 0) return 'out'
  if (s <= Number(p.lowStockThreshold)) return 'low'
  return 'in'
}

/** The inventory status pill class per stockStatus value (text label always present). */
export const STOCK_PILL_CLASS = {
  in: 'stock-pill-in',
  low: 'stock-pill-low',
  out: 'stock-pill-out',
}

/** The inventory status pill label per stockStatus value. */
export const STOCK_PILL_LABEL = {
  in: 'In stock',
  low: 'Low',
  out: 'Out of stock',
}

/** The product-list stock badge label ("In · 34" / "Low · 5" / "Out · 0"). */
export function stockBadgeLabel(p) {
  const s = stockStatus(p)
  return `${s === 'in' ? 'In' : s === 'low' ? 'Low' : 'Out'} · ${Number(p?.stock) || 0}`
}

/**
 * The user-dashboard role-permission note shown in the role-change confirm
 * dialog (which capability the role grants).
 * @param {string} role  "buyer" | "staff" | "manager" | "admin".
 * @returns {string} the one-line note.
 */
export function roleNote(role) {
  switch (role) {
    case 'staff':
      return 'They gain order-status updates and product alerts.'
    case 'manager':
      return 'They gain product and order management.'
    case 'admin':
      return 'They gain full ops console access, including user management.'
    default:
      return 'They keep buyer-only access.'
  }
}
