import sql from '../db.js'
import { fail } from './validation.js'

function displayDate(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

export async function product(row, connection = sql) {
  if (!row) fail(404, 'Product not found.')
  return {
    id: row.id, name: row.name, brand: row.brand, category: row.category_slug,
    price: row.price, originalPrice: row.original_price,
    stock: row.stock, lowStockThreshold: row.low_stock_threshold,
    featured: Boolean(row.featured), onSale: Boolean(row.on_sale),
    description: row.description, image: row.image, createdAt: row.created_at,
    specs: await connection`SELECT key,value FROM product_specs WHERE product_id = ${row.id} ORDER BY position`,
  }
}

export async function order(row, connection = sql) {
  if (!row) fail(404, 'Order not found.')
  const [buyer] = await connection`SELECT username FROM users WHERE id = ${row.buyer_id}`
  // Order lines carry no insertion-order column; product_id is the explicit ordering.
  const lines = await connection`SELECT product_id AS "productId", product_name AS name,
    unit_price AS "unitPrice", qty, amount FROM order_lines WHERE order_id = ${row.id} ORDER BY product_id`
  const reviewed = (await connection`SELECT product_id FROM reviews WHERE order_id = ${row.id} AND buyer_id = ${row.buyer_id}`)
    .map(item => item.product_id)
  return {
    id: row.reference, buyer: buyer.username, status: row.status,
    buyerContact: JSON.parse(row.buyer_contact),
    shippingAddress: JSON.parse(row.shipping_address),
    paymentMethod: row.payment_method, createdAt: displayDate(row.created_at),
    subtotal: row.subtotal, shipping: row.shipping, total: row.total,
    lines, reviewed,
  }
}

export async function review(row) {
  if (!row) fail(404, 'Review tidak ditemukan.')
  const [buyer] = await sql`SELECT username FROM users WHERE id = ${row.buyer_id}`
  const [parent] = await sql`SELECT reference FROM orders WHERE id = ${row.order_id}`
  return {
    id: `R-${String(row.id).padStart(4, '0')}`, productId: row.product_id,
    buyer: buyer.username, orderId: '#' + parent.reference,
    rating: row.rating, body: row.body, state: row.state,
    sellerComment: row.seller_comment ? JSON.parse(row.seller_comment) : undefined,
    createdAt: displayDate(row.created_at),
  }
}

export async function reviewList(productId, includeHidden = false) {
  const [present] = await sql`SELECT id FROM products WHERE id = ${productId}`
  if (!present) fail(404, 'Product tidak ditemukan.')
  // The scope fragment is a fixed string, not a user value; it is spliced into the text, not bound.
  const scope = includeHidden ? '' : " AND state = 'public'"
  const rows = await sql.unsafe(`SELECT * FROM reviews WHERE product_id = $1${scope} ORDER BY created_at DESC, id DESC`, [productId])
  const publicCount = rows.filter(item => item.state === 'public').length
  return {
    items: await Promise.all(rows.filter(item => includeHidden || item.state === 'public').map(review)),
    total: rows.length, publicCount, hiddenCount: rows.length - publicCount,
    average: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.rating, 0) / rows.length * 10) / 10 : 0,
  }
}
