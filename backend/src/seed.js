import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import sql, { initDatabase } from './db.js'
import { uploadSeedImage } from './storage.js'
import { users } from './seed-data/users.js'
import { categories } from './seed-data/categories.js'
import { products } from './seed-data/products.js'
import { orders } from './seed-data/orders.js'
import { reviews } from './seed-data/reviews.js'

const SEED_NAME = 'sunset-demo-v1'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const completed = async () => Boolean((await sql`SELECT name FROM seed_runs WHERE name = ${SEED_NAME}`)[0])

// Upload each product's static source image (frontend/public) to the storage
// bucket and map the product id to the bucket's public URL, so the seeded
// rows reference bucket images instead of the static files. Uploads happen
// before the database transaction; object paths are deterministic and
// upserted, so re-seeding refreshes the same objects.
async function prepareSeedImages() {
  const urls = new Map()
  for (const product of products) {
    if (!product.image.startsWith('/products/')) continue
    const filePath = resolve(process.cwd(), '..', 'frontend', 'public', product.image)
    urls.set(product.id, await uploadSeedImage(product.id, basename(filePath), readFileSync(filePath)))
    console.log(`Seed image ${product.id}: ${basename(filePath)} -> bucket`)
  }
  return urls
}

// Wipe the seeded data (not the schema) so a re-seed rebuilds it: every
// foreign-key-related table in one statement, in dependency order.
async function refreshData() {
  console.log('Refreshing: truncating seeded data tables...')
  await sql`TRUNCATE sessions, reviews, order_lines, orders, product_specs, stock_movements, products, categories, users, seed_runs RESTART IDENTITY`
}

// Mock dates don't always carry a year/hour; normalize explicitly to UTC.
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

async function report() {
  const tables = ['users','categories','products','product_specs','orders','order_lines','reviews','stock_movements']
  const counts = await Promise.all(tables.map(table => sql`SELECT COUNT(*) AS n FROM ${sql(table)}`))
  console.table(Object.fromEntries(tables.map((table, index) => [table, { rows: counts[index][0].n }])))
}

