/**
 * Sunset chat engine — the ONLY module the widget talks to.
 *
 * getReply(message, { user }) -> Promise<{ text, links?, items? }>
 *
 * It reads data through the same `mockApi` facade as the rest of the app, so it
 * works unchanged in mock mode (localStorage store) and HTTP mode
 * (VITE_DATA_SOURCE=http). To upgrade to an LLM later, replace the body of
 * getReply() with a fetch to your backend; the widget does not change.
 *
 * Reply shape:
 *   text   string
 *   links  [{ to, label }]                  router links shown under the text
 *   items  [{ to, title, meta }]            small product / order rows
 */
import { mockApi } from '../data'
import { formatIdr } from '../utils/utils.js'

/* ------------------------------------------------------------------ */
/* language helpers                                                    */
/* ------------------------------------------------------------------ */

const ID_HINT =
  /\b(apa|apakah|berapa|bagaimana|gimana|cara|saya|aku|pesanan|pesananku|harga|ada|yang|dong|tolong|bisa|mau|kirim|bayar|murah|bawah|ribu|juta|halo|makasih|terima|kasih|dimana|kapan|barang|jual|keranjang|diskon|rekomendasi|ongkir|masuk|daftar)\b/
const EN_HINT =
  /\b(what|which|how|where|when|do|does|have|price|order|orders|cheap|under|below|thanks|thank|hello|hi|cart|discount|recommend|shipping|sign|register|help)\b/

export function detectLang(text) {
  const id = (text.match(new RegExp(ID_HINT, 'g')) || []).length
  const en = (text.match(new RegExp(EN_HINT, 'g')) || []).length
  return en > id ? 'en' : 'id'
}

const pick = (lang, id, en) => (lang === 'en' ? en : id)

const STATUS_LABEL = {
  pending: { id: 'menunggu diproses', en: 'pending' },
  processing: { id: 'sedang diproses', en: 'being processed' },
  shipped: { id: 'sedang dikirim', en: 'shipped' },
  delivered: { id: 'sudah diterima', en: 'delivered' },
}

/* ------------------------------------------------------------------ */
/* catalog cache                                                       */
/* ------------------------------------------------------------------ */

let catalogPromise = null

function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = Promise.all([
      mockApi.getProducts({ sort: 'catalog' }),
      mockApi.getCategories(),
    ])
      .then(([res, categories]) => ({
        products: Array.isArray(res) ? res : res.items,
        categories,
      }))
      .catch((error) => {
        catalogPromise = null // allow a retry on the next message
        throw error
      })
  }
  return catalogPromise
}

/* ------------------------------------------------------------------ */
/* matching                                                            */
/* ------------------------------------------------------------------ */

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const STOPWORDS = new Set([
  'apa', 'apakah', 'ada', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'dong', 'tolong', 'bisa',
  'mau', 'cari', 'carikan', 'berapa', 'harga', 'harganya', 'stok', 'stoknya', 'produk', 'barang',
  'tersedia', 'masih', 'ini', 'itu', 'di', 'ke', 'dari', 'the', 'for', 'with', 'and', 'what',
  'is', 'are', 'price', 'stock', 'product', 'have', 'you', 'any', 'show', 'find', 'looking',
  'buy', 'beli', 'lihat', 'info', 'about', 'tentang', 'how', 'much', 'does', 'cost', 'available',
])

const CATEGORY_ALIASES = {
  audio: ['audio', 'headphone', 'earphone', 'earbud', 'earbuds', 'speaker', 'tws', 'headset'],
  'smart-home': ['smart home', 'smart-home', 'smarthome', 'rumah pintar', 'lampu', 'bulb', 'cctv'],
  gaming: ['gaming', 'game', 'gamer', 'controller', 'konsol', 'console'],
  laptops: ['laptop', 'laptops', 'pc', 'notebook', 'komputer', 'macbook'],
  accessories: ['accessories', 'accessory', 'aksesoris', 'charger', 'power bank', 'powerbank', 'kabel', 'cable'],
  wearables: ['wearable', 'wearables', 'smartwatch', 'smart watch', 'jam tangan', 'watch', 'band'],
}

const hasWord = (q, w) => new RegExp(`(^|\\s)${w.replace(/[-.]/g, '\\$&')}(\\s|$)`).test(q)

function findCategory(q, categories) {
  for (const c of categories) {
    const aliases = [c.slug, norm(c.label), ...(CATEGORY_ALIASES[c.slug] || [])]
    if (aliases.some((a) => hasWord(q, a))) return c
  }
  return null
}

