import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import postgres from 'postgres'

// The auth middleware refuses to load without a long enough secret, so the
// environment must be in place before the app module is imported. Each run
// works against its own disposable database: created from the maintenance
// connection in DATABASE_URL, dropped in the teardown.
const maintenanceUrl = process.env.DATABASE_URL
if (!maintenanceUrl) throw new Error('DATABASE_URL must point at a Postgres server to run the suite')
const database = `shop-inv-test-${process.pid}`
const testUrl = new URL(maintenanceUrl)
testUrl.pathname = testUrl.pathname.replace(/\/[^/]*$/, `/${database}`)

process.env.DATABASE_URL = testUrl
process.env.JWT_SECRET = 'test-secret-key-0123456789-abcdef-32ch'
process.env.NODE_ENV = 'test'

const admin = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
await admin.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
await admin.unsafe(`CREATE DATABASE "${database}"`)
await admin.end()

const { default: sql, initDatabase } = await import('../src/db.js')
const { default: app } = await import('../src/server.js')
const { setStorageClient, setWebpConverter } = await import('../src/storage.js')

// Image uploads are recorded instead of hitting the network; the public URL
// mirrors the Supabase Storage shape. The WebP converter is faked to pass
// bytes through, so these tests exercise the API plumbing, not the encoder.
const uploads = []
setStorageClient({
  storage: {
    createBucket() {
      return Promise.resolve({ data: { name: 'product-images' }, error: null })
    },
    from(bucket) {
      return {
        async upload(path) {
          uploads.push({ bucket, path })
          return { data: { path }, error: null }
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `https://ref.supabase.co/storage/v1/object/public/${bucket}/${path}` } }
        },
      }
    },
  },
})
setWebpConverter(async bytes => bytes)

await initDatabase()
const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
const base = `http://127.0.0.1:${server.address().port}`

const passwordHash = await bcrypt.hash('manager-password', 10)
await sql`INSERT INTO users(username,email,password_hash,role,active)
  VALUES ('mara', 'mara@shop.test', ${passwordHash}, 'manager', 1)`
await sql`INSERT INTO categories(slug,label) VALUES ('gadgets', 'Gadgets')`

const login = await (await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'mara@shop.test', password: 'manager-password' }),
})).json()

async function api(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${login.token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ'
const createBody = { name: 'Pixel Lamp', brand: 'Lumina', category: 'gadgets', price: 19, stock: 4, specs: [] }
const bucketBase = 'https://ref.supabase.co/storage/v1/object/public/product-images'

test('creating a product with a base64 image uploads it to the bucket and stores the public URL', async () => {
  const res = await api('POST', '/api/ops/products', { ...createBody, image: PNG })
  assert.equal(res.status, 201)
  assert.equal(uploads.length, 1)
  assert.equal(uploads[0].bucket, 'product-images')
  assert.ok(res.body.image.startsWith(`${bucketBase}/products/${res.body.id}/`))
  assert.ok(res.body.image.endsWith('.webp'))
  assert.equal(res.body.image, `https://ref.supabase.co/storage/v1/object/public/product-images/${uploads[0].path}`)
})

test('a plain product path is stored unchanged without an upload', async () => {
  const res = await api('POST', '/api/ops/products', { ...createBody, image: '/products/p-9.png' })
  assert.equal(res.status, 201)
  assert.equal(res.body.image, '/products/p-9.png')
  assert.equal(uploads.length, 1)
})

test('a public Supabase storage URL is stored unchanged without an upload', async () => {
  const url = `${bucketBase}/products/P-old/old.png`
  const res = await api('POST', '/api/ops/products', { ...createBody, image: url })
  assert.equal(res.status, 201)
  assert.equal(res.body.image, url)
  assert.equal(uploads.length, 1)
})

test('unsupported image input is rejected with a 400', async () => {
  for (const image of ['http://example.com/a.png', 'data:text/plain;base64,abc', '/uploads x']) {
    const res = await api('POST', '/api/ops/products', { ...createBody, image })
    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Format image not supported.')
  }
  assert.equal(uploads.length, 1)
})

test('updating a product with a base64 image uploads to the product folder and replaces the stored URL', async () => {
  const created = await api('POST', '/api/ops/products', { ...createBody, image: '/products/p-9.png' })
  assert.equal(created.status, 201)
  const res = await api('PATCH', `/api/ops/products/${created.body.id}`, { ...createBody, image: JPEG })
  assert.equal(res.status, 200)
  assert.equal(uploads.length, 2)
  assert.equal(uploads[1].bucket, 'product-images')
  assert.match(uploads[1].path, new RegExp(`^products/${created.body.id}/\\w[\\w.-]*\\.webp$`))
  assert.equal(res.body.image, `${bucketBase}/${uploads[1].path}`)
})

test('updating a product without an image field keeps the stored value', async () => {
  const created = await api('POST', '/api/ops/products', { ...createBody, image: PNG })
  assert.equal(created.status, 201)
  const before = uploads.length
  const res = await api('PATCH', `/api/ops/products/${created.body.id}`, createBody)
  assert.equal(res.status, 200)
  assert.equal(res.body.image, created.body.image)
  assert.equal(uploads.length, before)
})

test('updating a missing product is a 404', async () => {
  const res = await api('PATCH', '/api/ops/products/P-missing', createBody)
  assert.equal(res.status, 404)
})

test.after(async () => {
  await new Promise(resolve => server.close(resolve))
  await sql.end()
  const drop = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
  await drop.unsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`)
  await drop.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
  await drop.end()
})
