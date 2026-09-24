/**
 * The SINGLE shared in-memory mock store (ARCHITECTURE §4.3 ruling).
 *
 * Every reading/writing mockApi function (api/*.js) operates on the arrays cloned
 * here at module load, so a mutation is immediately visible to the next read on
 * any other page. Mutations DO NOT persist across refresh — any reload re-clones
 * the pristine seed arrays (in-memory only, no localStorage for mock data):
 * refresh = fresh mockup state.
 *
 * The §4.3 mutation semantics, centralized as helpers:
 *  - createOrder  adds an order row + decrements product.stock per line
 *  - advanceOrderStatus moves an order's status forward (pending → processing →
 *    shipped → delivered; forward-only v1)
 *  - setStock sets a product's stock + appends a StockSnapshot audit row
 *  - submitReview / setReviewHidden / setSellerComment update review records
 *    (totals recompute from the store; hidden reviews keep counting in the total
 *    + the average)
 *  - setUserRole / setUserActive update the user record
 *  - createProduct / updateProduct upsert the product
 *
 * CartStore is the one exception — client-side session state, NOT part of this
 * store (it lives in api/cart.js).
 */

import { products } from './seed/products.js';
import { orders } from './seed/orders.js';
import { reviews } from './seed/reviews.js';
import { users } from './seed/users.js';
import { stock } from './seed/stock.js';

// Deep-clone at module load: the seed modules stay pristine; the store owns its
// own copies and mutates only those.
const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

/** @type {import('./seed/products.js').Product[]} */
export const storeProducts = clone(products);
/** @type {import('./seed/orders.js').Order[]} */
export const storeOrders = clone(orders);
/** @type {import('./seed/reviews.js').Review[]} */
export const storeReviews = clone(reviews);
/** @type {import('./seed/users.js').User[]} */
export const storeUsers = clone(users);
/** @type {import('./seed/stock.js').StockSnapshot[]} */
export const storeStock = clone(stock);

// ---- lookup helpers ---------------------------------------------------------

export function productById(id) {
  return storeProducts.find((p) => p.id === id);
}

export function orderById(id) {
  return storeOrders.find((o) => o.id === id);
}

export function reviewById(id) {
  return storeReviews.find((r) => r.id === id);
}

export function userByUsername(username) {
  return storeUsers.find((u) => u.username === username);
}

// ---- §4.3 mutation helpers --------------------------------------------------

const ORDER_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

export function nowStamp() {
  // "19 Sep 2026 12:04" style, matching the seed timestamps' display shape
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** createOrder: add the order row + decrement product.stock per line. */
export function storeCreateOrder(order) {
  storeOrders.unshift(order);
  for (const line of order.lines) {
    const p = productById(line.productId);
    if (p) p.stock = Math.max(0, p.stock - line.qty);
    storeStock.push({
      productId: line.productId,
      quantity: p ? p.stock : 0,
      source: 'order-decrement',
      updatedAt: nowStamp(),
    });
  }
}

/** advanceOrderStatus: move the order's status forward one step (forward-only v1). */
export function storeAdvanceOrder(orderId, status) {
  const order = orderById(orderId);
  if (!order) return null;
  const target = ORDER_FLOW[ORDER_FLOW.indexOf(status)];
  if (target === undefined) return null;
  order.status = target;
  order.updatedAt = nowStamp();
  return order;
}

/** setStock: set the product's stock + append a StockSnapshot audit row. */
export function storeSetStock(productId, quantity) {
  const p = productById(productId);
  if (!p) return null;
  p.stock = quantity;
  storeStock.push({ productId, quantity, source: 'manual-set', updatedAt: nowStamp() });
  return p;
}

/** submitReview: add a public review (auto-approve) + gate the order's reviewed list. */
export function storeSubmitReview(review, orderId) {
  storeReviews.unshift(review);
  const order = orderById(orderId);
  if (order && !order.reviewed.includes(review.productId)) order.reviewed.push(review.productId);
  return review;
}

export function storeSetReviewHidden(reviewId, hidden) {
  const r = reviewById(reviewId);
  if (!r) return null;
  r.state = hidden ? 'hidden' : 'public';
  return r;
}

export function storeSetSellerComment(reviewId, text) {
  const r = reviewById(reviewId);
  if (!r) return null;
  if (text === '' || text == null) {
    delete r.sellerComment;
  } else {
    r.sellerComment = { text, at: nowStamp() };
  }
  return r;
}

export function storeSetUserRole(username, role) {
  const u = userByUsername(username);
  if (!u) return null;
  u.role = role;
  return u;
}

export function storeSetUserActive(username, active) {
  const u = userByUsername(username);
  if (!u) return null;
  u.active = active;
  return u;
}

/** createProduct: insert a new product (id generated from the store's max id). */
export function storeCreateProduct(form) {
  const maxNum = storeProducts.reduce((m, p) => Math.max(m, Number(p.id.slice(2))), 0);
  const p = {
    ...form,
    id: `P-${String(maxNum + 1).padStart(3, '0')}`,
    stock: Number(form.stock) || 0,
    specs: (form.specs || []).map((s) => ({ key: s.key, value: s.value })),
    createdAt: nowStamp(),
  };
  storeProducts.unshift(p);
  storeStock.push({ productId: p.id, quantity: p.stock, source: 'init', updatedAt: nowStamp() });
  return p;
}

/** updateProduct: upsert an existing product (specs + stock editable). */
export function storeUpdateProduct(id, form) {
  const p = productById(id);
  if (!p) return null;
  Object.assign(p, form, { id });
  storeStock.push({ productId: id, quantity: p.stock, source: 'manual-set', updatedAt: nowStamp() });
  return p;
}

// ---- register (user creation) ----------------------------------------------

let registerSeq = 0;
export function storeRegisterUser(payload) {
  // 409 duplicate when the email already exists (the §4.2 rian@mock.local case).
  if (storeUsers.some((u) => u.email === payload.email)) {
    return { error: 409, message: 'An account with this email already exists.' };
  }
  registerSeq += 1;
  const u = {
    username: `buyer_${900 + registerSeq}`,
    email: payload.email,
    role: 'buyer',
    active: true,
    lastActiveAt: 'now',
    password: payload.password,
  };
  storeUsers.push(u);
  return u;
}
