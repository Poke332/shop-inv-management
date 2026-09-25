/**
 * mockApi section: cart — the CartStore exception (ARCHITECTURE §4.3).
 *
 * Cart lines are CLIENT-SESSION state, NOT part of the shared in-memory store:
 * this module keeps its own line array so the cart survives page navigation
 * within a session but (per the §1 V1 decision, session-based persistence with
 * no cross-device sync) refreshes empty. Line ids are stable so setQty /
 * removeLine target one line by id.
 *
 * Ruling (ARCHITECTURE §4.5): the cart stays OUT of the durable store —
 * the versioned localStorage snapshot persists only the 5 mutable slices
 * (products, orders, reviews, users, stock). Cart session semantics are
 * kept client-side; this module deliberately does NOT read or write the
 * snapshot key.
 *
 * The §4.2 mock session (seeded so cart + checkout render out of the box):
 * P-231 ×1 @ 1 290 000 + P-198 ×1 @ 380 000 ("Low · 5 left" hint) →
 * subtotal Rp 1.670.000.
 */

import { productById, nowStamp } from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 100 + Math.floor(Math.random() * 150)));

/** Per-section failure-injection flag: set `.on = true` to make the NEXT
 * call of this section reject (the "error" mockup states are exercisable).
 * @type {{on: boolean}}
 */
export const failure = { on: false };
// A reload-persistent pre-arm counter makes the "cart load 5xx" state
// verifiable across a reload: a QA harness writes the key with a count
// (sessionStorage — no app code sets it), module init loads it into
// failRemaining, and each getCart consumes one. A no-op in the shipped
// app (and in node, where sessionStorage is absent).
let failRemaining = 0;
try {
  if (typeof sessionStorage !== 'undefined') {
    const n = Number(sessionStorage.getItem('sunset.failnext.cart')) || 0;
    if (n > 0) {
      failRemaining = n;
      sessionStorage.removeItem('sunset.failnext.cart');
    }
  }
} catch {
  /* node smoke test — no sessionStorage */
}
function injected() {
  if (failRemaining > 0) {
    failRemaining -= 1;
    const err = new Error('Injected mock failure (cart)');
    err.mockInjected = true;
    return err;
  }
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (cart)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---- the session cart (module singleton — this is THE CartStore data) --------
/** The session cart lines: {lineId, productId, qty} rows (module singleton). */
const SEED_LINES = [
  { lineId: 'cl-1', productId: 'P-231', qty: 1 },
  { lineId: 'cl-2', productId: 'P-198', qty: 1 },
];

// Session-based persistence (the CartStore ruling): the cart survives
// in-tab navigation AND refresh via the sessionStorage key, but dies with
// the session. Node (the smoke test) has no sessionStorage — hydration is a
// no-op there and the seeded mock session loads instead.
const CART_SESSION_KEY = 'sunset.cart';
/** Hydrate the session cart; null = fall back to the seeded mock session. */
function readSessionCart() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(CART_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.lines)) return null;
    return s.lines.filter(
      (l) => l && typeof l.lineId === 'string' && typeof l.productId === 'string' && Number.isInteger(l.qty) && l.qty > 0,
    );
  } catch {
    return null; // corrupt key — drop it, re-seed
  }
}
/** Write the live lines back to the session key (no-op without sessionStorage). */
function persistCart() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify({ lines }));
  } catch {
    /* storage unavailable — the cart keeps working in memory */
  }
}
const savedLines = readSessionCart();
const lines = savedLines
  ? savedLines
  : SEED_LINES.map((l) => ({ ...l }));
let seq = lines.reduce((m, l) => Math.max(m, Number(String(l.lineId).replace(/\D/g, '')) || 0), 0);

// Display sublines for the two seeded mock-session rows (the doc copy); every
// other product falls back to "model (first spec) · category · brand".
const SUBLINE = {
  'P-231': 'Wireless Earbuds · Audio · Sony',
  'P-198': '20 000 mAh · USB-C PD 140 W',
};
function sublineFor(p) {
  if (!p) return '';
  if (SUBLINE[p.id]) return SUBLINE[p.id];
  const model = p.specs && p.specs[0] ? p.specs[0].value : p.name;
  return [model, p.category, p.brand].filter(Boolean).join(' · ');
}

/** Enriched line: cart line + product snapshot (name / price / stock for the UI). */
function enrich() {
  return lines.map((l) => {
    const p = productById(l.productId);
    return {
      ...l,
      name: p ? p.name : 'Unknown product',
      price: p ? p.price : 0,
      stock: p ? p.stock : 0,
      lowStockThreshold: p ? p.lowStockThreshold : null,
      category: p ? p.category : null,
      subline: p ? sublineFor(p) : '',
    };
  });
}

function subtotal() {
  return lines.reduce((s, l) => {
    const p = productById(l.productId);
    return s + (p ? p.price * l.qty : 0);
  }, 0);
}

/**
 * The cart section of the mockApi facade (ARCHITECTURE §4.3 CartStore
 * exception — client-session state): addToCart / setQty / removeLine /
 * getCart / clearCart.
 * @type {object}
 */
export const mockApiCart = {
  /**
   * POST /cart/items — add a line (cart, product-details "Add to cart", main-store card CTA).
   * @param {{productId:string, qty?:number}} line
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async addToCart(line) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const existing = lines.find((l) => l.productId === line.productId);
    if (existing) existing.qty += line.qty || 1;
    else {
      seq += 1;
      lines.push({ lineId: `cl-${seq}`, productId: line.productId, qty: line.qty || 1 });
    }
    persistCart();
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
  },

  /**
   * POST /cart/items/:id/qty — set a line's quantity (0 removes the line).
   * @param {string} lineId
   * @param {number} qty
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async setQty(lineId, qty) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 0) {
      const err = new Error('Quantity must be a non-negative integer');
      err.status = 400;
      throw err;
    }
    if (n === 0) {
      lines.splice(lines.findIndex((l) => l.lineId === lineId), 1);
      persistCart();
      return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
    }
    const l = lines.find((row) => row.lineId === lineId);
    if (!l) {
      const err = new Error(`Cart line not found: ${lineId}`);
      err.status = 404;
      throw err;
    }
    // per-line stock re-validation: the server clamps to the live stock,
    // the UI diffing the returned qty against the requested one surfaces
    // the "quantity reduced" note.
    const p = productById(l.productId);
    l.qty = p ? Math.min(n, p.stock) : n;
    persistCart();
    return { lines: clone(enrich()), count: lines.reduce((s, ll) => s + ll.qty, 0), subtotal: subtotal() };
  },

  /**
   * DELETE /cart/items/:id — remove a line (trash affordance).
   * @param {string} lineId
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async removeLine(lineId) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const i = lines.findIndex((l) => l.lineId === lineId);
    if (i >= 0) lines.splice(i, 1);
    persistCart();
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
  },

  /**
   * Client-session read: the current cart (cart page + checkout order panel).
   * Failure injection arms this read so the page-level 5xx panel is
   * exercisable (the doc's "cart load 5xx" state).
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async getCart() {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
  },

  /**
   * Called by the checkout receipt step: clears the cart on successful order
   * ("on success: cart clears, receipt shown" flow).
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async clearCart() {
    lines.length = 0;
    persistCart();
    return { lines: [], count: 0, subtotal: 0 };
  },
};

// The mock session cart's timestamp helper (receipt "placed" line, optional UI).
export { nowStamp };
