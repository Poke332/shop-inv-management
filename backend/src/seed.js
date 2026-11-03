import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import db from './db.js'
import { users } from '../../src/data/seed/users.js'
import { categories } from '../../src/data/seed/categories.js'
import { products } from '../../src/data/seed/products.js'
import { orders } from '../../src/data/seed/orders.js'
import { reviews } from '../../src/data/seed/reviews.js'

const SEED_NAME = 'sunset-demo-v1'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const completed = () => db.prepare('SELECT name FROM seed_runs WHERE name = ?').get(SEED_NAME)

// Tanggal mock tidak selalu menyertakan tahun/jam; normalisasi eksplisit ke UTC.
function timestamp(value) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value.endsWith('Z') ? value : value + 'Z').toISOString()
  }
  const match = /^(\d{1,2}) ([A-Z][a-z]{2})(?: (\d{4}))?(?: (\d{2}):(\d{2}))?$/.exec(value)
  if (!match) throw new Error(`Unknown seed timestamp: ${value}`)
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[2])
  if (month < 0) throw new Error('Unknown seed month')
  return new Date(Date.UTC(Number(match[3] || 2026), month, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0))).toISOString()
}

function report() {
  console.table(Object.fromEntries(['users','categories','products','product_specs','orders','order_lines','reviews','stock_movements']
    .map(table => [table, { rows: db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n }])))
}

async function seed() {
  if (completed()) {
    console.log('Seed has already been run. The current data is retained..')
    report()
    return
  }

  const accountSeeds = new Map(users.map(user => [user.username, user]))
  function historicalAccount(username) {
    if (!accountSeeds.has(username)) accountSeeds.set(username, {
      username, email: `${username}@seed.invalid`, role: 'buyer', active: false,
      password: randomBytes(32).toString('hex'),
    })
    return username
  }
  for (const order of orders) historicalAccount(order.buyer || `seed_buyer_${order.id.replaceAll('-', '_')}`)
  for (const review of reviews) historicalAccount(review.buyer)

  const preparedAccounts = []
  console.log(`Preparing password hashes for ${accountSeeds.size} demo/historical accounts...`)
  for (const account of accountSeeds.values()) {
    const existing = db.prepare('SELECT username, email FROM users WHERE username = ? OR email = ?')
      .get(account.username, account.email.toLowerCase())
    if (existing) {
      if (existing.username !== account.username || existing.email.toLowerCase() !== account.email.toLowerCase()) {
        throw new Error(`Seed account conflicts with existing identity: ${account.username}`)
      }
      continue
    }
    preparedAccounts.push({ ...account, passwordHash: await bcrypt.hash(account.password, 12) })
    if (preparedAccounts.length % 50 === 0) console.log(`${preparedAccounts.length} password hash siap...`)
  }

  db.transaction(() => {
    if (completed()) return // Proses seed lain mungkin sudah selesai ketika hashing.
    const insertUser = db.prepare('INSERT INTO users(username,email,password_hash,role,active) VALUES (?,?,?,?,?) ON CONFLICT(username) DO NOTHING')
    for (const user of preparedAccounts) insertUser.run(user.username, user.email.toLowerCase(), user.passwordHash, user.role, Number(user.active))
    const userId = username => {
      const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
      if (!row) throw new Error(`Seed user missing: ${username}`)
      return row.id
    }

    const insertCategory = db.prepare('INSERT INTO categories(slug,label) VALUES (?,?) ON CONFLICT(slug) DO NOTHING')
    for (const category of categories) insertCategory.run(category.slug, category.label)

    const insertProduct = db.prepare(`INSERT INTO products
      (id,category_slug,name,brand,price,original_price,stock,featured,on_sale,catalog_position,created_at,description,image,low_stock_threshold)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
    const insertSpec = db.prepare('INSERT INTO product_specs(product_id,position,key,value) VALUES (?,?,?,?)')
    const insertMovement = db.prepare('INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at) VALUES (?,?,?,?,?)')
    products.forEach((product, position) => {
      const result = insertProduct.run(product.id, product.category, product.name, product.brand, product.price,
        product.originalPrice ?? null, product.stock, Number(Boolean(product.featured)), Number(Boolean(product.onSale)),
        position, timestamp(product.createdAt), product.description, product.image, product.lowStockThreshold)
      if (!result.changes) return
      product.specs.forEach((spec, index) => insertSpec.run(product.id, index, spec.key, spec.value))
    
      insertMovement.run(product.id, userId('admin_ria'), product.stock, 'seed-opening-balance', timestamp(product.createdAt))
    })

    const insertOrder = db.prepare(`INSERT INTO orders
      (reference,buyer_id,status,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,shipping,total,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    const insertLine = db.prepare('INSERT INTO order_lines(order_id,product_id,product_name,unit_price,qty,amount) VALUES (?,?,?,?,?,?)')
    function addOrder(order) {
      const buyer = userId(order.buyer)
      const existing = db.prepare('SELECT id,buyer_id FROM orders WHERE reference = ?').get(order.id)
      if (existing) {
        if (existing.buyer_id !== buyer) throw new Error(`Order ownership conflict: ${order.id}`)
        return existing.id
      }
      const date = timestamp(order.createdAt)
      const result = insertOrder.run(order.id, buyer, order.status, `seed:${order.id}`, hash(order),
        JSON.stringify(order.buyerContact || {}), JSON.stringify(order.shippingAddress || {}),
        order.paymentMethod || 'card', order.subtotal, order.shipping, order.total, date, date)
      const id = Number(result.lastInsertRowid)
      for (const line of order.lines) insertLine.run(id, line.productId, line.name, line.unitPrice, line.qty, line.amount)
      return id
    }
    for (const order of orders) addOrder({ ...order, buyer: order.buyer || `seed_buyer_${order.id.replaceAll('-', '_')}` })

    const insertReview = db.prepare(`INSERT INTO reviews
      (id,order_id,product_id,buyer_id,rating,body,state,seller_comment,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`)
    for (const review of reviews) {
      const buyer = userId(review.buyer)
      let reference = review.orderId.replace(/^#/, '')
      let order = db.prepare('SELECT id,buyer_id,status FROM orders WHERE reference = ?').get(reference)
      const hasLine = order && db.prepare('SELECT 1 FROM order_lines WHERE order_id = ? AND product_id = ?').get(order.id, review.productId)

      if (order && (order.buyer_id !== buyer || order.status !== 'delivered' || !hasLine)) {
        reference = `SEED-${review.id}-${reference}`
        order = undefined
      }
      if (!order) {
        const product = products.find(item => item.id === review.productId)
        if (!product) throw new Error(`Review product missing: ${review.productId}`)
        const id = addOrder({ id: reference, buyer: review.buyer, status: 'delivered', createdAt: review.createdAt,
          subtotal: product.price, shipping: 0, total: product.price,
          lines: [{ productId: product.id, name: product.name, unitPrice: product.price, qty: 1, amount: product.price }] })
        order = { id }
      }
      const id = Number(review.id.replace(/^R-/, ''))
      insertReview.run(id, order.id, review.productId, buyer, review.rating, review.body, review.state,
        review.sellerComment ? JSON.stringify(review.sellerComment) : null, timestamp(review.createdAt))
    }
    if (db.pragma('foreign_key_check').length) throw new Error('Seed foreign key check failed')
    db.prepare('INSERT INTO seed_runs(name) VALUES (?)').run(SEED_NAME)
  }).immediate()

  console.log('Seed complete. No login session was created. The history supplement account is inactive..')
  report()
}

try {
  await seed()
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  db.close()
}
