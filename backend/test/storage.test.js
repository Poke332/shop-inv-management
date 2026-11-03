import test from 'node:test'
import assert from 'node:assert/strict'
import { BUCKET, setStorageClient, uploadProductImage } from '../src/storage.js'

// The Supabase client is substituted with a fake that records uploads and
// derives the public URL in the shape the Storage API returns, so the suite
// never touches the network.
const uploads = []
let nextError = null
function fakeClient() {
  return {
    storage: {
      from(bucket) {
        return {
          async upload(path, bytes, options) {
            uploads.push({ bucket, path, bytes, options })
            return nextError ? { error: nextError } : { data: { path }, error: null }
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://ref.supabase.co/storage/v1/object/public/${bucket}/${path}` } }
          },
        }
      },
    },
  }
}
function resetFake() {
  uploads.length = 0
  nextError = null
  setStorageClient(fakeClient())
}

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ'
const WEBP = 'data:image/webp;base64,UklGRiQAAABXRUJQ'

test('uploads the decoded bytes under products/<productId> and returns the public URL', async () => {
  resetFake()
  const url = await uploadProductImage('P-abc', PNG)
  const upload = uploads.at(-1)
  assert.equal(upload.bucket, BUCKET)
  assert.equal(upload.bucket, 'product-images')
  assert.match(upload.path, /^products\/P-abc\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/)
  assert.deepEqual([...upload.bytes], [...Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')])
  assert.equal(upload.options.contentType, 'image/png')
  assert.equal(url, `https://ref.supabase.co/storage/v1/object/public/${BUCKET}/${upload.path}`)
})

test('a jpeg payload is stored with a .jpg extension', async () => {
  resetFake()
  await uploadProductImage('P-1', JPEG)
  const upload = uploads.at(-1)
  assert.match(upload.path, /^products\/P-1\/[\w-]+\.jpg$/)
  assert.equal(upload.options.contentType, 'image/jpeg')
})

test('a webp payload is stored with a .webp extension', async () => {
  resetFake()
  await uploadProductImage('P-1', WEBP)
  const upload = uploads.at(-1)
  assert.match(upload.path, /^products\/P-1\/[\w-]+\.webp$/)
  assert.equal(upload.options.contentType, 'image/webp')
})

test('a payload that is not a supported image data URL is rejected', async () => {
  resetFake()
  await assert.rejects(uploadProductImage('P-1', 'data:text/plain;base64,abc'), /Format image not supported/)
  await assert.rejects(uploadProductImage('P-1', '/products/p-1.png'), /Format image not supported/)
  assert.equal(uploads.length, 0)
})

test('an upload error surfaces as a storage failure', async () => {
  resetFake()
  nextError = { message: 'Bucket not found' }
  await assert.rejects(uploadProductImage('P-1', PNG), /Supabase storage upload failed: Bucket not found/)
})

test('without a client override the env vars are required', async () => {
  resetFake()
  setStorageClient(null)
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  await assert.rejects(uploadProductImage('P-1', PNG), /SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set/)
})
