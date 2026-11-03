/**
 * The SINGLE shared mock store (ARCHITECTURE §4.3 ruling + the durable-store
 * ruling §4.5).
 *
 * Every reading/writing mockApi function (api/*.js) operates on the arrays
 * below, so a mutation is immediately visible to the next read on any other
 * page. The store is DURABLE: the 5 mutable slices (products, orders,
 * reviews, users, stock) hydrate from a VERSIONED localStorage snapshot
 * (persistence.js) when a valid one exists, and every writing mockApi fn
 * commits the slices back (commitStore) after its in-memory mutation — so
 * data edits RETAIN across reloads instead of resetting to the fixed dummy
 * data. A corrupt / version-mismatched snapshot falls back to the pristine
 * seeds and the stale key is cleared.
 *
 * Deliberately NOT part of this store:
 *  - categories — static seed content, no category CRUD in v1 (api/categories.js
 *    reads seed/categories.js directly; there is nothing to persist)
 *  - CartStore — client-side SESSION state (api/cart.js): the cart refreshes
 *    empty and stays empty on reload, by design
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
 */

import { products } from './seed/products.js';
import { orders } from './seed/orders.js';
import { reviews } from './seed/reviews.js';
import { users } from './seed/users.js';
import { stock } from './seed/stock.js';
import { readSnapshot, clearSnapshot, writeSnapshot } from './persistence.js';

// Deep-clone at module load: the seed modules stay pristine; the store owns its
// own copies and mutates only those.
const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

/** Pristine seed clones — the fallback source + what resetData() re-emits. */
const seedProducts = clone(products);
const seedOrders = clone(orders);
const seedReviews = clone(reviews);
const seedUsers = clone(users);
const seedStock = clone(stock);

/**
 * Hydration: a valid persisted snapshot — version match + shape check +
 * JSON.parse OK (persistence.js) — wins over the pristine seeds. Otherwise
 * the seeds are used and the stale/corrupt key is cleared. When localStorage
 * is absent (the node smoke test) every persistence helper no-ops and this
 * is a plain seed load.
 */
const snapshot = readSnapshot();
// a null snapshot means version-mismatch, malformed shape, or corrupt JSON — discard the key
if (snapshot === null) clearSnapshot(); // stale/corrupt key → remove (no-op without localStorage)

/** The live products slice (persisted snapshot when valid, else the seed clone). */
export const storeProducts = snapshot ? snapshot.slices.products : seedProducts;
/** The live orders slice. */
export const storeOrders = snapshot ? snapshot.slices.orders : seedOrders;
/** The live reviews slice. */
export const storeReviews = snapshot ? snapshot.slices.reviews : seedReviews;
/** The live users slice. */
export const storeUsers = snapshot ? snapshot.slices.users : seedUsers;
/** The live stock-snapshot audit slice. */
export const storeStock = snapshot ? snapshot.slices.stock : seedStock;

// ---- lookup helpers ---------------------------------------------------------

/**
 * Find a product by its id (e.g. "P-231").
 * @param {string} id
 * @returns {object|undefined} the product record.
 */
export function productById(id) {
  return storeProducts.find((p) => p.id === id);
}

/**
 * Find an order by its id (e.g. "WB-1042").
 * @param {string} id
 * @returns {object|undefined} the order record.
 */
export function orderById(id) {
  return storeOrders.find((o) => o.id === id);
}

/**
 * Find a review by its id (e.g. "R-0001").
 * @param {string} id
 * @returns {object|undefined} the review record.
 */
export function reviewById(id) {
  return storeReviews.find((r) => r.id === id);
}

/**
 * Find a user by their §4.2 username (e.g. "buyer_102").
 * @param {string} username
 * @returns {object|undefined} the user record.
 */
export function userByUsername(username) {
  return storeUsers.find((u) => u.username === username);
}

// ---- durability: commit / reset (ARCHITECTURE §4.5) --------------------------

/**
 * Commit the 5 mutable slices to the versioned localStorage key (synchronous —
 * the payload is small: 48 products, ~6 orders, 128 reviews, 128 users, ~20
 * audit rows). Called by every writing mockApi fn AFTER its in-memory
 * mutation; no-op when localStorage is unavailable.
 * @returns {void}
 */
export function commitStore() {
  writeSnapshot({
    products: storeProducts,
    orders: storeOrders,
    reviews: storeReviews,
    users: storeUsers,
    stock: storeStock,
  });
}

/**
 * Re-seed the store in place (api modules hold references to these very
 * arrays) + clear the storage key + re-emit the pristine snapshot back to
 * storage so the key always mirrors the live store. Used by the mockApi
 * `resetData()` escape hatch (API-only; a dev-only reset button may hook it).
 * @returns {void}
 */
export function resetStore() {
  clearSnapshot();
  const s = {
    products: clone(seedProducts),
    orders: clone(seedOrders),
    reviews: clone(seedReviews),
    users: clone(seedUsers),
    stock: clone(seedStock),
  };
  storeProducts.splice(0, storeProducts.length, ...s.products);
  storeOrders.splice(0, storeOrders.length, ...s.orders);
  storeReviews.splice(0, storeReviews.length, ...s.reviews);
  storeUsers.splice(0, storeUsers.length, ...s.users);
  storeStock.splice(0, storeStock.length, ...s.stock);
  registerSeq = nextRegisterSeq(seedUsers);
  commitStore();
}

// ---- §4.3 mutation helpers --------------------------------------------------

