/**
 * Seed: 48 Product records (ARCHITECTURE §4.1 / §4.2).
 * The 12 named products below are the mockup set (verbatim from §4.2); the remaining
 * 36 are synthesized to reach the 48 total that search-browse's "128 results" view
 * paginates over (8 per page; "All N products shown" exhaustion line).
 *
 * Prices are integer IDR (Rp 1.290.000 = 1290000). `lowStockThreshold` is 5 for
 * every product ("Only N left" pill at 1..5, "Out of stock" at 0).
 * `image` is the /products/p-###.png asset ref for the 12 named products; the
 * category gradient-tile key for the synthesized ones (tiles are CSS, not photos —
 * §4.1: "gradient tile key or asset ref").
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
    // the round-9 specs editor pre-fill — same 6 pairs as the product-details table
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

/** Synthesize the remaining 36 products (ids P-001…P-048 skipping the named ones). */
function synth(idNum, brand, category, name, price, stock, desc, specs) {
  return {
    id: `P-${String(idNum).padStart(3, '0')}`,
    name, brand, category, price, stock,
    lowStockThreshold: 5,
    description: desc,
    image: category, // gradient-tile key — synthesized products render as CSS tiles, not photos
    specs: specs.map((kv) => ({ key: kv[0], value: kv[1] })),
    createdAt: `2026-0${(idNum % 6) + 1}-1${(idNum % 9) % 9 + 1}T10:00:00`,
  };
}

