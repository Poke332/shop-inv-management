/**
 * Seed: Review records on P-231 (ARCHITECTURE §4.2).
 * 128 total = 122 public + 6 hidden; average 4.3 (hidden reviews keep counting in
 * both the total and the average — §4.1 note). The §4.2 four samples are R-0001…R-0004
 * verbatim (buyer_102 4★ + seller comment; buyer_207 5★ + seller comment; buyer_348 3★;
 * buyer_311 2★ hidden + replacement comment). The other 124 are synthesized so the
 * distribution yields avg 4.3 / 128.
 *
 * P3 note: the newest-first public list must LEAD with the §4.2 sample rows so the
 * product-details "one public review with seller comment" (the committed mockup's
 * visible row, buyer_102 + "Thanks — firmware 2.1 improved ANC.") renders. The
 * synthesized set spans 02–28 Sep, so the two public sample rows are dated just
 * past that range (30 / 29 Sep); counts, average, hidden state, and the 409-review
 * contract are unchanged (smoke.test.js stays 32/32).
 *
 * @typedef {Object} SellerComment
 * @property {string} text
 * @property {string} at
 *
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} productId  "P-231"
 * @property {string} buyer  anonymized, "buyer_102"
 * @property {string} orderId  provenance, "#WB-0987"
 * @property {number} rating  1–5
 * @property {string} body
 * @property {string} state  "public" | "hidden"
 * @property {SellerComment} [sellerComment]
 * @property {string} createdAt  "12 Sep 2026"
 */

/** @type {import('./products.js').Product} */
// The P-231 id is referenced here; the store wires the two.
const PRODUCT_ID = 'P-231';

// The §4.2 sample rows, verbatim.
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

// Synthesized distribution so the full set is exactly:
//   5★:60 · 4★:55 · 3★:6 · 2★:5 · 1★:2  →  128 reviews, 550 rating points → 4.3 avg
// Hidden (6): R-0004 (2★) + 2×1★ + 2×2★ + 1×4★.
function synth() {
  const PRAISE = [
    'ANC is excellent for commutes', 'Sound quality surprised me', 'Battery easily lasts the day',
    'Comfortable for long wear', 'Great value at the sale price', 'Pairing was instant',
    'Case charges fast over USB-C', 'Call audio is clear', 'Multipoint switching works well',
    'Solid tap controls', 'Case is compact', 'Low-end is punchy', 'Worth every rupiah',
    'No dropouts on the bike', 'Firmware updates kept improving it', 'Fits small ears fine',
  ];
  const NEUTRAL = [
    'Sound is fine but case is bulky', 'Middling — nothing special', 'Decent for the price',
    'OK, but ANC could be stronger', 'Works, battery just okay',
  ];
  const NEGATIVE = [
    'Cracked on arrival', 'One bud stopped pairing after two weeks', 'Tight fit, uncomfortable',
    'Muffled high end for me', 'Case hinge feels loose',
  ];

  // [rating, count, state]
  const PLAN = [
    [5, 59, 'public'],
    [4, 53, 'public'],
    [4, 1, 'hidden'],
    [3, 5, 'public'],
    [2, 2, 'public'],
    [2, 2, 'hidden'],
    [1, 2, 'hidden'],
  ];

  const out = [];
  let n = 5; // R-0001…R-0004 are the samples
  for (const [rating, count, state] of PLAN) {
    for (let i = 0; i < count; i += 1) {
      n += 1;
      const day = 28 - (n % 27); // 02 Sep … 28 Sep 2026 spread
      const pool = rating >= 4 ? PRAISE : rating === 3 ? NEUTRAL : NEGATIVE;
      out.push({
        id: `R-${String(n).padStart(4, '0')}`,
        productId: PRODUCT_ID,
        buyer: `buyer_${350 + n}`,
        orderId: `#WB-${850 + n}`,
        rating,
        body: pool[(n * 7) % pool.length],
        state,
        createdAt: `${String(day).padStart(2, '0')} Sep 2026`,
      });
    }
  }
  return out;
}

/** @type {Review[]} */
export const reviews = [...SAMPLES, ...synth()];

// Sanity (development aid — the counts are part of the mockup contract):
export const REVIEW_CONTRACT = {
  total: reviews.length,                    // 128
  public: reviews.filter((r) => r.state === 'public').length, // 122
  hidden: reviews.filter((r) => r.state === 'hidden').length, // 6
  average: Math.round(
    (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
  ) / 10, // 4.3
};
