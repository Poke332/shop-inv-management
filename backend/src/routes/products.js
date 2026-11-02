import { Router } from 'express'
import db from '../db.js'
import { product, reviewList } from '../services/serializer.js'
import { fail } from '../services/validation.js'

const router = Router()
router.get('/', (req, res) => {
  const conditions = []
  const values = []
  for (const [param, column] of [['category', 'category_slug'], ['brand', 'brand']]) {
    if (req.query[param] !== undefined) {
      if (typeof req.query[param] !== 'string') fail(400, 'The filter must be text.')
      conditions.push(`${column} = ?`)
      values.push(req.query[param])
    }
  }
  if (req.query.query !== undefined) {
    if (typeof req.query.query !== 'string' || req.query.query.length > 200) fail(400, 'Invalid query.')
    conditions.push('(instr(lower(name), lower(?)) > 0 OR instr(lower(brand), lower(?)) > 0)')
    values.push(req.query.query, req.query.query)
  }
  for (const [param, operator] of [['priceMin', '>='], ['priceMax', '<=']]) {
    if (req.query[param] !== undefined) {
      const value = Number(req.query[param])
      if (typeof req.query[param] !== 'string' || !Number.isSafeInteger(value) || value < 0) fail(400, 'Invalid price range.')
      conditions.push(`price ${operator} ?`)
      values.push(value)
    }
  }
  const sorts = {
    featured: 'featured DESC, on_sale DESC, price ASC, catalog_position ASC',
    'price-asc': 'price ASC, catalog_position ASC',
    'price-desc': 'price DESC, catalog_position ASC',
    catalog: 'catalog_position ASC',
  }
  const sort = req.query.sort || 'featured'
  if (!Object.hasOwn(sorts, sort)) fail(400, 'Unrecognized sort.')
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = db.prepare('SELECT * FROM products' + where + ' ORDER BY ' + sorts[sort]).all(...values)
  res.json({ items: rows.map(product), total: rows.length, hasMore: false })
})
router.get('/:id/reviews', (req, res) => res.json(reviewList(req.params.id)))
router.get('/:id', (req, res) => {
  res.json(product(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)))
})

export default router
