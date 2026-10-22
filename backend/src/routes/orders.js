import { Router } from 'express'
import db from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { checkout } from '../services/checkout.js'
import { order, review } from '../services/serializer.js'
import { fail, integer, text } from '../services/validation.js'

const router = Router()
router.use(requireAuth, requireRole('buyer'))
router.get('/mine', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC, id DESC').all(req.user.id)
  res.json(rows.map(order))
})
router.post('/', (req, res) => res.status(201).json(checkout(req.user, req.body)))
router.post('/:id/reviews', (req, res) => {
  const body = req.body || {}
  const rating = integer(body.rating, 'Rating', { min: 1, max: 5 })
  const productId = text(body.productId, 'Product ID')
  const comment = text(body.comment ?? '', 'Comment', { min: 0, max: 2000 })
  const result = db.transaction(() => {
    const parent = db.prepare('SELECT * FROM orders WHERE reference = ? AND buyer_id = ?').get(req.params.id, req.user.id)
    if (!parent) fail(404, 'Order not found.')
    if (parent.status !== 'delivered') fail(409, 'Review is only allowed for delivered orders.')
    if (!db.prepare('SELECT 1 FROM order_lines WHERE order_id = ? AND product_id = ?').get(parent.id, productId)) fail(400, 'Product not found in the order.')
    if (db.prepare('SELECT 1 FROM reviews WHERE order_id = ? AND product_id = ? AND buyer_id = ?').get(parent.id, productId, req.user.id)) fail(409, 'Product already reviewed.')
    const inserted = db.prepare('INSERT INTO reviews(order_id,product_id,buyer_id,rating,body,created_at) VALUES (?,?,?,?,?,?)')
      .run(parent.id, productId, req.user.id, rating, comment, new Date().toISOString())
    return review(db.prepare('SELECT * FROM reviews WHERE id = ?').get(inserted.lastInsertRowid))
  }).immediate()
  res.status(201).json(result)
})

export default router
