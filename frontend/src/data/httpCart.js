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
async function enrich(rows) {
  if (!rows.length) return { lines: [], count: 0, subtotal: 0 }
  const catalog = await request('/products?sort=catalog')
  const lines = rows.map(row => {
    const product = catalog.items.find(item => item.id === row.productId)
    return {
      ...row, lineId: row.productId, name: product?.name || 'Unknown product',
      price: product?.price || 0, stock: product?.stock || 0,
      category: product?.category || null, lowStockThreshold: product?.lowStockThreshold || 5,
      subline: product ? `${product.category} · ${product.brand}` : '',
    }
  })
  return { lines, count: lines.reduce((sum, row) => sum + row.qty, 0), subtotal: lines.reduce((sum, row) => sum + row.price * row.qty, 0) }
}

let queue = Promise.resolve()
function mutate(change) {
  const owner = identity()
  const task = queue.then(async () => {
    if (!owner || identity() !== owner) throw new Error('Login as a buyer is required.')
    const rows = read(owner)
    await change(rows)
    const result = await enrich(rows)
    if (identity() !== owner) throw new Error('Account session has changed.')
    write(owner, rows)
    return result
  })
  queue = task.catch(() => {})
  return task
}
export const httpCart = {
  getCart: async () => enrich(read(identity())),
  addToCart: ({ productId, qty = 1 }) => mutate(async rows => {
    if (!Number.isSafeInteger(qty) || qty < 1) throw new Error('Invalid Qty.')
    const product = await request('/products/' + encodeURIComponent(productId))
    const existing = rows.find(row => row.productId === productId)
    const quantity = Math.min((existing?.qty || 0) + qty, product.stock)
    if (quantity < 1) throw new Error('Stock unavailable.')
    if (existing) existing.qty = quantity
    else rows.push({ productId, qty: quantity })
  }),
  setQty: (lineId, qty) => mutate(async rows => {
    if (!Number.isSafeInteger(qty) || qty < 0) throw new Error('Invalid Qty.')
    const index = rows.findIndex(row => row.productId === lineId)
    if (index < 0) throw new Error('Cart line not found.')
    if (qty === 0) { rows.splice(index, 1); return }
    const product = await request('/products/' + encodeURIComponent(lineId))
    rows[index].qty = Math.min(qty, product.stock)
    if (rows[index].qty === 0) rows.splice(index, 1)
  }),
  removeLine: lineId => mutate(rows => {
    const index = rows.findIndex(row => row.productId === lineId)
    if (index >= 0) rows.splice(index, 1)
  }),
  clearCart: () => mutate(rows => { rows.length = 0 }),
}
