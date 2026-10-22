import { request } from './httpClient.js'
import { profile } from './authStorage.js'

function identity() {
  const user = profile()
  return user?.role === 'buyer' ? user.username : null
}
function key(owner) { return 'sunset.final-project.http-cart.' + owner }
function read(owner) {
  if (!owner) return []
  try {
    const rows = JSON.parse(sessionStorage.getItem(key(owner)) || '[]')
    return Array.isArray(rows) ? rows.filter(row => typeof row.productId === 'string' && Number.isSafeInteger(row.qty) && row.qty > 0) : []
  } catch { return [] }
}
function write(owner, rows) { sessionStorage.setItem(key(owner), JSON.stringify(rows)) }

const EMPTY = { lines: [], count: 0, subtotal: 0 }

// Last-known enrichment per product id (catalog rows and single-product
// rows are both keyed by id). An op records the product row it already
// fetched; the catalog GET fills only the ids still missing, instead of
// re-reading the whole catalog on every op.
const byId = new Map()
// The result of the last op: current while an op has run since the last
// getCart, so the addToCart -> refresh() chain reuses it instead of
// firing a second identical catalog GET.
let result = null
let freshFromOp = false

/**
 * The enriched cart (lines + count + subtotal) for the stored rows,
 * built from the last-known enrichment of each line.
 * @param {Array<{productId: string, qty: number}>} rows
 * @returns {{lines: object[], count: number, subtotal: number}}
 */
function compute(rows) {
  if (!rows.length) return EMPTY
  const lines = rows.map(row => {
    const product = byId.get(row.productId)
    return {
      ...row, lineId: row.productId, name: product?.name || 'Unknown product',
      price: product?.price || 0, stock: product?.stock || 0,
      category: product?.category || null, lowStockThreshold: product?.lowStockThreshold || 5,
      subline: product ? `${product.category} · ${product.brand}` : '',
    }
  })
  return { lines, count: lines.reduce((sum, row) => sum + row.qty, 0), subtotal: lines.reduce((sum, row) => sum + row.price * row.qty, 0) }
}

/**
 * Fetch the catalog once, and only when the rows lack an enrichment.
 * @param {Array<{productId: string}>} rows
 */
async function loadGaps(rows) {
  if (!rows.some(row => !byId.has(row.productId))) return
  const catalog = await request('/products?sort=catalog')
  for (const item of catalog.items) byId.set(item.id, item)
}

let queue = Promise.resolve()
/**
 * Run a cart mutation on the serialized queue. The queue section is local
 * (read, the row change, write, compute): the op's single product GET
 * serves the stock clamp, and the enrich never blocks the next op, so
 * ops stop stacking RTT-for-RTT.
 * @param {(rows: object[]) => Promise<object|undefined>} change  mutates
 *   the rows; returning the op's product row ({productId, product}) feeds
 *   the enrich of the changed line from the row the op already fetched.
 * @returns {Promise<{lines: object[], count: number, subtotal: number}>}
 */
function mutate(change) {
  const owner = identity()
  const task = queue.then(async () => {
    if (!owner || identity() !== owner) throw new Error('Login as a buyer is required.')
    const rows = read(owner)
    const known = await change(rows)
    if (identity() !== owner) throw new Error('Account session has changed.')
    write(owner, rows)
    if (known) byId.set(known.productId, known.product)
    result = compute(rows)
    freshFromOp = true
    return result
  })
  queue = task.catch(() => {})
  return task
}

/**
 * The HTTP-backed cart ops (the http twin of api/cart.js): the rows live
 * in sessionStorage per buyer; reads re-enrich from the last catalog /
 * product fetches instead of re-reading the whole catalog per read.
 */
export const httpCart = {
  /**
   * The enriched cart. A fresh catalog read when nothing has changed
   * since the last read; the last op's result when an op just ran.
   * @returns {Promise<{lines: object[], count: number, subtotal: number}>}
   */
  getCart: async () => {
    if (freshFromOp) {
      freshFromOp = false
      return result
    }
    await loadGaps(read(identity()))
    result = compute(read(identity()))
    return result
  },
  addToCart: ({ productId, qty = 1 }) => mutate(async rows => {
    if (!Number.isSafeInteger(qty) || qty < 1) throw new Error('Invalid Qty.')
    const product = await request('/products/' + encodeURIComponent(productId))
    const existing = rows.find(row => row.productId === productId)
    const quantity = Math.min((existing?.qty || 0) + qty, product.stock)
    if (quantity < 1) throw new Error('Stock unavailable.')
    if (existing) existing.qty = quantity
    else rows.push({ productId, qty: quantity })
    return { productId, product }
  }),
  setQty: (lineId, qty) => mutate(async rows => {
    if (!Number.isSafeInteger(qty) || qty < 0) throw new Error('Invalid Qty.')
    const index = rows.findIndex(row => row.productId === lineId)
    if (index < 0) throw new Error('Cart line not found.')
    if (qty === 0) { rows.splice(index, 1); return }
    const product = await request('/products/' + encodeURIComponent(lineId))
    rows[index].qty = Math.min(qty, product.stock)
    if (rows[index].qty === 0) rows.splice(index, 1)
    return { productId: lineId, product }
  }),
  removeLine: lineId => mutate(rows => {
    const index = rows.findIndex(row => row.productId === lineId)
    if (index >= 0) rows.splice(index, 1)
  }),
  clearCart: () => mutate(rows => { rows.length = 0 }),
}
