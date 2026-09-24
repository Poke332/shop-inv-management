/**
 * mockApi section: orders (ARCHITECTURE §4.3 rows createOrder / getMyOrders /
 * submitReview / getOrders / advanceOrderStatus). Wired to the shared store.
 *
 * createOrder mutation semantics (§4.3): adds the order row + decrements
 * product.stock per line (via store.storeCreateOrder). Stock is validated FIRST —
 * a 409 stock-conflict drives the checkout alt-flow 3a (conflicting line tinted,
 * "Update quantities & retry", no state change). The order id is CLIENT-GENERATED
 * for idempotent retry (alt-flow 5a): if the id already exists in the store, the
 * existing order is returned instead of creating a duplicate.
 *
 * Tab counts on Ongoing Orders are DERIVED from the store (single source of
 * truth) — the §4.2 "All 42 / Pending 9 / …" figures are the mockup's illustrative
 * queue counts, like the search "128 results"; the live view renders what the
 * store holds.
 */

import {
  orderById,
  nowStamp,
  productById,
  storeAdvanceOrder,
  storeCreateOrder,
  storeOrders,
  storeReviews,
  storeSubmitReview,
} from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (orders)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/** The mock "logged-in buyer" sees both §4.2 buyer handles (orders-placed mockup
 *  renders WB-1042 jordan.wjy + WB-0987 buyer_102 under the same account). */
const MOCK_BUYERS = ['jordan.wjy', 'buyer_102'];
const ORDER_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

export const mockApiOrders = {
  /**
   * POST /orders — checkout.
   * @param {{id:string, buyer?:string, buyerContact?:object, shippingAddress?:object,
   *         paymentMethod:string, lines: Array<{productId:string, qty:number}>,
   *         shipping?:number}} payload
   * @returns {Promise<import('../seed/orders.js').Order>} rejects 409 on stock
   *   conflict (err.code = 'STOCK_CONFLICT', err.conflicts = [{productId, available, requested}]).
   */
  async createOrder(payload) {
    const fail = injected();
    await delay();
    if (fail) throw fail;

    // Idempotent retry: same client order id → return the existing order (alt-flow 5a).
    const existing = orderById(payload.id);
    if (existing) return clone(existing);

    // Stock validated FIRST — conflict before any mutation (alt-flow 3a).
    const conflicts = [];
    for (const line of payload.lines) {
      const p = productById(line.productId);
      const available = p ? p.stock : 0;
      if (available < line.qty) {
        conflicts.push({ productId: line.productId, available, requested: line.qty });
      }
    }
    if (conflicts.length) {
      const err = new Error('Stock conflict — update quantities & retry');
      err.status = 409;
      err.code = 'STOCK_CONFLICT';
      err.conflicts = conflicts;
      throw err;
    }

    // Snapshot line unit prices from the current catalog at order time.
    const lines = payload.lines.map((l) => {
      const p = productById(l.productId);
      const unitPrice = p ? p.price : 0;
      return {
        productId: l.productId,
        name: p ? p.name : 'Unknown product',
        unitPrice,
        qty: l.qty,
        amount: unitPrice * l.qty,
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const shipping = Number(payload.shipping) || 0;

    const order = {
      id: payload.id,
      buyer: payload.buyer || 'jordan.wjy',
      buyerContact: payload.buyerContact || null,
      shippingAddress: payload.shippingAddress || null,
      paymentMethod: payload.paymentMethod || 'card',
      createdAt: nowStamp(),
      status: 'pending',
      lines,
      subtotal,
      shipping,
      total: subtotal + shipping,
      reviewed: [],
    };
    storeCreateOrder(order); // add row + decrement stock + audit rows (store.js)
    return clone(order);
  },

  /**
   * GET /orders/mine — orders-placed (the mock buyer's history, newest first).
   * @returns {Promise<import('../seed/orders.js').Order[]>}
   */
  async getMyOrders() {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    return clone(
      storeOrders
        .filter((o) => MOCK_BUYERS.includes(o.buyer))
        .sort((a, b) => (a.id < b.id ? 1 : -1)),
    );
  },

  /**
   * POST /orders/:id/reviews — orders-placed review form.
   * @param {string} orderId
   * @param {string} productId
   * @param {number} rating  1–5
   * @param {string} [comment]
   * @returns {Promise<import('../seed/reviews.js').Review>}
   */
  async submitReview(orderId, productId, rating, comment) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    if (rating < 1 || rating > 5) {
      const err = new Error('Rating must be 1–5');
      err.status = 400;
      throw err;
    }
    const nextNum = storeReviews.length + 1;
    const review = {
      id: `R-${String(nextNum).padStart(4, '0')}`,
      productId,
      buyer: 'buyer_102',
      orderId: `#${orderId}`,
      rating,
      body: comment || '',
      state: 'public', // round-6: public on submission (auto-approve)
      createdAt: nowStamp(),
    };
    storeSubmitReview(review, orderId);
    return clone(review);
  },

  /**
   * GET /ops/orders?status= — ongoing-orders queue (staff/manager/admin).
   * @param {string} [statusTab]  "pending" | "processing" | "shipped" | "delivered";
   *   undefined/"all" = the full queue.
   * @returns {Promise<{items: object[], tabs: Record<string, number>}>}
   */
  async getOrders(statusTab) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const counts = { all: storeOrders.length, pending: 0, processing: 0, shipped: 0, delivered: 0 };
    for (const o of storeOrders) counts[o.status] += 1;
    let items = [...storeOrders];
    if (statusTab && statusTab !== 'all') items = items.filter((o) => o.status === statusTab);
    items.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)); // oldest first (queue sort)
    return { items: clone(items), tabs: counts };
  },

  /**
   * PATCH /orders/:id/status — forward-only v1 (pending → processing → shipped → delivered).
   * @param {string} id
   * @param {string} status  the NEXT status in the machine
   * @returns {Promise<import('../seed/orders.js').Order>}
   */
  async advanceOrderStatus(id, status) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const order = orderById(id);
    if (!order) {
      const err = new Error(`Order not found: ${id}`);
      err.status = 404;
      throw err;
    }
    const cur = ORDER_FLOW.indexOf(order.status);
    const next = ORDER_FLOW.indexOf(status);
    if (next !== cur + 1) {
      const err = new Error(`Cannot advance ${order.status} → ${status} (forward-only, one step)`);
      err.status = 409;
      throw err;
    }
    const updated = storeAdvanceOrder(id, status);
    return clone(updated);
  },
};
