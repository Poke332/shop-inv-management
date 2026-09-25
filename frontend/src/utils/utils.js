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
