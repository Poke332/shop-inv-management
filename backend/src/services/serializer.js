import db from '../db.js'
import { fail } from './validation.js'

function displayDate(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

export function product(row) {
  if (!row) fail(404, 'Product not found.')
  return {
    id: row.id, name: row.name, brand: row.brand, category: row.category_slug,
    price: row.price, originalPrice: row.original_price,
    stock: row.stock, lowStockThreshold: row.low_stock_threshold,
    featured: Boolean(row.featured), onSale: Boolean(row.on_sale),
    description: row.description, image: row.image, createdAt: row.created_at,
    specs: db.prepare('SELECT key,value FROM product_specs WHERE product_id = ? ORDER BY position').all(row.id),
  }
}

export function order(row) {
  if (!row) fail(404, 'Order not found.')
  const buyer = db.prepare('SELECT username FROM users WHERE id = ?').get(row.buyer_id)
  return {
    id: row.reference, buyer: buyer.username, status: row.status,
    buyerContact: JSON.parse(row.buyer_contact),
    shippingAddress: JSON.parse(row.shipping_address),
    paymentMethod: row.payment_method, createdAt: displayDate(row.created_at),
    subtotal: row.subtotal, shipping: row.shipping, total: row.total,
    lines: db.prepare(`SELECT product_id AS productId, product_name AS name,
      unit_price AS unitPrice, qty, amount FROM order_lines WHERE order_id = ? ORDER BY rowid`).all(row.id),
    reviewed: db.prepare('SELECT product_id FROM reviews WHERE order_id = ? AND buyer_id = ?')
      .all(row.id, row.buyer_id).map(item => item.product_id),
  }
}

export function review(row) {
  if (!row) fail(404, 'Review tidak ditemukan.')
  const buyer = db.prepare('SELECT username FROM users WHERE id = ?').get(row.buyer_id)
  const parent = db.prepare('SELECT reference FROM orders WHERE id = ?').get(row.order_id)
  return {
    id: `R-${String(row.id).padStart(4, '0')}`, productId: row.product_id,
    buyer: buyer.username, orderId: '#' + parent.reference,
    rating: row.rating, body: row.body, state: row.state,
    sellerComment: row.seller_comment ? JSON.parse(row.seller_comment) : undefined,
    createdAt: displayDate(row.created_at),
  }
}

export function reviewList(productId, includeHidden = false) {
  if (!db.prepare('SELECT id FROM products WHERE id = ?').get(productId)) fail(404, 'Product tidak ditemukan.')
  const rows = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC, id DESC').all(productId)
  const publicCount = rows.filter(item => item.state === 'public').length
  return {
    items: rows.filter(item => includeHidden || item.state === 'public').map(review),
    total: rows.length, publicCount, hiddenCount: rows.length - publicCount,
    average: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.rating, 0) / rows.length * 10) / 10 : 0,
  }
}
