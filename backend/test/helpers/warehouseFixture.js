// Isolated local fixture ONLY. Never reads .env or connects to a hosted database.
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { once } from 'node:events'

export async function startWarehouseFixture({ apiPort = 0, pgPort = 0 } = {}) {
  if (process.env.DATABASE_URL) throw new Error('Fixture refuses a pre-existing DATABASE_URL; run without dotenv.')
  const db = new PGlite() // in-memory PostgreSQL WASM, no user database files
  await db.waitReady
  const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: pgPort, maxConnections: 30 })
  await socket.start()
  process.env.DATABASE_URL = `postgres://postgres:postgres@${socket.getServerConn()}/postgres`
  process.env.JWT_SECRET = 'warehouse-isolated-fixture-only-not-for-production-2026'
  process.env.NODE_ENV = 'test'
  process.env.FRONTEND_ORIGIN = process.env.FIXTURE_FRONTEND_ORIGIN || 'http://127.0.0.1:5179' // isolated fixture browser only
  // PGlite is single-session: do not multiplex unnamed statements from separate clients.
  process.env.DB_POOL_MAX = '1'
  const { default: sql, initDatabase } = await import('../../src/db.js')
  await initDatabase()
  const password = await bcrypt.hash('Fixture-only-2026!', 4)
  for (const [id,role] of [[1,'manager'],[2,'staff'],[3,'buyer'],[4,'admin']]) {
    await sql`INSERT INTO users(id,username,email,password_hash,role) VALUES (${id},${'fixture-'+role},${role+'@warehouse.test'},${password},${role})`
    await sql`INSERT INTO sessions(jti,user_id,expires_at) VALUES (${'fixture-'+role},${id},${'2099-01-01T00:00:00.000Z'})`
  }
  await sql`INSERT INTO categories(slug,label) VALUES ('fixture','Isolated test fixture')`
  for (const [id,name,stock] of [['FIXTURE-1','Fixture keyboard',12],['FIXTURE-2','Fixture mouse',8]]) {
    await sql`INSERT INTO products(id,category_slug,name,brand,price,stock,description,image) VALUES (${id},'fixture',${name},'TEST FIXTURE',100000,${stock},'Isolated local test data, not user inventory','')`
  }
  const tokens = Object.fromEntries(['manager','staff','buyer','admin'].map((role,i)=>[role,jwt.sign({ jti:'fixture-'+role },process.env.JWT_SECRET,{subject:String(i+1),issuer:'sunset-api',audience:'sunset-web',expiresIn:'2h'})]))
  const { default: app } = await import('../../src/server.js')
  const server = app.listen(apiPort,'127.0.0.1')
  await once(server,'listening')
  const base = `http://127.0.0.1:${server.address().port}/api`
  async function request(path, { method='GET', body, role='manager' }={}) {
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(role?{Authorization:`Bearer ${tokens[role]}`}:{})},body:body===undefined?undefined:JSON.stringify(body)})
    return {status:response.status,body:await response.json()}
  }
  async function close() {
    await new Promise(resolve=>server.close(resolve)); server.closeAllConnections()
    await sql.end({timeout:2});await socket.stop();await db.close()
  }
  return { sql, request, tokens, base, close }
}
