/**
 * mockApi section: cart — the CartStore exception (ARCHITECTURE §4.3).
 *
 * Cart lines are CLIENT-SESSION state, NOT part of the shared in-memory store:
 * this module keeps its own line array so the cart survives page navigation
 * within a session but (per the §1 V1 decision, session-based persistence with
 * no cross-device sync) refreshes empty. Line ids are stable so setQty /
 * removeLine target one line by id.
 *
 * P2b ruling (ARCHITECTURE §4.5): the cart stays OUT of the durable store —
 * the versioned localStorage snapshot persists only the 5 mutable slices
 * (products, orders, reviews, users, stock). Cart session semantics are P4's
 * concern; this module deliberately does NOT read or write the snapshot key.
 *
 * The §4.2 mock session (seeded so cart + checkout render out of the box):
 * P-231 ×1 @ 1 290 000 + P-198 ×1 @ 380 000 ("Low · 5 left" hint) →
 * subtotal Rp 1.670.000.
 */

import { productById, nowStamp } from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 100 + Math.floor(Math.random() * 150)));

export const failure = { on: false };
function injected() {
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
/** @type {Array<{lineId:string, productId:string, qty:number}>} */
const lines = [
  { lineId: 'cl-1', productId: 'P-231', qty: 1 },
  { lineId: 'cl-2', productId: 'P-198', qty: 1 },
];
let seq = 2;

/** Enriched line: cart line + product snapshot (name / price / stock for the UI). */
function enrich() {
  return lines.map((l) => {
    const p = productById(l.productId);
    return {
      ...l,
      name: p ? p.name : 'Unknown product',
      price: p ? p.price : 0,
      stock: p ? p.stock : 0,
    };
  });
}

function subtotal() {
  return lines.reduce((s, l) => {
    const p = productById(l.productId);
    return s + (p ? p.price * l.qty : 0);
  }, 0);
}

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
    if (n === 0) lines.splice(lines.findIndex((l) => l.lineId === lineId), 1);
    else {
      const l = lines.find((row) => row.lineId === lineId);
      if (!l) {
        const err = new Error(`Cart line not found: ${lineId}`);
        err.status = 404;
        throw err;
      }
      l.qty = n;
    }
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
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
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
  },

  /**
   * Client-session read: the current cart (cart page + checkout order panel).
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async getCart() {
    await delay();
    return { lines: clone(enrich()), count: lines.reduce((s, l) => s + l.qty, 0), subtotal: subtotal() };
  },

  /**
   * Called by the checkout receipt step: clears the cart on successful order
   * (the §P4 "on success: cart clears, receipt shown" flow).
   * @returns {Promise<{lines: object[], count:number, subtotal:number}>}
   */
  async clearCart() {
    lines.length = 0;
    return { lines: [], count: 0, subtotal: 0 };
  },
};

// The mock session cart's timestamp helper (receipt "placed" line, optional UI).
export { nowStamp };
