import { Router } from 'express'
import sql from '../db.js'
import { product, reviewList } from '../services/serializer.js'
import { fail } from '../services/validation.js'

const router = Router()
router.get('/', async (req, res) => {
  // Column names and operators come from fixed maps; only the values are user-derived,
  // so the assembled text is safe to pass to sql.unsafe with positional parameters.
  const conditions = []
  const values = []
  const ref = value => { values.push(value); return `$${values.length}` }
  for (const [param, column] of [['category', 'category_slug'], ['brand', 'brand']]) {
    if (req.query[param] !== undefined) {
      if (typeof req.query[param] !== 'string') fail(400, 'The filter must be text.')
      conditions.push(`${column} = ${ref(req.query[param])}`)
    }
  }
  if (req.query.query !== undefined) {
    if (typeof req.query.query !== 'string' || req.query.query.length > 200) fail(400, 'Invalid query.')
    const needle = ref(req.query.query)
    conditions.push(`(position(lower(${needle}) in lower(name)) > 0 OR position(lower(${needle}) in lower(brand)) > 0)`)
  }
  for (const [param, operator] of [['priceMin', '>='], ['priceMax', '<=']]) {
    if (req.query[param] !== undefined) {
      const value = Number(req.query[param])
      if (typeof req.query[param] !== 'string' || !Number.isSafeInteger(value) || value < 0) fail(400, 'Invalid price range.')
      conditions.push(`price ${operator} ${ref(value)}`)
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
  const rows = await sql.unsafe(`SELECT * FROM products${where} ORDER BY ${sorts[sort]}`, values)
  res.json({ items: await Promise.all(rows.map(product)), total: rows.length, hasMore: false })
})
router.get('/:id/reviews', (req, res) => res.json(reviewList(req.params.id)))
router.get('/:id', async (req, res) => {
  const [row] = await sql`SELECT * FROM products WHERE id = ${req.params.id}`
  res.json(await product(row))
})

export default router
