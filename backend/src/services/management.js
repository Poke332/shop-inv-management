import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sql, { uploadsDir } from '../db.js'
import { product } from './serializer.js'
import { fail, text, integer } from './validation.js'

// Store the data URL as a file on disk and return its path, so the DB
// holds no image bytes. Paths that are already plain paths pass through unchanged.
function storeImage(image) {
  if (!image.startsWith('data:image/')) return image
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(image)
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const file = `img-${randomUUID()}.${ext}`
  writeFileSync(resolve(uploadsDir, file), Buffer.from(match[2], 'base64'))
  return `/uploads/${file}`
}

// No transaction of its own: callers wrap it in sql.begin so the read, the
// update, and the movement record commit or roll back together.
export async function stockChange(productId, qty, actorId) {
  const [previous] = await sql`SELECT * FROM products WHERE id = ${productId}`
  if (!previous) fail(404, 'Product not found.')
  await sql`UPDATE products SET stock = ${qty} WHERE id = ${productId}`
  if (qty !== previous.stock) {
    await sql`INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at)
      VALUES (${productId}, ${actorId}, ${qty - previous.stock}, 'manual-set', ${new Date().toISOString()})`
  }
  const [current] = await sql`SELECT * FROM products WHERE id = ${productId}`
  return product(current)
}

export function saveProduct(id, body, actorId) {
  const form = body || {}
  const name = text(form.name, 'Product name')
  const brand = text(form.brand, 'Brand', { max: 100 })
  const category = text(form.category, 'Category')
  const price = integer(form.price, 'Price', { min: 1 })
  const description = text(form.description ?? '', 'Description', { min: 0, max: 10000 })
  const image = text(form.image ?? '', 'Image', { min: 0, max: 1500000 })
  if (image && !/^\/(products|img|uploads)\/[\w./-]+$/.test(image)
      && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) fail(400, 'Format image not supported.')
  if (!Array.isArray(form.specs) || form.specs.length > 50) fail(400, 'Specs not valid.')
  const specs = form.specs.map(item => ({
    key: text(item?.key, 'Spec key', { min: 0, max: 100 }),
    value: text(item?.value, 'Spec value', { min: 0, max: 500 }),
  }))
  return sql.begin(async () => {
    if (!(await sql`SELECT slug FROM categories WHERE slug = ${category}`)[0]) fail(400, 'Category not found.')
    let productId = id
    if (id) {
      const [current] = await sql`SELECT * FROM products WHERE id = ${id}`
      if (!current) fail(404, 'Product not found.')
      // Stock/image fields omitted from the body keep the product's current values.
      const stock = form.stock === undefined ? current.stock : integer(form.stock, 'Stock', { max: 1000000 })
      const nextImage = form.image === undefined ? current.image : storeImage(image)
      if (stock !== current.stock) await stockChange(id, stock, actorId)
      await sql`UPDATE products SET name = ${name}, brand = ${brand}, category_slug = ${category}, price = ${price},
        description = ${description}, image = ${nextImage} WHERE id = ${id}`
      await sql`DELETE FROM product_specs WHERE product_id = ${id}`
    } else {
      const stock = integer(form.stock, 'Stock', { max: 1000000 })
      productId = 'P-' + randomUUID()
      const [position] = await sql`SELECT COALESCE(MAX(catalog_position),-1)+1 AS value FROM products`
      await sql`INSERT INTO products(id,name,brand,category_slug,price,stock,description,image,catalog_position,created_at)
        VALUES (${productId}, ${name}, ${brand}, ${category}, ${price}, ${stock}, ${description}, ${storeImage(image)}, ${position.value}, ${new Date().toISOString()})`
      await sql`INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at)
        VALUES (${productId}, ${actorId}, ${stock}, 'product-created', ${new Date().toISOString()})`
    }
    for (const [specPosition, spec] of specs.entries()) {
      await sql`INSERT INTO product_specs(product_id,position,key,value)
        VALUES (${productId}, ${specPosition}, ${spec.key}, ${spec.value})`
    }
    const [current] = await sql`SELECT * FROM products WHERE id = ${productId}`
    return product(current)
  })
}
