import { Router } from 'express'
import sql from '../db.js'

const router = Router()
router.get('/', async (_req, res) => {
  // Slug is the primary key and stands in for the original SQLite insertion ordering.
  res.json(await sql`SELECT slug,label FROM categories ORDER BY slug`)
})

export default router
