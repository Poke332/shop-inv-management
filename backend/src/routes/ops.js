import { Router } from 'express'
import db from '../db.js'
import { requireAuth, requireRole, publicUser } from '../middleware/auth.js'
import { order, product, review, reviewList } from '../services/serializer.js'
import { stockChange, saveProduct } from '../services/management.js'
import { fail, integer, text, boolean, reviewId } from '../services/validation.js'

const router = Router()
const manager = requireRole('manager', 'admin')
const admin = requireRole('admin')
router.use(requireAuth, requireRole('staff', 'manager', 'admin'))

router.get('/orders', (req, res) => {
  const status = req.query.status || 'all'
  const flow = ['pending', 'processing', 'shipped', 'delivered']
  if (status !== 'all' && !flow.includes(status)) fail(400, 'Unknown status.')
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all()
  const tabs = { all: rows.length, pending: 0, processing: 0, shipped: 0, delivered: 0 }
  for (const row of rows) tabs[row.status]++
  res.json({ items: rows.filter(row => status === 'all' || row.status === status).map(order), tabs })
})
router.patch('/orders/:id/status', (req, res) => {
  const result = db.transaction(() => {
    const row = db.prepare('SELECT * FROM orders WHERE reference = ?').get(req.params.id)
    if (!row) fail(404, 'Order not found.')
    const flow = ['pending', 'processing', 'shipped', 'delivered']
    const next = req.body?.status
    if (flow.indexOf(next) !== flow.indexOf(row.status) + 1) fail(409, 'Status must advance by one step.')
    db.prepare('UPDATE orders SET status=?,updated_at=? WHERE id=?').run(next, new Date().toISOString(), row.id)
    return order(db.prepare('SELECT * FROM orders WHERE id = ?').get(row.id))
  }).immediate()
  res.json(result)
})
router.get('/stock', (_req, res) => {
  const items = db.prepare(`SELECT * FROM products WHERE stock <= low_stock_threshold
    ORDER BY CASE WHEN stock=0 THEN 0 ELSE 1 END, stock ASC, catalog_position ASC`).all().map(row => ({
      productId: row.id, name: row.name, category: row.category_slug,
      price: row.price, stock: row.stock, status: row.stock === 0 ? 'out' : 'low',
    }))
  res.json({ items, total: items.length })
})
router.patch('/stock/:id', manager, (req, res) => {
  const qty = integer(req.body?.qty, 'Stock', { max: 1000000 })
  res.json(stockChange(req.params.id, qty, req.user.id))
})
router.post('/products', manager, (req, res) => res.status(201).json(saveProduct(null, req.body, req.user.id)))
router.patch('/products/:id', manager, (req, res) => res.json(saveProduct(req.params.id, req.body, req.user.id)))
router.get('/products/:id/reviews', manager, (req, res) => res.json(reviewList(req.params.id, true)))
router.patch('/reviews/:id/hidden', manager, (req, res) => {
  const id = reviewId(req.params.id)
  const hidden = boolean(req.body?.hidden, 'Hidden')
  if (!db.prepare('UPDATE reviews SET state = ? WHERE id = ?').run(hidden ? 'hidden' : 'public', id).changes) fail(404, 'Review not found.')
  res.json(review(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)))
})
router.patch('/reviews/:id/comment', manager, (req, res) => {
  const id = reviewId(req.params.id)
  const comment = text(req.body?.text, 'Comment', { min: 0, max: 2000 })
  const value = comment ? JSON.stringify({ text: comment, at: new Date().toISOString() }) : null
  if (!db.prepare('UPDATE reviews SET seller_comment = ? WHERE id = ?').run(value, id).changes) fail(404, 'Review not found.')
  res.json(review(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)))
})

router.get('/users', admin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY id').all()
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
  return db.transaction(() => {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!row) fail(404, 'User not found.')
    const nextRole = patch.role ?? row.role
    const nextActive = patch.active === undefined ? row.active : Number(patch.active)
    if (row.id === actor.id && (nextRole !== row.role || nextActive !== row.active)) fail(409, 'Cannot modify own account permissions.')
    if (row.role === 'admin' && row.active && (nextRole !== 'admin' || !nextActive)) {
      const count = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").get().n
      if (count <= 1) fail(409, 'The last active admin must be retained.')
    }
    db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(nextRole, nextActive, row.id)

    if (!nextActive) db.prepare('UPDATE sessions SET revoked=1 WHERE user_id=?').run(row.id)
    return { ...publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(row.id)), lastActiveAt: '—' }
  }).immediate()
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
