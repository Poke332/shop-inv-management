import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

// Product images live in the public Supabase storage bucket below. The
// storage client cannot create buckets, so the `product-images` bucket must
// be created in the Supabase dashboard (public, read-only for anon) first;
// uploads authenticate with the server-side service-role key.
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

// Upload the decoded image bytes as products/<productId>/<uuid>.<ext> in the
// bucket and return the public URL, which is the value stored in
// products.image.
export async function uploadProductImage(productId, dataUrl) {
  const match = DATA_URL.exec(dataUrl)
  if (!match) throw new Error('Format image not supported.')
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const path = `products/${productId}/${randomUUID()}.${ext}`
  const storage = activeClient().storage.from(BUCKET)
  const { error } = await storage.upload(path, Buffer.from(match[2], 'base64'), { contentType: MIME[match[1]] })
  if (error) throw new Error(`Supabase storage upload failed: ${error.message}`)
  const { data } = storage.getPublicUrl(path)
  return data.publicUrl
}
