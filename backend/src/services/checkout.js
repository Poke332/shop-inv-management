import { createHash, randomUUID } from 'node:crypto'
import db from '../db.js'
import { order } from './serializer.js'
import { fail, text, integer } from './validation.js'

export function checkout(buyer, payload = {}) {
  const requestId = text(payload.id, 'Request ID', { max: 100 })
  const contact = payload.buyerContact || {}
  const address = payload.shippingAddress || {}
  const buyerContact = {
    name: text(contact.name, 'Name', { max: 100 }),
    email: text(contact.email, 'Email'),
    phone: text(contact.phone, 'Phone', { max: 40 }),
    note: text(contact.note ?? '', 'Note', { min: 0, max: 1000 }),
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerContact.email)
      || !/^[+\d\s()-]+$/.test(buyerContact.phone)
      || buyerContact.phone.replace(/\D/g, '').length < 8) fail(400, 'Email or phone is invalid.')
  const shippingAddress = { address: text(address.address, 'Address', { min: 20, max: 500 }) }
  for (const field of ['district', 'city', 'province', 'postalCode']) {
    shippingAddress[field] = text(address[field], field, { max: 100 })
  }
  const paymentMethod = payload.paymentMethod === 'bank-transfer' ? 'bank_transfer' : payload.paymentMethod
  if (!['card', 'bank_transfer', 'qris'].includes(paymentMethod)) fail(400, 'Invalid payment method.')
  if (!Array.isArray(payload.lines) || payload.lines.length < 1 || payload.lines.length > 100) fail(400, 'Invalid cart.')
  const quantities = new Map()
  for (const line of payload.lines) {
    const id = text(line?.productId, 'Product ID')
    const qty = integer(line?.qty, 'Qty', { min: 1, max: 1000000 })
    quantities.set(id, integer((quantities.get(id) || 0) + qty, 'Total qty', { min: 1, max: 1000000 }))
  }
  const lines = [...quantities].sort(([a], [b]) => a.localeCompare(b)).map(([productId, qty]) => ({ productId, qty }))
  const canonical = { buyerContact, shippingAddress, paymentMethod, lines }
  const fingerprint = createHash('sha256').update(JSON.stringify(canonical)).digest('hex')

  return db.transaction(() => {
    const existing = db.prepare('SELECT * FROM orders WHERE buyer_id = ? AND client_request_id = ?').get(buyer.id, requestId)
    if (existing) {
      if (existing.request_hash !== fingerprint) fail(409, 'Request ID sudah dipakai untuk isi berbeda.', { code: 'IDEMPOTENCY_CONFLICT' })
      return order(existing)
    }
    const conflicts = []
    const snapshots = lines.map(line => {
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(line.productId)
      if (!row || row.stock < line.qty) conflicts.push({ productId: line.productId, available: row?.stock || 0, requested: line.qty })
      return { ...line, row }
    })
    if (conflicts.length) fail(409, 'Stock conflict — update quantities & retry', { code: 'STOCK_CONFLICT', conflicts })
    const subtotal = snapshots.reduce((sum, item) => sum + item.row.price * item.qty, 0)
    integer(subtotal, 'Subtotal')
    const shipping = 0 // Mengikuti checkout saat ini; jangan menerima ongkir/harga dari browser.
    const now = new Date().toISOString()
    const reference = 'WB-' + randomUUID()
    const result = db.prepare(`INSERT INTO orders
      (reference,buyer_id,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,shipping,total,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(reference, buyer.id, requestId, fingerprint,
        JSON.stringify(buyerContact), JSON.stringify(shippingAddress), paymentMethod, subtotal, shipping, subtotal + shipping, now, now)
    const id = Number(result.lastInsertRowid)
    for (const item of snapshots) {
      const updated = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').run(item.qty, item.productId, item.qty)
      if (!updated.changes) fail(409, 'Stock has changed.', { code: 'STOCK_CONFLICT', conflicts: [{ productId: item.productId, available: 0, requested: item.qty }] })
      db.prepare('INSERT INTO order_lines(order_id,product_id,product_name,unit_price,qty,amount) VALUES (?,?,?,?,?,?)')
        .run(id, item.productId, item.row.name, item.row.price, item.qty, item.row.price * item.qty)
      db.prepare('INSERT INTO stock_movements(product_id,actor_id,delta,reason,order_id,created_at) VALUES (?,?,?,?,?,?)')
        .run(item.productId, buyer.id, -item.qty, 'order-decrement', id, now)
    }
    return order(db.prepare('SELECT * FROM orders WHERE id = ?').get(id))
  }).immediate()
}
