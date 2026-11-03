import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

// Product images live in the public Supabase storage bucket below. The
// bucket is provisioned by the backend itself on first use: the storage
// client's createBucket call (Supabase Storage API) runs with the
// service-role key and tolerates an "already exists" answer, so no manual
// dashboard step is required. The README documents a manual fallback for
// restricted projects; uploads authenticate with the service-role key.
export const BUCKET = 'product-images'

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/
const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

// A client implementation can be substituted (the test suite injects a fake
// so no network call is made); passing null restores the env-driven client.
let clientOverride
export function setStorageClient(override) {
  clientOverride = override
}

function activeClient() {
  if (clientOverride) return clientOverride
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see backend/.env.example)')
  // Only the storage API is used, so the client is created without auth options.
  return createClient(url, key)
}

// Memoize bucket provisioning per client instance: repeated uploads pay the
// createBucket call once, and swapping the client (setStorageClient)
// re-provisions for the new one.
const bucketCache = { client: null, promise: null }

function ensureBucket(client) {
  if (bucketCache.client !== client) {
    bucketCache.client = client
    bucketCache.promise = client.storage.createBucket(BUCKET, { public: true }).then(({ error }) => {
      // "Bucket already exists" (409 or that message) means it was created
      // earlier — by this or a previous run, or by hand in the dashboard —
      // so treat it as success. Anything else is a real failure.
      if (error && !(error.status === 409 || error.statusCode === 409 || /already exists/i.test(error.message))) {
        throw new Error(`Supabase storage bucket '${BUCKET}' unavailable: ${error.message}`)
      }
    })
  }
  return bucketCache.promise
}

// Upload the decoded image bytes as products/<productId>/<uuid>.<ext> in the
// bucket and return the public URL, which is the value stored in
// products.image.
export async function uploadProductImage(productId, dataUrl) {
  const match = DATA_URL.exec(dataUrl)
  if (!match) throw new Error('Format image not supported.')
  const client = activeClient()
  await ensureBucket(client)
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const path = `products/${productId}/${randomUUID()}.${ext}`
  const storage = client.storage.from(BUCKET)
  const { error } = await storage.upload(path, Buffer.from(match[2], 'base64'), { contentType: MIME[match[1]] })
  if (error) throw new Error(`Supabase storage upload failed: ${error.message}`)
  const { data } = storage.getPublicUrl(path)
  return data.publicUrl
}

// Seed uploads use a deterministic object path (product id + original file
// name) and upsert, so re-running the seed overwrites the same objects
// instead of accumulating uuid-named orphans.
export async function uploadSeedImage(productId, fileName, bytes) {
  const client = activeClient()
  await ensureBucket(client)
  const path = `products/${productId}/${fileName}`
  const ext = fileName.split('.').pop()
  const storage = client.storage.from(BUCKET)
  const { error } = await storage.upload(path, bytes, { upsert: true, contentType: MIME[ext] || 'application/octet-stream' })
  if (error) throw new Error(`Supabase storage seed upload failed: ${error.message}`)
  const { data } = storage.getPublicUrl(path)
  return data.publicUrl
}
