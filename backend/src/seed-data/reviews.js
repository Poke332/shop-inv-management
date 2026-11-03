/**
 * Seed: Review records on P-231 (ARCHITECTURE §4.2) — the four §4.2 sample rows,
 * verbatim: buyer_102 4★ + seller comment; buyer_207 5★ + seller comment; buyer_348
 * 3★; buyer_311 2★ hidden + replacement comment. No synthesized rows: this is the
 * whole review seed. Each sample's order (WB-0987/0951/0922/0890) and its buyer are
 * real seed records (orders.js / users.js), so seed.js attaches them without
 * fabricating an order or account.
 *
 * @typedef {Object} SellerComment
 * @property {string} text
 * @property {string} at
 *
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} productId  "P-231"
 * @property {string} buyer  "buyer_102"
 * @property {string} orderId  provenance, "#WB-0987"
 * @property {number} rating  1–5
 * @property {string} body
 * @property {string} state  "public" | "hidden"
 * @property {SellerComment} [sellerComment]
 * @property {string} createdAt  "12 Sep 2026"
 */

// The P-231 id is referenced here; the store wires the two.
const PRODUCT_ID = 'P-231';

// The §4.2 sample rows, verbatim — the complete (non-synthesized) review seed.
const SAMPLES = [
  {
    id: 'R-0001', productId: PRODUCT_ID, buyer: 'buyer_102', orderId: '#WB-0987',
    rating: 4, body: 'Solid build, ANC keeps up on the train…', state: 'public',
    sellerComment: { text: 'Thanks — firmware 2.1 improved ANC.', at: '30 Sep' },
    createdAt: '30 Sep 2026',
  },
  {
    id: 'R-0002', productId: PRODUCT_ID, buyer: 'buyer_207', orderId: '#WB-0951',
    rating: 5, body: 'Fast charge, great for travel', state: 'public',
    sellerComment: { text: 'We ship the 20 000 mAh variant — 36 h max.', at: '29 Sep' },
    createdAt: '29 Sep 2026',
  },
  {
    id: 'R-0003', productId: PRODUCT_ID, buyer: 'buyer_348', orderId: '#WB-0922',
    rating: 3, body: 'OK sound, case is bulkier than expected', state: 'public',
    createdAt: '10 Sep 2026',
  },
  {
    id: 'R-0004', productId: PRODUCT_ID, buyer: 'buyer_311', orderId: '#WB-0890',
    rating: 2, body: 'Arrived cracked in the mail', state: 'hidden',
    sellerComment: { text: 'Replacement shipped — order #WB-0901.', at: '16 Sep' },
    createdAt: '09 Sep 2026',
  },
];

/** @type {Review[]} */
export const reviews = SAMPLES;

// Sanity (development aid): the counts reflect the hand-authored set only.
export const REVIEW_CONTRACT = {
  total: reviews.length,                    // 4
  public: reviews.filter((r) => r.state === 'public').length, // 3
  hidden: reviews.filter((r) => r.state === 'hidden').length, // 1
  average: Math.round(
    (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
  ) / 10, // 3.5
};