// Tell the operator which database this run actually writes to: the masked
// connection string plus the server's own self-report, with an explicit
// Supabase marker so a local gate database is never mistaken for the real
// project.
async function announceTarget() {
  const raw = process.env.DATABASE_URL ?? ''
  const masked = raw.replace(/:[^:@/]+@/, ':***@')
  const [row] = await sql`SELECT current_database() AS db, coalesce(inet_server_addr()::text, 'unix socket') AS server, current_setting('server_version') AS version`
  const isSupabase = /supabase\.(co|com)/.test(raw.replace(/^[a-z+]*:\/\//, ''))
  console.log(`Seed target: ${row.db} @ ${row.server} (PostgreSQL ${row.version})`)
  console.log(`Connection:  ${masked}`)
  console.log(`Supabase:    ${isSupabase ? 'yes' : 'NO — this is not the Supabase project database'}`)
}

async function seed() {
  await initDatabase()
  await announceTarget()
  if (process.argv.includes('--refresh')) await refreshData()
  if (await completed()) {
    console.log('Seed has already been run. The current data is retained..')
    await report()
    return
  }

  const seedImages = await prepareSeedImages()

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
    const [existing] = await sql`SELECT username, email FROM users WHERE username = ${account.username} OR email = ${account.email.toLowerCase()}`
    if (existing) {
      if (existing.username !== account.username || existing.email.toLowerCase() !== account.email.toLowerCase()) {
        throw new Error(`Seed account conflicts with existing identity: ${account.username}`)
      }
      continue
    }
    preparedAccounts.push({ ...account, passwordHash: await bcrypt.hash(account.password, 12) })
    if (preparedAccounts.length % 50 === 0) console.log(`${preparedAccounts.length} password hashes prepared...`)
  }

  await sql.begin(async () => {
    if (await completed()) return // Another seed run may have completed while hashing.
    const insertUser = user => sql`INSERT INTO users(username,email,password_hash,role,active)
      VALUES (${user.username}, ${user.email.toLowerCase()}, ${user.passwordHash}, ${user.role}, ${Number(user.active)})
      ON CONFLICT(username) DO NOTHING`
    for (const user of preparedAccounts) await insertUser(user)
    const userId = async username => {
      const [row] = await sql`SELECT id FROM users WHERE username = ${username}`
      if (!row) throw new Error(`Seed user missing: ${username}`)
      return row.id
    }

    const insertCategory = category => sql`INSERT INTO categories(slug,label)
      VALUES (${category.slug}, ${category.label}) ON CONFLICT(slug) DO NOTHING`
    for (const category of categories) await insertCategory(category)

    const insertProduct = (product, position, image) => sql`INSERT INTO products
      (id,category_slug,name,brand,price,original_price,stock,featured,on_sale,catalog_position,created_at,description,image,low_stock_threshold)
      VALUES (${product.id}, ${product.category}, ${product.name}, ${product.brand}, ${product.price},
        ${product.originalPrice ?? null}, ${product.stock}, ${Number(Boolean(product.featured))}, ${Number(Boolean(product.onSale))},
        ${position}, ${timestamp(product.createdAt)}, ${product.description}, ${image}, ${product.lowStockThreshold})
      ON CONFLICT(id) DO NOTHING RETURNING id`
    const insertMovement = (productId, actorId, delta, reason, createdAt) => sql`INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at)
      VALUES (${productId}, ${actorId}, ${delta}, ${reason}, ${createdAt})`
    for (const [position, product] of products.entries()) {
      const image = seedImages.get(product.id) ?? product.image
      const inserted = await insertProduct(product, position, image)
      if (!inserted.length) continue // The product pre-existed; leave its specs and movements untouched.
      for (const [index, spec] of product.specs.entries()) {
        await sql`INSERT INTO product_specs(product_id,position,key,value)
          VALUES (${product.id}, ${index}, ${spec.key}, ${spec.value})`
      }
      await insertMovement(product.id, await userId('admin_ria'), product.stock, 'seed-opening-balance', timestamp(product.createdAt))
    }

    const addOrder = async (order) => {
      const buyer = await userId(order.buyer)
      const [existing] = await sql`SELECT id,buyer_id FROM orders WHERE reference = ${order.id}`
      if (existing) {
        if (existing.buyer_id !== buyer) throw new Error(`Order ownership conflict: ${order.id}`)
        return existing.id
      }
      const date = timestamp(order.createdAt)
      const [inserted] = await sql`INSERT INTO orders
        (reference,buyer_id,status,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,shipping,total,created_at,updated_at)
        VALUES (${order.id}, ${buyer}, ${order.status}, ${'seed:' + order.id}, ${hash(order)},
          ${JSON.stringify(order.buyerContact || {})}, ${JSON.stringify(order.shippingAddress || {})},
          ${order.paymentMethod || 'card'}, ${order.subtotal}, ${order.shipping}, ${order.total}, ${date}, ${date})
        RETURNING id`
      for (const line of order.lines) {
        await sql`INSERT INTO order_lines(order_id,product_id,product_name,unit_price,qty,amount)
          VALUES (${inserted.id}, ${line.productId}, ${line.name}, ${line.unitPrice}, ${line.qty}, ${line.amount})`
      }
      return inserted.id
    }
    for (const order of orders) await addOrder({ ...order, buyer: order.buyer || `seed_buyer_${order.id.replaceAll('-', '_')}` })

    for (const review of reviews) {
      const buyer = await userId(review.buyer)
      let reference = review.orderId.replace(/^#/, '')
      let [order] = await sql`SELECT id,buyer_id,status FROM orders WHERE reference = ${reference}`
      let hasLine = false
      if (order) {
        hasLine = (await sql`SELECT 1 FROM order_lines WHERE order_id = ${order.id} AND product_id = ${review.productId}`).length > 0
      }

      if (order && (order.buyer_id !== buyer || order.status !== 'delivered' || !hasLine)) {
        reference = `SEED-${review.id}-${reference}`
        order = undefined
      }
      if (!order) {
        const product = products.find(item => item.id === review.productId)
        if (!product) throw new Error(`Review product missing: ${review.productId}`)
        const id = await addOrder({ id: reference, buyer: review.buyer, status: 'delivered', createdAt: review.createdAt,
          subtotal: product.price, shipping: 0, total: product.price,
          lines: [{ productId: product.id, name: product.name, unitPrice: product.price, qty: 1, amount: product.price }] })
        order = { id }
      }
      const id = Number(review.id.replace(/^R-/, ''))
      await sql`INSERT INTO reviews
        (id,order_id,product_id,buyer_id,rating,body,state,seller_comment,created_at)
        VALUES (${id}, ${order.id}, ${review.productId}, ${buyer}, ${review.rating}, ${review.body}, ${review.state},
          ${review.sellerComment ? JSON.stringify(review.sellerComment) : null}, ${timestamp(review.createdAt)})`
    }
    // Seeded review ids are explicit values; advance the identity sequence past
    // the highest one so auto-generated ids can never collide with a seed id.
    await sql`SELECT setval('reviews_id_seq', COALESCE((SELECT MAX(id) FROM reviews), 1))`
    await sql`INSERT INTO seed_runs(name) VALUES (${SEED_NAME})`
  })

  console.log('Seed complete. No login session was created. The history supplement account is inactive..')
  await report()
}

try {
  await seed()
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
