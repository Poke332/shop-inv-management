/**
 * Seed: Order records (ARCHITECTURE §4.2).
 * Order line unit prices are SNAPSHOTS at order time — WB-1042's Anker line @ 280 000
 * even though the current catalog price is 380 000. `shipping` 0 renders "Free".
 *
 * The five mockup orders cover the open queue (pending/processing) plus one delivered
 * order. The three additional delivered P-231 orders (WB-0951/0922/0890) back the §4.2
 * sample reviews in reviews.js, so each review attaches to a real delivered order with a
 * P-231 line — the seed never has to synthesize an order. The unlogged queue rows carry
 * the real buyer `rian_w` (orders.buyer_id is NOT NULL, so a queue row can't be anonymous
 * at the database layer).
 *
 * @typedef {Object} OrderLine
 * @property {string} productId
 * @property {string} name  denormalized display name at order time
 * @property {number} unitPrice IDR at order time
 * @property {number} qty
 * @property {number} amount  unitPrice × qty
 *
 * @typedef {Object} Order
 * @property {string} id  "WB-1042"
 * @property {string} [buyer]  real seed user handle ("jordan.wjy", "rian_w", …)
 * @property {{name:string, email?:string, phone?:string, note?:string}} [buyerContact]
 * @property {{address:string, district:string, city:string, province:string, postalCode:string}} [shippingAddress]
 * @property {string} [paymentMethod]  "card" | "bank-transfer" | "qris"
 * @property {string} createdAt  "19 Sep 12:04"
 * @property {string} status  pending | processing | shipped | delivered
 * @property {OrderLine[]} lines
 * @property {number} subtotal
 * @property {number} shipping
 * @property {number} total
 * @property {string[]} reviewed  productIds already rated
 */

/** @type {Order[]} */
export const orders = [
  {
    id: 'WB-1042', buyer: 'jordan.wjy',
    buyerContact: { name: 'Jordan W.', email: 'jordan.wjy@mock.local', phone: '0812 3456 7890' },
    shippingAddress: { address: 'Jl. Kemang Selatan 12', district: 'Kemang', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12730' },
    paymentMethod: 'card',
    createdAt: '19 Sep 12:04', status: 'pending',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
      { productId: 'P-198', name: 'Anker 735 Power Bank 20 000 mAh', unitPrice: 280000, qty: 1, amount: 280000 },
    ],
    subtotal: 1570000, shipping: 100000, total: 1670000,
    reviewed: [],
  },
  {
    id: 'WB-1039', buyer: 'rian_w',
    createdAt: '18 Sep 09:11', status: 'processing',
    lines: [
      { productId: 'P-087', name: 'Razer BlackWidow V3', unitPrice: 240000, qty: 1, amount: 240000 },
    ],
    subtotal: 240000, shipping: 0, total: 240000,
    reviewed: [],
  },
  {
    id: 'WB-1036', buyer: 'rian_w',
    createdAt: '18 Sep 07:42', status: 'pending',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
      { productId: 'P-198', name: 'Anker 735 Power Bank 20 000 mAh', unitPrice: 380000, qty: 1, amount: 380000 },
      { productId: 'P-071', name: 'Xiaomi Mi Smart Bulb 2', unitPrice: 120000, qty: 3, amount: 360000 },
    ],
    subtotal: 2030000, shipping: 0, total: 2030000,
    reviewed: [],
  },
  {
    id: 'WB-1031', buyer: 'rian_w',
    createdAt: '17 Sep 16:20', status: 'pending',
    lines: [
      { productId: 'P-064', name: 'ASUS RT-AX58 Wi-Fi 6 Router', unitPrice: 549000, qty: 1, amount: 549000 },
    ],
    subtotal: 549000, shipping: 0, total: 549000,
    reviewed: [],
  },
  {
    id: 'WB-0987', buyer: 'buyer_102',
    createdAt: '12 Sep 2026', status: 'delivered',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
    ],
    subtotal: 1290000, shipping: 0, total: 1290000,
    reviewed: ['P-231'],
  },
  // Delivered P-231 orders that back the §4.2 sample reviews (reviews.js).
  {
    id: 'WB-0951', buyer: 'buyer_207',
    createdAt: '25 Sep 2026', status: 'delivered',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
    ],
    subtotal: 1290000, shipping: 0, total: 1290000,
    reviewed: ['P-231'],
  },
  {
    id: 'WB-0922', buyer: 'buyer_348',
    createdAt: '05 Sep 2026', status: 'delivered',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
    ],
    subtotal: 1290000, shipping: 0, total: 1290000,
    reviewed: ['P-231'],
  },
  {
    id: 'WB-0890', buyer: 'buyer_311',
    createdAt: '04 Sep 2026', status: 'delivered',
    lines: [
      { productId: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', unitPrice: 1290000, qty: 1, amount: 1290000 },
    ],
    subtotal: 1290000, shipping: 0, total: 1290000,
    reviewed: ['P-231'],
  },
];
