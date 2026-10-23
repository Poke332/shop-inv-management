/**
 * Seed: StockSnapshot audit rows (ARCHITECTURE §4.1 / §4.2).
 * The entity "stock" is the audit view of stock changes for the §4.2 stock rows:
 * each product's init row + the rows that explain today's quantity
 * (order-decrement / manual-set).
 *
 * @typedef {Object} StockSnapshot
 * @property {string} productId
 * @property {number} quantity
 * @property {string} source  "order-decrement" | "manual-set" | "init"
 * @property {string} updatedAt
 */

/** @type {StockSnapshot[]} */
export const stock = [
  // §4.2 stock rows: P-231 (34), P-198 (5, LOW), P-140 (3, low), P-087 (2, low),
  // P-111 (12), P-064 (0, OUT), P-071 (40) — plus an out-of-stock history row.
  { productId: 'P-231', quantity: 40, source: 'init', updatedAt: '02 Sep 2026 09:00' },
  { productId: 'P-231', quantity: 37, source: 'order-decrement', updatedAt: '12 Sep 2026 15:20' },
  { productId: 'P-231', quantity: 34, source: 'order-decrement', updatedAt: '19 Sep 2026 12:04' },
  { productId: 'P-198', quantity: 50, source: 'init', updatedAt: '21 Jul 2026 09:00' },
  { productId: 'P-198', quantity: 10, source: 'order-decrement', updatedAt: '10 Sep 2026 11:00' },
  { productId: 'P-198', quantity: 5, source: 'manual-set', updatedAt: '14 Sep 2026 08:30' },
  { productId: 'P-140', quantity: 25, source: 'init', updatedAt: '05 Jul 2026 09:00' },
  { productId: 'P-140', quantity: 3, source: 'manual-set', updatedAt: '15 Sep 2026 09:45' },
  { productId: 'P-087', quantity: 30, source: 'init', updatedAt: '18 Jun 2026 09:00' },
  { productId: 'P-087', quantity: 2, source: 'order-decrement', updatedAt: '18 Sep 2026 09:11' },
  { productId: 'P-111', quantity: 24, source: 'init', updatedAt: '02 Jun 2026 09:00' },
  { productId: 'P-111', quantity: 12, source: 'order-decrement', updatedAt: '16 Sep 2026 13:40' },
  { productId: 'P-064', quantity: 8, source: 'init', updatedAt: '12 May 2026 09:00' },
  { productId: 'P-064', quantity: 8, source: 'order-decrement', updatedAt: '17 Sep 2026 16:20' },
  { productId: 'P-064', quantity: 0, source: 'manual-set', updatedAt: '17 Sep 2026 16:21' },
  { productId: 'P-071', quantity: 120, source: 'init', updatedAt: '20 May 2026 09:00' },
  { productId: 'P-071', quantity: 40, source: 'order-decrement', updatedAt: '18 Sep 2026 07:42' },
];
