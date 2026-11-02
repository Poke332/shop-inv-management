import { createHash, randomUUID } from 'node:crypto'
import sql from '../db.js'
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
  if (!['card', 'bank_transfer'].includes(paymentMethod)) fail(400, 'Invalid payment method.')
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

  return sql.begin(async () => {
    const [existing] = await sql`SELECT * FROM orders WHERE buyer_id = ${buyer.id} AND client_request_id = ${requestId}`
    if (existing) {
      if (existing.request_hash !== fingerprint) fail(409, 'Request ID sudah dipakai untuk isi berbeda.', { code: 'IDEMPOTENCY_CONFLICT' })
      return order(existing)
    }
    const conflicts = []
    const snapshots = []
    for (const line of lines) {
      const [row] = await sql`SELECT * FROM products WHERE id = ${line.productId}`
      if (!row || row.stock < line.qty) conflicts.push({ productId: line.productId, available: row?.stock || 0, requested: line.qty })
      snapshots.push({ ...line, row })
    }
    if (conflicts.length) fail(409, 'Stock conflict — update quantities & retry', { code: 'STOCK_CONFLICT', conflicts })
    const subtotal = snapshots.reduce((sum, item) => sum + item.row.price * item.qty, 0)
    integer(subtotal, 'Subtotal')
    const shipping = 0 // Matches the current checkout behavior; do not accept shipping/price from the browser.
    const now = new Date().toISOString()
    const reference = 'WB-' + randomUUID()
    const [inserted] = await sql`INSERT INTO orders
      (reference,buyer_id,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,shipping,total,created_at,updated_at)
      VALUES (${reference}, ${buyer.id}, ${requestId}, ${fingerprint},
        ${JSON.stringify(buyerContact)}, ${JSON.stringify(shippingAddress)}, ${paymentMethod}, ${subtotal}, ${shipping}, ${subtotal + shipping}, ${now}, ${now})
      RETURNING id`
    const id = inserted.id
    for (const item of snapshots) {
      // The guard and the decrement stay in one statement: zero affected rows
      // means the stock moved since the snapshot, so the whole checkout rolls back.
      const guarded = await sql`UPDATE products SET stock = stock - ${item.qty} WHERE id = ${item.productId} AND stock >= ${item.qty}`
      if (guarded.count === 0) fail(409, 'Stock has changed.', { code: 'STOCK_CONFLICT', conflicts: [{ productId: item.productId, available: 0, requested: item.qty }] })
      await sql`INSERT INTO order_lines(order_id,product_id,product_name,unit_price,qty,amount)
        VALUES (${id}, ${item.productId}, ${item.row.name}, ${item.row.price}, ${item.qty}, ${item.row.price * item.qty})`
      await sql`INSERT INTO stock_movements(product_id,actor_id,delta,reason,order_id,created_at)
        VALUES (${item.productId}, ${buyer.id}, ${-item.qty}, 'order-decrement', ${id}, ${now})`
    }
    const [orderRow] = await sql`SELECT * FROM orders WHERE id = ${id}`
    return order(orderRow)
  })
}
