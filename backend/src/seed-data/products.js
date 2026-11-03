/**
 * Seed: the 12 named Product records (the §4.2 mockup set, verbatim).
 * Synthesized products were removed: the seed now covers real catalog items only.
 *
 * Prices are integer IDR (Rp 1.290.000 = 1290000). `lowStockThreshold` is 5 for
 * every product ("Only N left" pill at 1..5, "Out of stock" at 0).
 *
 * `image` is the source asset ref (/products/p-###.png, served by the
 * frontend from public/). The seed script uploads each source file to the
 * Supabase storage bucket and stores the bucket's public URL in
 * products.image, so the database always points at bucket images, never at
 * the static files (which remain only as the upload source).
 *
 * @typedef {Object} SpecPair
 * @property {string} key
 * @property {string} value
 *
 * @typedef {Object} Product
 * @property {string} id        "P-231"
 * @property {string} name
 * @property {string} brand
 * @property {string} category  "audio" | "smart-home" | "gaming" | "laptops" | "accessories" | "wearables"
 * @property {number} price      integer IDR
 * @property {number} [originalPrice] strike price when onSale
 * @property {boolean} [onSale]
 * @property {boolean} [featured]
 * @property {number} stock
 * @property {number} lowStockThreshold
 * @property {string} description
 * @property {string} image
 * @property {SpecPair[]} specs
 * @property {string} createdAt
 */

