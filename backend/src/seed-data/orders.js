/**
 * Seed: Order records (ARCHITECTURE §4.2).
 * Order line unit prices are SNAPSHOTS at order time — WB-1042's Anker line @ 280 000
 * even though the current catalog price is 380 000. `shipping` 0 renders "Free".
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
 * @property {string} [buyer]  anonymized handle ("jordan.wjy"); null for un-logged queue rows
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
    id: 'WB-1039', buyer: null,
    createdAt: '18 Sep 09:11', status: 'processing',
    lines: [
      { productId: 'P-087', name: 'Razer BlackWidow V3', unitPrice: 240000, qty: 1, amount: 240000 },
    ],
    subtotal: 240000, shipping: 0, total: 240000,
    reviewed: [],
  },
  {
    id: 'WB-1036', buyer: null,
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
    id: 'WB-1031', buyer: null,
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
];