function scoreProduct(p, tokens) {
  const hay = norm(`${p.name} ${p.brand}`)
  let score = 0
  for (const t of tokens) if (hay.includes(t)) score += 1
  return score
}

function searchProducts(products, q) {
  const tokens = q.split(' ').filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  if (!tokens.length) return { tokens, ranked: [] }
  const ranked = products
    .map((p) => ({ p, score: scoreProduct(p, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
  return { tokens, ranked }
}

/** "di bawah 500 ribu", "under 1.5 juta", "max 2jt", "< 300k" -> integer IDR or null */
function parseMaxPrice(q) {
  const m = q.match(
    /(?:di ?bawah|kurang dari|maksimal|max|under|below|less than|<)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(juta|jt|ribu|rb|k|m)?\b/,
  )
  if (!m) return null
  let n = parseFloat(m[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
  if (Number.isNaN(n)) return null
  const unit = m[2]
  if (unit === 'juta' || unit === 'jt' || unit === 'm') n *= 1_000_000
  else if (unit === 'ribu' || unit === 'rb' || unit === 'k') n *= 1_000
  return Math.round(n)
}

/* ------------------------------------------------------------------ */
/* reply builders                                                      */
/* ------------------------------------------------------------------ */

function stockText(p, lang) {
  if (p.stock <= 0) return pick(lang, 'stok habis', 'out of stock')
  if (p.stock <= (p.lowStockThreshold ?? 5)) return pick(lang, `tersisa ${p.stock}`, `only ${p.stock} left`)
  return pick(lang, `stok tersedia (${p.stock})`, `in stock (${p.stock})`)
}

const productItem = (p, lang) => ({
  to: `/products/${p.id}`,
  title: p.name,
  meta: `${formatIdr(p.price)}${p.onSale ? pick(lang, ' · diskon', ' · on sale') : ''} · ${stockText(p, lang)}`,
})

async function productReply(p, lang) {
  let fresh = p
  try {
    fresh = await mockApi.getProduct(p.id) // fresh stock/price (checkout changes it)
  } catch {
    /* fall back to the cached copy */
  }
  const price = fresh.onSale && fresh.originalPrice
    ? `${formatIdr(fresh.price)} (${pick(lang, 'normal', 'was')} ${formatIdr(fresh.originalPrice)})`
    : formatIdr(fresh.price)
  return {
    text: pick(
      lang,
      `${fresh.name}: ${price}, ${stockText(fresh, lang)}.`,
      `${fresh.name}: ${price}, ${stockText(fresh, lang)}.`,
    ),
    links: [{ to: `/products/${fresh.id}`, label: pick(lang, 'Lihat produk', 'View product') }],
  }
}

async function ordersReply(q, user, lang) {
  if (!user) {
    return {
      text: pick(lang, 'Masuk dulu ya supaya aku bisa menampilkan pesananmu.', 'Please sign in first so I can show your orders.'),
      links: [{ to: '/login', label: pick(lang, 'Masuk', 'Sign in') }],
    }
  }
  if (user.role !== 'buyer') {
    return {
      text: pick(lang, 'Pesanan pelanggan dikelola di workspace operasi.', 'Customer orders are managed in the operations workspace.'),
      links: [{ to: '/ops/orders', label: pick(lang, 'Buka workspace', 'Open workspace') }],
    }
  }
  const orders = await mockApi.getMyOrders()
  if (!orders.length) {
    return { text: pick(lang, 'Kamu belum punya pesanan.', "You don't have any orders yet."), links: [{ to: '/search', label: 'Shop now' }] }
  }
  const wanted = q.match(/wb-?\s?(\d{3,})/i)
  if (wanted) {
    const id = `WB-${wanted[1]}`
    const o = orders.find((x) => x.id.toUpperCase() === id.toUpperCase())
    if (!o) {
      return { text: pick(lang, `Aku tidak menemukan pesanan ${id} di akunmu.`, `I couldn't find order ${id} on your account.`), links: [{ to: '/orders', label: 'My orders' }] }
    }
    const lines = o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')
    return {
      text: pick(
        lang,
        `Pesanan ${o.id} (${o.createdAt}) ${STATUS_LABEL[o.status].id}. Isi: ${lines}. Total ${formatIdr(o.total)}.`,
        `Order ${o.id} (${o.createdAt}) is ${STATUS_LABEL[o.status].en}. Items: ${lines}. Total ${formatIdr(o.total)}.`,
      ),
      links: [{ to: '/orders', label: 'My orders' }],
    }
  }
  return {
    text: pick(lang, `Kamu punya ${orders.length} pesanan. Yang terbaru:`, `You have ${orders.length} order(s). Latest:`),
    items: orders.slice(0, 3).map((o) => ({
      to: '/orders',
      title: `${o.id} · ${formatIdr(o.total)}`,
      meta: `${STATUS_LABEL[o.status][lang]} · ${o.createdAt}`,
    })),
    links: [{ to: '/orders', label: 'My orders' }],
  }
}

/* ------------------------------------------------------------------ */
/* main entry                                                          */
/* ------------------------------------------------------------------ */

export const QUICK_REPLIES = {
  id: ['Kategori apa saja?', 'Ada promo?', 'Cara checkout', 'Status pesananku'],
  en: ['What categories?', 'Any deals?', 'How to checkout', 'My order status'],
}

export const GREETING = {
  id: 'Halo! Aku asisten Sunset Electronics. Tanya soal produk, harga, stok, checkout, atau pesananmu.',
  en: "Hi! I'm the Sunset Electronics assistant. Ask about products, prices, stock, checkout, or your orders.",
}

/**
 * @param {string} message
 * @param {{ user: ({username:string, role:string}|null) }} ctx
 * @returns {Promise<{text:string, links?:object[], items?:object[]}>}
 */
export async function getReply(message, ctx = {}) {
  const { user = null } = ctx
  const lang = detectLang(message.toLowerCase())
  const q = norm(message)

  if (/^(hai|halo|hi|hello|hey|pagi|siang|sore|malam)\b/.test(q) && q.split(' ').length <= 3) {
    return { text: GREETING[lang] }
  }
  if (/\b(makasih|terima kasih|thanks|thank you|thx)\b/.test(q)) {
    return { text: pick(lang, 'Sama-sama! Ada lagi yang bisa kubantu?', "You're welcome! Anything else?") }
  }

  // ---- orders ----
  if (/\bwb-?\s?\d{3,}\b/i.test(q) || /\b(pesanan|pesananku|order|orders|lacak|track|resi|my order)\b/.test(q)) {
    return ordersReply(q, user, lang)
  }

  // ---- store how-tos ----
  if (/\b(ongkir|ongkos|biaya kirim|pengiriman|shipping|delivery|estimasi|sampai)\b/.test(q)) {
    return {
      text: pick(
        lang,
        'Biaya dan alamat pengiriman diisi di langkah 2 checkout; total beserta ongkir terlihat sebelum kamu menekan Place order. Status pengiriman bisa dipantau di My orders.',
        'Shipping address is entered in checkout step 2, and the total including shipping is shown before you place the order. Track delivery in My orders.',
      ),
      links: [{ to: '/orders', label: 'My orders' }],
    }
  }
  if (/\b(bayar|pembayaran|metode|payment|payment method|kartu kredit|credit card|bank transfer|transfer bank|transfer)\b/.test(q)) {
    return {
      text: pick(
        lang,
        'Ada dua metode pembayaran: Card (Visa/Mastercard/JCB, dibayar saat barang diterima) dan Bank transfer (nomor VA dibuat setelah pesanan dibuat).',
        'Two payment methods: Card (Visa/Mastercard/JCB, charged on delivery) and Bank transfer (a VA number is generated after the order is placed).',
      ),
    }
  }
  if (/\b(checkout|cara beli|cara order|how to buy|how to order|beli)\b/.test(q)) {
    // only treat as a how-to when no specific product is named (checked below)
    const { ranked } = searchProducts((await loadCatalog()).products, q)
    if (!ranked.length || /\b(cara|how)\b/.test(q)) {
      return {
        text: pick(
          lang,
          'Checkout ada 3 langkah: (1) Personal info, (2) Shipping address, (3) Payment lalu Place order. Tambahkan produk ke bag dulu, lalu buka Shopping bag.',
          'Checkout has 3 steps: (1) Personal info, (2) Shipping address, (3) Payment, then Place order. Add products to your bag first, then open the Shopping bag.',
        ),
        links: [{ to: '/cart', label: pick(lang, 'Buka keranjang', 'Open bag') }],
      }
    }
  }
  if (/\b(keranjang|cart|bag)\b/.test(q)) {
    return {
      text: pick(lang, 'Keranjangmu ada di ikon tas di kanan atas. Kamu perlu masuk sebagai buyer untuk memakainya.', 'Your bag is the icon at the top right. You need to be signed in as a buyer to use it.'),
      links: [{ to: '/cart', label: pick(lang, 'Buka keranjang', 'Open bag') }],
    }
  }
  if (/\b(masuk|login|sign in|daftar|register|akun|account)\b/.test(q)) {
    return {
      text: pick(lang, 'Kamu bisa masuk atau membuat akun baru di sini.', 'You can sign in or create an account here.'),
      links: [{ to: '/login', label: pick(lang, 'Masuk', 'Sign in') }, { to: '/register', label: pick(lang, 'Daftar', 'Register') }],
    }
  }

  // ---- catalog ----
  const { products, categories } = await loadCatalog()

  if (/\b(kategori|categories|category|jual apa|what do you sell)\b/.test(q) && !findCategory(q, categories)) {
    return {
      text: pick(lang, 'Kategori kami:', 'Our categories:'),
      items: categories.map((c) => ({ to: `/search?category=${c.slug}`, title: c.label, meta: '' })),
    }
  }

  if (/\b(promo|diskon|sale|deal|deals|discount|potongan)\b/.test(q)) {
    const sale = products.filter((p) => p.onSale).slice(0, 4)
    if (sale.length) {
      return { text: pick(lang, 'Produk yang sedang diskon:', 'Products on sale:'), items: sale.map((p) => productItem(p, lang)), links: [{ to: '/search', label: pick(lang, 'Lihat semua', 'Browse all') }] }
    }
  }

  if (/\b(rekomendasi|recommend|recommendation|terbaik|best|populer|popular|unggulan|featured)\b/.test(q)) {
    const top = products.filter((p) => p.featured && p.stock > 0).slice(0, 4)
    return { text: pick(lang, 'Pilihan unggulan kami:', 'Our featured picks:'), items: top.map((p) => productItem(p, lang)) }
  }

  const category = findCategory(q, categories)
  const maxPrice = parseMaxPrice(q)
  const { tokens, ranked } = searchProducts(products, q)
  const best = ranked[0]

  // a clear single-product match wins
  if (best && !maxPrice && (best.score >= 2 || (tokens.length === 1 && !category))) {
    return productReply(best.p, lang)
  }

  // category and/or price filter
  if (category || maxPrice) {
    let list = products.filter((p) => (category ? p.category === category.slug : true))
    if (maxPrice) list = list.filter((p) => p.price <= maxPrice)
    list = list.filter((p) => p.stock > 0).sort((a, b) => a.price - b.price).slice(0, 4)
    const where = category ? category.label : pick(lang, 'semua kategori', 'all categories')
    if (!list.length) {
      return {
        text: pick(lang, `Belum ada produk ${where} yang cocok${maxPrice ? ` di bawah ${formatIdr(maxPrice)}` : ''}.`, `No matching ${where} products${maxPrice ? ` under ${formatIdr(maxPrice)}` : ''} right now.`),
        links: [{ to: category ? `/search?category=${category.slug}` : '/search', label: pick(lang, 'Lihat katalog', 'Browse catalog') }],
      }
    }
    return {
      text: pick(lang, `${where}${maxPrice ? ` di bawah ${formatIdr(maxPrice)}` : ''}, dari yang termurah:`, `${where}${maxPrice ? ` under ${formatIdr(maxPrice)}` : ''}, cheapest first:`),
      items: list.map((p) => productItem(p, lang)),
      links: [{ to: category ? `/search?category=${category.slug}` : '/search', label: pick(lang, 'Lihat semua', 'See all') }],
    }
  }

  // weak match: show top results + search link
  if (ranked.length) {
    return {
      text: pick(lang, 'Mungkin ini yang kamu cari:', 'Maybe one of these:'),
      items: ranked.slice(0, 3).map((r) => productItem(r.p, lang)),
      links: [{ to: `/search?query=${encodeURIComponent(tokens.join(' '))}`, label: pick(lang, 'Cari di toko', 'Search the store') }],
    }
  }

  return {
    text: pick(
      lang,
      'Maaf, aku belum paham. Coba tanya soal produk (mis. "harga Sony earbuds"), kategori, promo, checkout, atau status pesanan.',
      'Sorry, I didn\'t get that. Try asking about a product (e.g. "price of Sony earbuds"), categories, deals, checkout, or order status.',
    ),
  }
}
