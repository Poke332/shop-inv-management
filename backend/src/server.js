import express from 'express'
import cors from 'cors'
import { uploadsDir } from './db.js'
import { purgeExpiredSessions } from './services/sessions.js'
import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'
import opsRouter from './routes/ops.js'

const app = express()
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5174' }))
app.use(express.json({ limit: '2mb' }))
app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/ops', opsRouter)
// Sajikan gambar unggahan produk secara statis.
app.use('/uploads', express.static(uploadsDir))
app.use((_req, res) => res.status(404).json({ message: 'Endpoint not found' }))
app.use((error, _req, res, _next) => {
  console.error(error.message)
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : error.message,
    ...(error.code && status < 500 ? { code: error.code } : {}),
    ...(error.conflicts ? { conflicts: error.conflicts } : {}),
  })
})


if (process.env.NODE_ENV !== 'test') {
  const SESSION_PURGE_INTERVAL_MS = 3600 * 1000 // Hourly housekeeping sweep.
  purgeExpiredSessions()
  const purgeTimer = setInterval(() => purgeExpiredSessions(), SESSION_PURGE_INTERVAL_MS)
  purgeTimer.unref()
  const port = Number(process.env.PORT || 3000)
  app.listen(port, '127.0.0.1', () => console.log(`Sunset API: http://localhost:${port}/api/health`))
}
export default app