const ORDER_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

/**
 * The "19 Sep 2026 12:04"-style display timestamp matching the seed rows.
 * @returns {string}
 */
export function nowStamp() {
  // "19 Sep 2026 12:04" style, matching the seed timestamps' display shape
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * createOrder: add the order row + decrement product.stock per line, and
 * append a StockSnapshot audit row per line.
 * @param {object} order  the full order record (see seed/orders.js shape).
 * @returns {void}
 */
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
  commitStore(); // the write path commits durably after its mutation
}

/**
 * advanceOrderStatus: move the order's status forward one step
 * (forward-only v1: pending → processing → shipped → delivered).
 * @param {string} orderId
 * @param {string} status  the next status in the flow
 * @returns {object|null} the updated order, or null when the order / step is unknown.
 */
export function storeAdvanceOrder(orderId, status) {
  const order = orderById(orderId);
  if (!order) return null;
  const target = ORDER_FLOW[ORDER_FLOW.indexOf(status)];
  if (target === undefined) return null;
  order.status = target;
  order.updatedAt = nowStamp();
  commitStore();
  return order;
}

/**
 * setStock: set the product's stock + append a StockSnapshot audit row.
 * @param {string} productId
 * @param {number} quantity  the new stock level (non-negative).
 * @returns {object|null} the updated product, or null when unknown.
 */
export function storeSetStock(productId, quantity) {
  const p = productById(productId);
  if (!p) return null;
  p.stock = quantity;
  storeStock.push({ productId, quantity, source: 'manual-set', updatedAt: nowStamp() });
  commitStore();
  return p;
}

/**
 * submitReview: add a public review (auto-approve) + gate the order's
 * reviewed list.
 * @param {object} review  the new review record (seed/reviews.js shape).
 * @param {string} orderId  the order the review was filed under.
 * @returns {object} the review record.
 */
export function storeSubmitReview(review, orderId) {
  storeReviews.unshift(review);
  const order = orderById(orderId);
  if (order && !order.reviewed.includes(review.productId)) order.reviewed.push(review.productId);
  commitStore();
  return review;
}

/**
 * setReviewHidden: flip the review's state between "public" and "hidden".
 * @param {string} reviewId
 * @param {boolean} hidden
 * @returns {object|null} the updated review, or null when unknown.
 */
export function storeSetReviewHidden(reviewId, hidden) {
  const r = reviewById(reviewId);
  if (!r) return null;
  r.state = hidden ? 'hidden' : 'public';
  commitStore();
  return r;
}

/**
 * setSellerComment: set/clear the seller's reply (empty text clears it).
 * @param {string} reviewId
 * @param {string} text  the reply body; empty/null clears the comment.
 * @returns {object|null} the updated review, or null when unknown.
 */
export function storeSetSellerComment(reviewId, text) {
  const r = reviewById(reviewId);
  if (!r) return null;
  if (text === '' || text == null) {
    delete r.sellerComment;
  } else {
    r.sellerComment = { text, at: nowStamp() };
  }
  commitStore();
  return r;
}

/**
 * setUserRole: update the user's role (user-dashboard role select).
 * @param {string} username
 * @param {string} role  the new role
 * @returns {object|null} the updated user, or null when unknown.
 */
export function storeSetUserRole(username, role) {
  const u = userByUsername(username);
  if (!u) return null;
  u.role = role;
  commitStore();
  return u;
}

/**
 * setUserActive: the user-dashboard disable/enable toggle
 * (a disabled login -> 403).
 * @param {string} username
 * @param {boolean} active
 * @returns {object|null} the updated user, or null when unknown.
 */
export function storeSetUserActive(username, active) {
  const u = userByUsername(username);
  if (!u) return null;
  u.active = active;
  commitStore();
  return u;
}

/**
 * createProduct: insert a new product (id generated from the store's max id).
 * @param {object} form  the product form (name/brand/category/price/stock/specs…).
 * @returns {object} the created product record.
 */
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
  commitStore();
  return p;
}

/**
 * updateProduct: upsert an existing product (specs + stock editable).
 * @param {string} id  the product id.
 * @param {object} form  the product form fields.
 * @returns {object|null} the updated product, or null when unknown.
 */
export function storeUpdateProduct(id, form) {
  const p = productById(id);
  if (!p) return null;
  Object.assign(p, form, { id });
  storeStock.push({ productId: id, quantity: p.stock, source: 'manual-set', updatedAt: nowStamp() });
  commitStore();
  return p;
}

// ---- register (user creation) ----------------------------------------------

// Derive the seq from the CURRENT store so reloaded/snapshotted
// registrations can't re-issue a username an earlier session already took
// (buyer_9NN slots are also claimed by the synthesized seed buyers).
/**
 * Derive the next buyer_(9NN) register sequence from the user rows.
 * @param {object[]} userRows  the live user slice.
 * @returns {number}
 */
function nextRegisterSeq(userRows) {
  return userRows.reduce((m, u) => {
    const match = /^buyer_(9\d\d)$/.exec(u.username);
    return match ? Math.max(m, Number(match[1]) - 900) : m;
  }, 0);
}

let registerSeq = nextRegisterSeq(storeUsers);

/**
 * register: create the buyer user (§4.2 mock-credentials table).
 * @param {{username: string, email: string, password: string}} payload
 * @returns {object} the created user, or {error: number, message: string}
 *   when the email already exists (409).
 */
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
  commitStore();
  return u;
}
