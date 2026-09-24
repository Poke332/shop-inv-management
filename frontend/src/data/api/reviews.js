/**
 * mockApi section: reviews (ARCHITECTURE §4.3 rows getProductReviews /
 * getProductReviewsAll / setReviewHidden / setSellerComment; submitReview lives in
 * the orders section as POST /orders/:id/reviews). Wired to the shared store.
 *
 * Totals recompute from the store: total = public + hidden; the average INCLUDES
 * hidden reviews (the v1 data-layer decision, §4.1 note / §1 V1 decisions).
 * getProductReviews is the public list only — hidden reviews never render on
 * Product Details (round-6).
 */

import { storeReviews, storeSetReviewHidden, storeSetSellerComment } from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (reviews)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/** Recomputed from the store for one product: { total, public, hidden, average }. */
function productReviewStats(productId) {
  const rows = storeReviews.filter((r) => r.productId === productId);
  const total = rows.length;
  const publicCount = rows.filter((r) => r.state === 'public').length;
  const hiddenCount = total - publicCount;
  // average includes hidden reviews (v1 data-layer decision)
  const average = total
    ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;
  return { total, public: publicCount, hidden: hiddenCount, average };
}

export const mockApiReviews = {
  /**
   * GET /products/:id/reviews — product-details review list.
   * @param {string} id
   * @returns {Promise<{items: object[], total:number, publicCount:number, hiddenCount:number, average:number}>}
   *   items = the PUBLIC reviews only (newest first); total/average include hidden.
   */
  async getProductReviews(id) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const items = storeReviews
      .filter((r) => r.productId === id && r.state === 'public')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
    const stats = productReviewStats(id);
    return { items: clone(items), total: stats.total, publicCount: stats.public, hiddenCount: stats.hidden, average: stats.average };
  },

  /**
   * GET /ops/reviews?product= — review panel (public + hidden, manager/admin).
   * @param {string} productId
   * @returns {Promise<{items: object[], total:number, publicCount:number, hiddenCount:number, average:number}>}
   */
  async getProductReviewsAll(productId) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const items = storeReviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
    const stats = productReviewStats(productId);
    return { items: clone(items), total: stats.total, publicCount: stats.public, hiddenCount: stats.hidden, average: stats.average };
  },

  /**
   * PATCH /reviews/:id/hidden — review panel Hide/Unhide toggle.
   * @param {string} reviewId
   * @param {boolean} hidden
   * @returns {Promise<import('../seed/reviews.js').Review>}
   */
  async setReviewHidden(reviewId, hidden) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const r = storeSetReviewHidden(reviewId, hidden);
    if (!r) {
      const err = new Error(`Review not found: ${reviewId}`);
      err.status = 404;
      throw err;
    }
    return clone(r);
  },

  /**
   * PUT /reviews/:id/seller-comment — review panel SellerCommentComposer.
   * @param {string} reviewId
   * @param {string} text  empty string clears the comment
   * @returns {Promise<import('../seed/reviews.js').Review>}
   */
  async setSellerComment(reviewId, text) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const r = storeSetSellerComment(reviewId, text);
    if (!r) {
      const err = new Error(`Review not found: ${reviewId}`);
      err.status = 404;
      throw err;
    }
    return clone(r);
  },
};
