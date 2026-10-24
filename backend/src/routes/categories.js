import { Router } from 'express'
import db from '../db.js'

const router = Router()
router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT slug,label FROM categories ORDER BY rowid').all())
})

export default router