// 36 synthesized rows across the 6 categories (6 each), brands reused from the catalog.
const SYNTH = [
  // audio
  synth(3, 'Sony', 'audio', 'Sony WH-1000XM5', 3499000, 11, 'Flagship over-ear ANC headphones with 30 h battery and multipoint Bluetooth.', [['Battery', '30 h'], ['ANC', 'yes'], ['Rating', '—'], ['Weight', '250 g']]),
  synth(7, 'JBL', 'audio', 'JBL Tune 760NC', 999000, 26, 'On-ear ANC headphones with 7 h + 52 h total battery and JBL Pure Bass sound.', [['Battery', '7 h + 52 h'], ['ANC', 'yes'], ['Rating', '—'], ['Weight', '198 g']]),
  synth(14, 'Marshall', 'audio', 'Marshall Mode Bluetooth Speaker', 849000, 14, 'Pocket-size Marshall speaker with retro look and 42 h battery in the case.', [['Output', '5 W'], ['Battery', '42 h w/ case'], ['Rating', 'IPX2'], ['Weight', '237 g']]),
  synth(26, 'Sony', 'audio', 'Sony SRS-XB23 Speaker', 749000, 8, 'Ultra-portable speaker with Extra Bass, Party Boost and IP67.', [['Output', '10 W'], ['Battery', '12 h'], ['Rating', 'IP67'], ['Weight', '370 g']]),
  synth(33, 'JBL', 'audio', 'JBL Flip 6', 1399000, 17, 'Rugged portable speaker with PartyBoost and IP67 for pool and beach.', [['Output', '30 W'], ['Battery', '12 h'], ['Rating', 'IP67'], ['Weight', '550 g']]),
  synth(44, 'Anker', 'audio', 'Anker Soundcore Motion+', 299000, 31, 'Ultra-portable 30 W speaker with dual-enclosure design and IPX7.', [['Output', '30 W'], ['Battery', '12 h'], ['Rating', 'IPX7'], ['Weight', '385 g']]),
  // smart-home
  synth(5, 'ASUS', 'smart-home', 'ASUS ZenWiFi AX (XT8)', 2899000, 6, 'Two-pack Wi-Fi 6 router with mesh roaming and AiProtection.', [['Standard', 'Wi-Fi 6'], ['Pack', '2 nodes'], ['Bands', 'dual'], ['LAN', '6× GbE'], ['Weight', '2 × 475 g']]),
  synth(17, 'Xiaomi', 'smart-home', 'Xiaomi Smart Plug 3 (EU)', 149000, 44, 'Wi-Fi smart plug with 10 A power monitoring and HomeKit/Matter support.', [['Rating', '10 A'], ['Standard', 'Wi-Fi + Matter'], ['Monitoring', 'watt-hours'], ['Weight', '55 g']]),
  synth(22, 'Philips', 'smart-home', 'Philips Hue White E27 Starter Kit', 649000, 9, 'Three-bulb Hue starter kit with bridge and 16 scenes.', [['Bulbs', '3 × E27'], ['Standard', 'Wi-Fi + Bridge'], ['Output', '800 lm'], ['Wattage', '5.5 W × 3'], ['Weight', '140 g × 3']]),
  synth(35, 'ASUS', 'smart-home', 'ASUS ZenWiFi BQ96', 4199000, 4, 'Wi-Fi 7 four-pack whole-home mesh with 10G uplink.', [['Standard', 'Wi-Fi 7'], ['Pack', '4 nodes'], ['Uplink', '10 GbE'], ['Weight', '4 × 550 g']]),
  synth(41, 'Xiaomi', 'smart-home', 'Xiaomi Smart Door Lock E20', 1899000, 12, 'Fingerprint + PIN + card smart lock with 12-month battery life.', [['Unlock', 'fingerprint, PIN, card'], ['Battery', '12 mo'], ['Rating', 'IP52'], ['Weight', '1.3 kg']]),
  synth(47, 'Philips', 'smart-home', 'Philips Hue White & Color E27', 349000, 23, 'Single color bulb, 16 M colors, 800 lm, works without bridge (Wi-Fi).', [['Output', '800 lm'], ['Colors', '16 M'], ['Standard', 'Wi-Fi'], ['Wattage', '9.5 W'], ['Weight', '100 g']]),
  // gaming
  synth(6, 'Razer', 'gaming', 'Razer Viper V3 Pro', 1499000, 10, 'HyperPolling esports mouse, 30K sensor at 63 g.', [['Sensor', 'Focus X 30K'], ['Weight', '63 g'], ['Polling', '8000 Hz'], ['Battery', '95 h'], ['Rating', '—']]),
  synth(15, 'Logitech', 'gaming', 'Logitech G502 X', 999000, 19, 'Legendary 11-button gaming mouse with HERO 25K sensor.', [['Sensor', 'HERO 25K'], ['Buttons', '11'], ['Weight', '128 g'], ['Battery', 'wired'], ['Switches', '20 M clicks']]),
  synth(19, 'Razer', 'gaming', 'Razer DeathAdder V3', 749000, 27, 'Ergonomic esports mouse, optical switches at 58 g.', [['Sensor', 'Focus Pro 30K'], ['Weight', '58 g'], ['Battery', 'wired'], ['Switches', 'optical, 90 M'], ['Rating', '—']]),
  synth(29, 'Logitech', 'gaming', 'Logitech G Pro Wireless', 1199000, 5, 'LightSpeed wireless esports mouse at 80 g.', [['Sensor', 'HERO 25K'], ['Weight', '80 g'], ['Battery', '50 h'], ['Polling', '1000 Hz'], ['Switches', 'GLT, 90 M']]),
  synth(38, 'Razer', 'gaming', 'Razer Ornata V3', 549000, 15, 'Hybrid membrane keyboard with Chroma and mechanical-feel typing.', [['Layout', 'full-size'], ['Lighting', 'Chroma'], ['Switches', 'hybrid'], ['Cable', 'fixed USB-A'], ['Weight', '700 g']]),
  synth(46, 'Logitech', 'gaming', 'Logitech G29 Racing Wheel', 4499000, 3, 'Force-feedback racing wheel with paddle shifters and 3 pedals.', [['Feedback', 'force'], ['Pedals', '3'], ['Horn', 'yes'], ['Compatibility', 'PS5 (adapter)'], ['Weight', '3.4 kg']]),
  // laptops
  synth(8, 'Apple', 'laptops', 'Apple MacBook Pro M3 14″', 24999000, 5, 'M3 Pro with 18 GB memory, 512 GB SSD and 22 h battery in 14.2″.', [['Chip', 'M3 Pro'], ['Memory', '18 GB'], ['Storage', '512 GB SSD'], ['Display', '14.2″ XDR'], ['Weight', '1.55 kg']]),
  synth(12, 'ASUS', 'laptops', 'ASUS ZenBook 14 OLED', 12499000, 9, '14″ 2.8K OLED ultrabook with Ryzen 7 and 1.1 kg body.', [['CPU', 'Ryzen 7'], ['Display', '14″ 2.8K OLED'], ['Memory', '16 GB'], ['Storage', '512 GB'], ['Weight', '1.1 kg']]),
  synth(20, 'Lenovo', 'laptops', 'Lenovo ThinkPad X1 Carbon', 21999000, 4, '14″ carbon ThinkPad with Core i7, 32 GB and all-day battery.', [['CPU', 'Core i7'], ['Memory', '32 GB'], ['Storage', '1 TB'], ['Display', '14″ WUXGA'], ['Weight', '1.12 kg']]),
  synth(30, 'Apple', 'laptops', 'Apple iMac 24″ M4', 18999000, 6, 'M4 iMac with 24″ 4.5K Retina display and 16 GB memory.', [['Chip', 'M4'], ['Display', '24″ 4.5K'], ['Memory', '16 GB'], ['Storage', '512 GB'], ['Weight', '3.6 kg']]),
  synth(40, 'Lenovo', 'laptops', 'Lenovo Yoga 9i 14', 14999000, 8, '360° 2-in-1 with OLED touch and pen, Core i5.', [['CPU', 'Core i5'], ['Display', '14″ OLED touch'], ['Memory', '16 GB'], ['Storage', '512 GB'], ['Weight', '1.3 kg']]),
  synth(48, 'ASUS', 'laptops', 'ASUS ROG Zephyrus G14', 19999000, 7, 'Gaming 14″ OLED with RTX 4070 and Ryzen 7 in 1.5 kg.', [['GPU', 'RTX 4070'], ['CPU', 'Ryzen 7'], ['Display', '14″ 120 Hz OLED'], ['Memory', '16 GB'], ['Weight', '1.5 kg']]),
  // accessories
  synth(4, 'Anker', 'accessories', 'Anker Nano Power 45 W', 399000, 38, 'Pocket 45 W GaN charger with built-in EU/US plug.', [['Output', '45 W'], ['Protocols', 'PD 3.0'], ['Plugs', 'built-in EU/US'], ['Weight', '74 g']]),
  synth(9, 'Belkin', 'accessories', 'Belkin Boost Charge 3-in-1', 1199000, 13, 'MagSafe wireless charging stand for iPhone, Watch and AirPods.', [['Output', '15 W phone'], ['Standard', 'Qi + MagSafe'], ['Weight', '500 g'], ['Ports', 'USB-C in']]),
  synth(16, 'Anker', 'accessories', 'Anker 531 20 000 mAh 60 W', 459000, 22, 'Slim 20 000 mAh power bank, 60 W two-way USB-C PD.', [['Capacity', '20 000 mAh'], ['Output', '60 W'], ['Weight', '350 g'], ['Ports', '2× USB-C']]),
  synth(24, 'Logitech', 'accessories', 'Logitech M750 Mouse', 549000, 16, 'Ergonomic wireless mouse with 10-programmable buttons and dual-mode.', [['Buttons', '10'], ['Battery', 'up to 2 yrs'], ['Connect', 'receiver + BT'], ['Weight', '93 g']]),
  synth(36, 'Belkin', 'accessories', 'Belkin Surge Protector 8-outlet', 329000, 28, '8-outlet surge protector with 2 AC pass-through USB-C/PD.', [['Outlets', '8 + 2 USB'], ['Rating', '2 500 J'], ['Warranty', '2 yrs'], ['Weight', '450 g']]),
  synth(45, 'Anker', 'accessories', 'Anker 511 25 W', 219000, 52, 'Doublespeed 25 W fast charging power bank, 6 700 mAh.', [['Capacity', '6 700 mAh'], ['Output', '25 W'], ['Weight', '215 g'], ['Ports', 'USB-C']]),
  // wearables
  synth(10, 'Samsung', 'wearables', 'Samsung Galaxy Buds3 Pro', 3299000, 14, 'Beam-forming ANC earbuds with personalized fit and 360 Audio.', [['Battery', '7.5 h + 4.5 h case'], ['ANC', 'yes'], ['Rating', 'IPX7'], ['Weight', '5.7 g per bud']]),
  synth(18, 'Xiaomi', 'wearables', 'Xiaomi Band 9', 499000, 61, 'Fitness band with 2.2″ AMOLED and 14-day battery.', [['Display', '2.2″ AMOLED'], ['Battery', '14 days'], ['Rating', '5 ATM'], ['Sports', '150 modes']]),
  synth(28, 'Apple', 'wearables', 'Apple Watch SE (2nd gen)', 3499000, 20, 'Crash detection, 100 m pool tracking and 18 h battery in the SE line.', [['Battery', '18 h'], ['Rating', '50 m'], ['Sensors', 'accelerometer, altimeter'], ['Weight', '32 g']]),
  synth(37, 'Xiaomi', 'wearables', 'Xiaomi Smart Band 10', 549000, 45, 'AMOLED band with 21-day battery and 150 sport modes.', [['Display', '1.62″ AMOLED'], ['Battery', '21 days'], ['Rating', '50 m'], ['Sports', '150 modes']]),
  synth(42, 'Samsung', 'wearables', 'Samsung Galaxy Fit3', 899000, 33, 'Compact fitness band, 13-day battery, 101 workout modes.', [['Battery', '13 days'], ['Rating', '5 ATM'], ['Sports', '101 modes'], ['Weight', '22 g']]),
  synth(49, 'Apple', 'wearables', 'AirPods 4', 3999000, 29, 'Personalized spatial audio, adaptive transparency, IP54.', [['Battery', '5 h + 20 h case'], ['ANC', 'adaptive transparency'], ['Rating', 'IP54'], ['Weight', '4.8 g per bud']]),
];

/** @type {Product[]} */
export const products = [...NAMED, ...SYNTH];
