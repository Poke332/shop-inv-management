import { Router } from 'express'
import sql from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { checkout } from '../services/checkout.js'
import { order, review } from '../services/serializer.js'
import { fail, integer, text } from '../services/validation.js'

const router = Router()
router.use(requireAuth, requireRole('buyer'))
router.get('/mine', async (req, res) => {
  const rows = await sql`SELECT * FROM orders WHERE buyer_id = ${req.user.id} ORDER BY created_at DESC, id DESC`
  res.json(await Promise.all(rows.map(row => order(row))))
})
router.post('/', async (req, res) => res.status(201).json(await checkout(req.user, req.body)))
router.post('/:id/reviews', async (req, res) => {
  const body = req.body || {}
  const rating = integer(body.rating, 'Rating', { min: 1, max: 5 })
  const productId = text(body.productId, 'Product ID')
  const comment = text(body.comment ?? '', 'Comment', { min: 0, max: 2000 })
  const result = await sql.begin(async () => {
    const [parent] = await sql`SELECT * FROM orders WHERE reference = ${req.params.id} AND buyer_id = ${req.user.id}`
    if (!parent) fail(404, 'Order not found.')
    if (parent.status !== 'delivered') fail(409, 'Review is only allowed for delivered orders.')
    const [line] = await sql`SELECT 1 FROM order_lines WHERE order_id = ${parent.id} AND product_id = ${productId}`
    if (!line) fail(400, 'Product not found in the order.')
    const [existing] = await sql`SELECT 1 FROM reviews WHERE order_id = ${parent.id} AND product_id = ${productId} AND buyer_id = ${req.user.id}`
    if (existing) fail(409, 'Product already reviewed.')
    const [inserted] = await sql`INSERT INTO reviews(order_id,product_id,buyer_id,rating,body,created_at)
      VALUES (${parent.id}, ${productId}, ${req.user.id}, ${rating}, ${comment}, ${new Date().toISOString()})
      RETURNING id`
    const [reviewRow] = await sql`SELECT * FROM reviews WHERE id = ${inserted.id}`
    return review(reviewRow)
  })
  res.status(201).json(result)
})

export default router
