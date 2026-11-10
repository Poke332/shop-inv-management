import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { fail, integer, text } from '../services/validation.js'
import {
  POOL,
  moveStock,
  upsertWarehouseLocation,
  warehouseMovements,
  warehouseOverview,
} from '../services/warehouse.js'

const router = Router()
// Seluruh /api/warehouse internal: staff/manager/admin.
// Buyer & anonim ditolak oleh requireRole (403/401), bukan 404 —
// konsisten dengan /api/ops.
const manager = requireRole('manager', 'admin')
router.use(requireAuth, requireRole('staff', 'manager', 'admin'))

// Read (staff/manager/admin)
router.get('/', async (_req, res) => res.json(await warehouseOverview()))
router.get('/movements', async (req, res) => {
  const raw = req.query?.limit
  const limit = raw === undefined ? 50 : integer(Number(raw), 'Limit', { min: 1, max: 200 })
  const productId = req.query?.product ? text(req.query.product, 'Product', { max: 100 }) : undefined
  const location = req.query?.location ? text(req.query.location, 'Location', { max: 100 }) : undefined
  res.json({ items: await warehouseMovements({ productId, location, limit }) })
})

// Aksi gudang: hanya manager/admin (matrix existing:Inventory write = manager+).
// Staff tetap bisa LIHAT overview + movements (read-only), sesuai policy.
router.post('/move', manager, async (req, res) => {
  const body = req.body || {}
  const productId = text(body.productId, 'Product ID')
  const from = typeof body.from === 'string' && body.from ? body.from : POOL
  const to = typeof body.to === 'string' && body.to ? body.to : POOL
  const qty = integer(body.qty, 'Qty', { min: 1, max: 1000000 })
  res.status(201).json(await moveStock({ productId, from, to, qty }, req.user.id))
})
router.post('/locations', manager, async (req, res) =>
  res.status(201).json(await upsertWarehouseLocation(req.body || {}, req.user.id, true)))
router.patch('/locations/:id', manager, async (req, res) =>
  res.json(await upsertWarehouseLocation({ ...(req.body || {}), id: req.params.id }, req.user.id, false, req.params.id)))

export default router