const NAMED = [
  // ---- the 12 mockup products (§4.2 table, verbatim) ----
  {
    id: 'P-231', name: 'Sony WF-C710N Wireless Earbuds', brand: 'Sony', category: 'audio',
    price: 1290000, originalPrice: 1518000, onSale: true, featured: true, stock: 34,
    lowStockThreshold: 5,
    description: 'Active noise cancellation with ambient sound mode, Bluetooth 5.3 multipoint and up to 13 hours of battery with the charging case. IPX4 water resistance for everyday use.',
    image: '/products/p-231.png',
    // specs editor pre-fill — same 6 pairs as the product-details table
    specs: [
      { key: 'Model', value: 'WF-C710N' },
      { key: 'Bluetooth', value: '5.3, multipoint' },
      { key: 'Battery', value: '13 h w/ case' },
      { key: 'ANC', value: 'yes' },
      { key: 'IP rating', value: 'IPX4' },
      { key: 'Weight', value: '5.4 g per bud' },
    ],
    createdAt: '2026-08-02T09:00:00',
  },
  {
    id: 'P-198', name: 'Anker 735 Power Bank 20 000 mAh', brand: 'Anker', category: 'accessories',
    price: 380000, featured: true, stock: 5, lowStockThreshold: 5,
    description: 'USB-C PD 140 W fast charging for laptop, tablet and phone. 20 000 mAh with dual USB-C + USB-A and live power display.',
    image: '/products/p-198.png',
    specs: [
      { key: 'Capacity', value: '20 000 mAh' },
      { key: 'Output', value: '140 W USB-C PD' },
      { key: 'Ports', value: '2× USB-C, 1× USB-A' },
      { key: 'Recharge', value: '2 h via USB-C' },
      { key: 'Weight', value: '371 g' },
      { key: 'Display', value: 'live wattage' },
    ],
    createdAt: '2026-07-21T10:00:00',
  },
  {
    id: 'P-140', name: 'Logitech MX Keys S', brand: 'Logitech', category: 'accessories',
    price: 415000, featured: true, stock: 3, lowStockThreshold: 5,
    description: 'Backlit low-profile keyboard with Smart Illumination, multi-device Magic Key and adjustable tilt for comfortable typing.',
    image: '/products/p-140.png',
    specs: [
      { key: 'Layout', value: 'ANSI, 61 keys' },
      { key: 'Lights', value: 'Smart Illumination' },
      { key: 'Battery', value: 'up to 10 days' },
      { key: 'Connect', value: 'Bluetooth + USB receiver' },
      { key: 'Weight', value: '803 g' },
      { key: 'Tilt', value: '3-level adjustable' },
    ],
    createdAt: '2026-07-05T10:00:00',
  },
  {
    id: 'P-087', name: 'Razer BlackWidow V3', brand: 'Razer', category: 'gaming',
    price: 240000, featured: true, stock: 2, lowStockThreshold: 5,
    description: 'Mechanical gaming keyboard with Razer Green switches, Chroma RGB and six dedicated macro keys.',
    image: '/products/p-087.png',
    specs: [
      { key: 'Switches', value: 'Razer Green' },
      { key: 'Layout', value: 'full-size + 6 macro' },
      { key: 'Lighting', value: 'Chroma per-key' },
      { key: 'Wrist rest', value: 'removable' },
      { key: 'Cable', value: 'detachable USB-C' },
      { key: 'Weight', value: '984 g' },
    ],
    createdAt: '2026-06-18T10:00:00',
  },
  {
    id: 'P-052', name: 'Apple MacBook Air M3 13″', brand: 'Apple', category: 'laptops',
    price: 17499000, stock: 7, lowStockThreshold: 5,
    description: 'M3 chip, 16 GB unified memory, 512 GB SSD, 13.6″ Liquid Retina display and up to 18 h battery in a 1.24 kg body.',
    image: '/products/p-052.png',
    specs: [
      { key: 'Chip', value: 'Apple M3' },
      { key: 'Memory', value: '16 GB' },
      { key: 'Storage', value: '512 GB SSD' },
      { key: 'Display', value: '13.6″ Liquid Retina' },
      { key: 'Battery', value: 'up to 18 h' },
      { key: 'Weight', value: '1.24 kg' },
    ],
    createdAt: '2026-05-30T10:00:00',
  },
  {
    id: 'P-111', name: 'JBL Charge 5 Speaker', brand: 'JBL', category: 'audio',
    price: 1899000, originalPrice: 2199000, onSale: true, stock: 12, lowStockThreshold: 5,
    description: 'Bluetooth 5.3 speaker with punchy JBL Pro sound, IP67 water/dust resistance and a 10 000 mAh power-bank function.',
    image: '/products/p-111.png',
    specs: [
      { key: 'Output', value: '40 W' },
      { key: 'Bluetooth', value: '5.3' },
      { key: 'Battery', value: '15 h, power-bank 10 000 mAh' },
      { key: 'Rating', value: 'IP67' },
      { key: 'Weight', value: '904 g' },
      { key: 'Extras', value: 'USB-C, stereo pair' },
    ],
    createdAt: '2026-06-02T10:00:00',
  },
  {
    id: 'P-064', name: 'ASUS RT-AX58 Wi-Fi 6 Router', brand: 'ASUS', category: 'smart-home',
    price: 549000, stock: 0, lowStockThreshold: 5,
    description: 'Mesh-ready Wi-Fi 6 router with 2.4 + 5 GHz bands, AiProtection and four Gigabit LAN ports.',
    image: '/products/p-064.png',
    specs: [
      { key: 'Standard', value: 'Wi-Fi 6 (802.11ax)' },
      { key: 'Bands', value: '2.4 GHz + 5 GHz' },
      { key: 'LAN', value: '4× Gigabit' },
      { key: 'Mesh', value: 'AiMesh-ready' },
      { key: 'Security', value: 'AiProtection' },
      { key: 'Weight', value: '550 g' },
    ],
    createdAt: '2026-05-12T10:00:00',
  },
  {
    id: 'P-208', name: 'Anker 65 W GaN Charger', brand: 'Anker', category: 'accessories',
    price: 259000, stock: 21, lowStockThreshold: 5,
    description: 'GaN II charger with 65 W output, one USB-C + one USB-A port and compact folding plug.',
    image: '/products/p-208.png',
    specs: [
      { key: 'Output', value: '65 W GaN II' },
      { key: 'Ports', value: '1× USB-C, 1× USB-A' },
      { key: 'Protocols', value: 'PD 3.0, QC 4.0' },
      { key: 'Efficiency', value: '95%' },
      { key: 'Weight', value: '99 g' },
      { key: 'Plug', value: 'folding, EU/US' },
    ],
    createdAt: '2026-07-28T10:00:00',
  },
  {
    id: 'P-173', name: 'Samsung Galaxy Watch6', brand: 'Samsung', category: 'wearables',
    price: 1650000, stock: 18, lowStockThreshold: 5,
    description: 'Biosensor health suite (sleep coach, stress tracking), 1.5″ AMOLED display and 3-day battery.',
    image: '/products/p-173.png',
    specs: [
      { key: 'Display', value: '1.5″ AMOLED' },
      { key: 'Sensors', value: 'bioActive, ECG' },
      { key: 'Battery', value: 'up to 3 days' },
      { key: 'Rating', value: '5 ATM' },
      { key: 'GPS', value: 'dual-band' },
      { key: 'Weight', value: '34 g' },
    ],
    createdAt: '2026-06-25T10:00:00',
  },
  {
    id: 'P-088', name: 'Razer BlackShark V2 Pro', brand: 'Razer', category: 'gaming',
    price: 450000, stock: 9, lowStockThreshold: 5,
    description: 'Wired esports headset with THX Spatial Audio, 5.0 mm drivers and Razer HyperClear mic.',
    image: '/products/p-088.png',
    specs: [
      { key: 'Driver', value: '5.0 mm' },
      { key: 'Audio', value: 'THX Spatial' },
      { key: 'Mic', value: 'HyperClear cardioid' },
      { key: 'Connection', value: 'wired 3.5 mm / USB' },
      { key: 'Rating', value: 'detachable cable' },
      { key: 'Weight', value: '270 g' },
    ],
    createdAt: '2026-06-10T10:00:00',
  },
  {
    id: 'P-071', name: 'Xiaomi Mi Smart Bulb 2', brand: 'Xiaomi', category: 'smart-home',
    price: 120000, stock: 40, lowStockThreshold: 5,
    description: 'Wi-Fi smart bulb, 16 million colors, 800 lm, works with the Mi Home app — no hub required.',
    image: '/products/p-071.png',
    specs: [
      { key: 'Output', value: '800 lm' },
      { key: 'Colors', value: '16 M' },
      { key: 'Connection', value: 'Wi-Fi 2.4 GHz' },
      { key: 'Socket', value: 'E27' },
      { key: 'Wattage', value: '9.5 W' },
      { key: 'Weight', value: '150 g' },
    ],
    createdAt: '2026-05-20T10:00:00',
  },
  {
    id: 'P-089', name: 'Logitech G Pro X Superlight', brand: 'Logitech', category: 'gaming',
    price: 999000, stock: 6, lowStockThreshold: 5,
    description: 'Wireless esports mouse at 63 g, HERO 25K sensor, 2.4 GHz LIGHTSPEED with 1 ms report rate.',
    image: '/products/p-089.png',
    specs: [
      { key: 'Sensor', value: 'HERO 25K' },
      { key: 'Weight', value: '63 g' },
      { key: 'Connection', value: 'LIGHTSPEED 2.4 GHz' },
      { key: 'Battery', value: 'up to 96 h' },
      { key: 'Polling', value: '1000 Hz' },
      { key: 'Switches', value: 'GLTA, 90 M clicks' },
    ],
    createdAt: '2026-06-05T10:00:00',
  },
];

/** @type {Product[]} */
export const products = NAMED;
