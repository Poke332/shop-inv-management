import { Router } from 'express'
import sql from '../db.js'
import { requireAuth, requireRole, publicUser } from '../middleware/auth.js'
import { order, product, review, reviewList } from '../services/serializer.js'
import { stockChange, saveProduct } from '../services/management.js'
import { fail, integer, text, boolean, reviewId } from '../services/validation.js'

const router = Router()
const manager = requireRole('manager', 'admin')
const admin = requireRole('admin')
router.use(requireAuth, requireRole('staff', 'manager', 'admin'))

router.get('/orders', async (req, res) => {
  const status = req.query.status || 'all'
  const flow = ['pending', 'processing', 'shipped', 'delivered']
  if (status !== 'all' && !flow.includes(status)) fail(400, 'Unknown status.')
  const tabs = { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 }
  for (const row of await sql`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`) {
    tabs[row.status] = row.count
    tabs.all += row.count
  }
  const rows = status === 'all'
    ? await sql`SELECT * FROM orders ORDER BY created_at DESC, id DESC`
    : await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC, id DESC`
  res.json({ items: await Promise.all(rows.map(order)), tabs })
})
router.patch('/orders/:id/status', async (req, res) => {
  const result = await sql.begin(async () => {
    const [row] = await sql`SELECT * FROM orders WHERE reference = ${req.params.id}`
    if (!row) fail(404, 'Order not found.')
    const flow = ['pending', 'processing', 'shipped', 'delivered']
    const next = req.body?.status
    if (flow.indexOf(next) !== flow.indexOf(row.status) + 1) fail(409, 'Status must advance by one step.')
    await sql`UPDATE orders SET status = ${next}, updated_at = ${new Date().toISOString()} WHERE id = ${row.id}`
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${row.id}`
    return order(updated)
  })
  res.json(result)
})
router.get('/stock', async (_req, res) => {
  const items = (await sql`SELECT * FROM products WHERE stock <= low_stock_threshold
    ORDER BY CASE WHEN stock=0 THEN 0 ELSE 1 END, stock ASC, catalog_position ASC`).map(row => ({
      productId: row.id, name: row.name, category: row.category_slug,
      price: row.price, stock: row.stock, status: row.stock === 0 ? 'out' : 'low',
    }))
  res.json({ items, total: items.length })
})
router.patch('/stock/:id', manager, async (req, res) => {
  const qty = integer(req.body?.qty, 'Stock', { max: 1000000 })
  // stockChange carries no transaction of its own; the route is the top-level caller.
  res.json(await sql.begin(() => stockChange(req.params.id, qty, req.user.id)))
})
router.post('/products', manager, (req, res) => res.status(201).json(saveProduct(null, req.body, req.user.id)))
router.patch('/products/:id', manager, (req, res) => res.json(saveProduct(req.params.id, req.body, req.user.id)))
router.get('/products/:id/reviews', manager, (req, res) => res.json(reviewList(req.params.id, true)))
router.patch('/reviews/:id/hidden', manager, async (req, res) => {
  const id = reviewId(req.params.id)
  const hidden = boolean(req.body?.hidden, 'Hidden')
  const updated = await sql`UPDATE reviews SET state = ${hidden ? 'hidden' : 'public'} WHERE id = ${id}`
  if (updated.count === 0) fail(404, 'Review not found.')
  const [reviewRow] = await sql`SELECT * FROM reviews WHERE id = ${id}`
  res.json(await review(reviewRow))
})
router.patch('/reviews/:id/comment', manager, async (req, res) => {
  const id = reviewId(req.params.id)
  const comment = text(req.body?.text, 'Comment', { min: 0, max: 2000 })
  const value = comment ? JSON.stringify({ text: comment, at: new Date().toISOString() }) : null
  const updated = await sql`UPDATE reviews SET seller_comment = ${value} WHERE id = ${id}`
  if (updated.count === 0) fail(404, 'Review not found.')
  const [reviewRow] = await sql`SELECT * FROM reviews WHERE id = ${id}`
  res.json(await review(reviewRow))
})

router.get('/users', admin, async (_req, res) => {
  const rows = await sql`SELECT * FROM users ORDER BY id`
  res.json({
    items: rows.map(row => ({ ...publicUser(row), lastActiveAt: '—' })),
    counts: {
      staff: rows.filter(row => row.role === 'staff').length,
      managers: rows.filter(row => row.role === 'manager').length,
      admin: rows.filter(row => row.role === 'admin').length,
    },
  })
})
function changeUser(username, actor, patch) {
  return sql.begin(async () => {
    const [row] = await sql`SELECT * FROM users WHERE username = ${username}`
    if (!row) fail(404, 'User not found.')
    const nextRole = patch.role ?? row.role
    const nextActive = patch.active === undefined ? row.active : Number(patch.active)
    if (row.id === actor.id && (nextRole !== row.role || nextActive !== row.active)) fail(409, 'Cannot modify own account permissions.')
    if (row.role === 'admin' && row.active && (nextRole !== 'admin' || !nextActive)) {
      const [count] = await sql`SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1`
      if (count.n <= 1) fail(409, 'The last active admin must be retained.')
    }
    await sql`UPDATE users SET role = ${nextRole}, active = ${nextActive} WHERE id = ${row.id}`

    if (!nextActive) await sql`UPDATE sessions SET revoked = 1 WHERE user_id = ${row.id}`
    const [updated] = await sql`SELECT * FROM users WHERE id = ${row.id}`
    return { ...publicUser(updated), lastActiveAt: '—' }
  })
}
router.patch('/users/:username/role', admin, (req, res) => {
  const role = req.body?.role
  if (!['buyer','staff','manager','admin'].includes(role)) fail(400, 'Invalid role.')
  res.json(changeUser(req.params.username, req.user, { role }))
})
router.patch('/users/:username/active', admin, (req, res) => {
  const active = boolean(req.body?.active, 'Active')
  res.json(changeUser(req.params.username, req.user, { active }))
})
export default router
