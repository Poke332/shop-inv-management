import { randomUUID } from 'node:crypto'
import db from '../db.js'
import { product } from './serializer.js'
import { fail, text, integer } from './validation.js'

export function stockChange(productId, qty, actorId) {
  return db.transaction(() => {
    const previous = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (!previous) fail(404, 'Product not found.')
    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(qty, productId)
    if (qty !== previous.stock) {
      db.prepare('INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at) VALUES (?,?,?,?,?)')
        .run(productId, actorId, qty - previous.stock, 'manual-set', new Date().toISOString())
    }
    return product(db.prepare('SELECT * FROM products WHERE id = ?').get(productId))
  }).immediate()
}

export function saveProduct(id, body, actorId) {
  const form = body || {}
  const name = text(form.name, 'Product name')
  const brand = text(form.brand, 'Brand', { max: 100 })
  const category = text(form.category, 'Category')
  if (!db.prepare('SELECT slug FROM categories WHERE slug = ?').get(category)) fail(400, 'Category not found.')
  const price = integer(form.price, 'Price', { min: 1 })
  const stock = integer(form.stock, 'Stock', { max: 1000000 })
  const description = text(form.description ?? '', 'Description', { min: 0, max: 10000 })
  const image = text(form.image, 'Image', { max: 1500000 })
  const categoryImage = db.prepare('SELECT slug FROM categories WHERE slug = ?').get(image)
  if (!categoryImage && !/^\/(products|img)\/[\w./-]+$/.test(image)
      && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) fail(400, 'Format image not supported.')
  if (!Array.isArray(form.specs) || form.specs.length > 50) fail(400, 'Specs not valid.')
  const specs = form.specs.map(item => ({
    key: text(item?.key, 'Spec key', { min: 0, max: 100 }),
    value: text(item?.value, 'Spec value', { min: 0, max: 500 }),
  }))
  return db.transaction(() => {
    let productId = id
    if (id) {
      if (!db.prepare('SELECT id FROM products WHERE id = ?').get(id)) fail(404, 'Product not found.')
      stockChange(id, stock, actorId)
      db.prepare('UPDATE products SET name=?,brand=?,category_slug=?,price=?,description=?,image=? WHERE id=?')
        .run(name, brand, category, price, description, image, id)
      db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(id)
    } else {
      productId = 'P-' + randomUUID()
      const position = db.prepare('SELECT COALESCE(MAX(catalog_position),-1)+1 AS value FROM products').get().value
      db.prepare(`INSERT INTO products(id,name,brand,category_slug,price,stock,description,image,catalog_position,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(productId, name, brand, category, price, stock, description, image, position, new Date().toISOString())
      db.prepare('INSERT INTO stock_movements(product_id,actor_id,delta,reason,created_at) VALUES (?,?,?,?,?)')
        .run(productId, actorId, stock, 'product-created', new Date().toISOString())
    }
    const insertSpec = db.prepare('INSERT INTO product_specs(product_id,position,key,value) VALUES (?,?,?,?)')
    specs.forEach((item, position) => insertSpec.run(productId, position, item.key, item.value))
    return product(db.prepare('SELECT * FROM products WHERE id = ?').get(productId))
  }).immediate()
}
