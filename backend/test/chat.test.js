import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import bcrypt from 'bcrypt'
import postgres from 'postgres'

// Same disposable-database pattern as the other suites (see login.test.js).
const maintenanceUrl = process.env.DATABASE_URL
if (!maintenanceUrl) throw new Error('DATABASE_URL must point at a Postgres server to run the suite')
const database = `shop-inv-test-${process.pid}`
const testUrl = new URL(maintenanceUrl)
testUrl.pathname = testUrl.pathname.replace(/\/[^/]*$/, `/${database}`)

process.env.DATABASE_URL = testUrl
process.env.JWT_SECRET = 'test-secret-key-0123456789-abcdef-32ch'
process.env.NODE_ENV = 'test'
delete process.env.ANTHROPIC_API_KEY // the "not configured" test runs first
delete process.env.OPENAI_API_KEY
delete process.env.OPENAI_BASE_URL
delete process.env.CHAT_MODEL
delete process.env.CHAT_PROVIDER

const admin = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
await admin.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
await admin.unsafe(`CREATE DATABASE "${database}"`)
await admin.end()

const { default: sql, initDatabase } = await import('../src/db.js')
const { default: app } = await import('../src/server.js')
const { createOpenAICompatibleClient } = await import('../src/services/chat/openaiCompatible.js')
const { createAnthropicClient } = await import('../src/services/chat/anthropicAdapter.js')
const { runChat } = await import('../src/services/chat/agent.js')
const { normalizeMessages } = await import('../src/services/chat/messages.js')
const { rateLimit } = await import('../src/services/rateLimit.js')
const { executeTool, toolDefinitions } = await import('../src/services/chat/tools.js')
await initDatabase()

const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) })
const base = `http://127.0.0.1:${server.address().port}`

// ---- fixtures: a tiny catalog with known stock, prices and reviews ----------
await sql`INSERT INTO categories(slug,label) VALUES ('audio','Audio'), ('accessories','Accessories')`
const product = (id, category, name, brand, price, original, stock, featured, position, description) => sql`
  INSERT INTO products(id,category_slug,name,brand,price,original_price,stock,featured,on_sale,catalog_position,description)
  VALUES (${id},${category},${name},${brand},${price},${original},${stock},${featured},${original ? 1 : 0},${position},${description})`
await product('P-T1', 'audio', 'Test Earbuds', 'Sonic', 100000, 125000, 7, 1, 0, 'Wireless earbuds with noise cancelling.')
await product('P-T2', 'audio', 'Test Speaker', 'Sonic', 300000, null, 0, 0, 1, 'Portable speaker, sold out.')
await product('P-T3', 'accessories', 'Test Keyboard', 'Keyz', 250000, null, 3, 0, 2, 'Mechanical keyboard.')
await sql`INSERT INTO product_specs(product_id,position,key,value) VALUES ('P-T1',0,'Battery','13 h'), ('P-T1',1,'Bluetooth','5.3')`

const passwordHash = await bcrypt.hash('correct-password', 10)
const [buyer] = await sql`INSERT INTO users(username,email,password_hash,role) VALUES ('rev1','rev1@test.local',${passwordHash},'buyer') RETURNING id`
await sql`INSERT INTO users(username,email,password_hash,role) VALUES ('ops1','ops1@test.local',${passwordHash},'staff')`
const [order] = await sql`INSERT INTO orders(reference,buyer_id,status,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,total)
  VALUES ('WB-X1',${buyer.id},'delivered','r','h','{}','{}','card',100000,100000) RETURNING id`
await sql`INSERT INTO order_lines(order_id,product_id,product_name,unit_price,qty,amount) VALUES (${order.id},'P-T1','Test Earbuds',100000,1,100000)`
const [other] = await sql`INSERT INTO users(username,email,password_hash) VALUES ('rev2','rev2@test.local','x') RETURNING id`
await sql`INSERT INTO reviews(order_id,product_id,buyer_id,rating,body,state) VALUES (${order.id},'P-T1',${buyer.id},5,'Great',${'public'})`
await sql`INSERT INTO reviews(order_id,product_id,buyer_id,rating,body,state) VALUES (${order.id},'P-T1',${other.id},1,'Hidden complaint','hidden')`

// ---- a fake Anthropic API so the real SDK path is exercised end to end ------
const seen = []
const fakeAnthropic = http.createServer((req, res) => {
  let raw = ''
  req.on('data', chunk => { raw += chunk })
  req.on('end', () => {
    const body = JSON.parse(raw)
    seen.push(body)
    if (body.messages[0].content === 'trigger-upstream-error') {
      res.statusCode = 401
      res.setHeader('content-type', 'application/json')
      return res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }))
    }
    const last = body.messages.at(-1)
    const reply = content => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({
        id: 'msg_test', type: 'message', role: 'assistant', model: body.model, content,
        stop_reason: content.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn',
        stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      }))
    }
    const results = Array.isArray(last.content) ? last.content.filter(b => b.type === 'tool_result') : []
    if (results.length) {
      const data = JSON.parse(results[0].content)
      return reply([{ type: 'text', text: `Stock for ${data.products[0].name}: ${data.products[0].stock} units.` }])
    }
    reply([{ type: 'tool_use', id: 'toolu_1', name: 'check_stock', input: { product_id: 'p-t1' } }])
  })
})
await new Promise(resolve => fakeAnthropic.listen(0, '127.0.0.1', resolve))

test.after(async () => {
  await new Promise(resolve => server.close(resolve))
  await new Promise(resolve => fakeAnthropic.close(resolve))
  await sql.end()
  const drop = postgres(maintenanceUrl, { max: 1, onnotice: () => {} })
  await drop.unsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`)
  await drop.unsafe(`DROP DATABASE IF EXISTS "${database}"`)
  await drop.end()
})

const post = (path, body, headers = {}) => fetch(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
})

// ---- message validation -----------------------------------------------------

test('normalizeMessages merges same-role turns, drops leading assistant turns, keeps the last user turn', () => {
  const result = normalizeMessages([
    { role: 'assistant', content: 'Hi! How can I help?' },
    { role: 'user', content: 'do you have earbuds' },
    { role: 'user', content: 'under 2 million' },
  ])
  assert.deepEqual(result, [{ role: 'user', content: 'do you have earbuds\nunder 2 million' }])
})

test('normalizeMessages rejects malformed or oversized input', () => {
  for (const bad of [undefined, [], 'hi', [{ role: 'system', content: 'x' }], [{ role: 'user', content: 5 }],
    [{ role: 'user', content: 'x'.repeat(4001) }], [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }]]) {
    assert.throws(() => normalizeMessages(bad), error => error.status === 400)
  }
})

test('normalizeMessages keeps only the most recent turns', () => {
  const long = Array.from({ length: 60 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
  long.push({ role: 'assistant', content: 'a' }, { role: 'user', content: 'last' })
  const result = normalizeMessages(long)
  assert.ok(result.length <= 20)
  assert.equal(result[0].role, 'user')
  assert.equal(result.at(-1).content, 'last')
})

// ---- agent loop (fake client, OpenAI shapes) ---------------------------------

const scripted = responses => {
  const calls = []
  return { calls, messages: { create: async params => { calls.push(structuredClone(params)); return responses.shift() } } }
}

test('runChat returns plain text when the model does not use tools', async () => {
  const client = scripted([{ message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }])
  const result = await runChat({ client, model: 'm', system: 's', tools: [], executeTool: async () => ({}), messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(result, { reply: 'Hello!', toolsUsed: [] })
})

test('runChat runs requested tools and sends the results back to the model', async () => {
  const call = { id: 'tu_1', type: 'function', function: { name: 'check_stock', arguments: '{"product_id":"P-1"}' } }
  const client = scripted([
    { message: { role: 'assistant', content: 'Checking…', tool_calls: [call] }, finish_reason: 'tool_calls' },
    { message: { role: 'assistant', content: '12 units.' }, finish_reason: 'stop' },
  ])
  const executed = []
  const result = await runChat({
    client, model: 'm', system: 's', tools: [],
    executeTool: async (name, input) => { executed.push([name, input]); return { stock: 12 } },
    messages: [{ role: 'user', content: 'stock?' }],
  })
  assert.deepEqual(executed, [['check_stock', { product_id: 'P-1' }]])
  assert.equal(result.reply, '12 units.')
  assert.deepEqual(result.toolsUsed, ['check_stock'])
  const second = client.calls[1].messages
  assert.equal(second.at(-2).role, 'assistant')
  assert.deepEqual(second.at(-2).tool_calls, [call])
  assert.deepEqual(second.at(-1), { role: 'tool', tool_call_id: 'tu_1', content: '{"stock":12}' })
})

test('runChat reports a failing tool to the model as an error result instead of crashing', async () => {
  const client = scripted([
    { message: { role: 'assistant', content: null, tool_calls: [{ id: 'tu_1', type: 'function', function: { name: 'search_products', arguments: '' } }] }, finish_reason: 'tool_calls' },
    { message: { role: 'assistant', content: 'Sorry, I could not look that up.' }, finish_reason: 'stop' },
  ])
  const result = await runChat({
    client, model: 'm', system: 's', tools: [],
    executeTool: async () => { throw new Error('db down') },
    messages: [{ role: 'user', content: 'x' }],
  })
  assert.equal(result.reply, 'Sorry, I could not look that up.')
  const toolMessage = client.calls[1].messages.at(-1)
  assert.equal(toolMessage.role, 'tool')
  assert.match(toolMessage.content, /could not retrieve that information/i)
})

test('runChat stops after maxSteps when the model keeps calling tools', async () => {
  const loop = () => ({
    message: { role: 'assistant', content: null, tool_calls: [{ id: 'tu', type: 'function', function: { name: 'list_categories', arguments: '{}' } }] },
    finish_reason: 'tool_calls',
  })
  const client = scripted([loop(), loop(), loop()])
  const result = await runChat({ client, model: 'm', system: 's', tools: [], executeTool: async () => ({}), messages: [{ role: 'user', content: 'x' }], maxSteps: 3 })
  assert.equal(client.calls.length, 3)
  assert.match(result.reply, /could not finish/i)
})

// ---- rate limiter -----------------------------------------------------------

test('rateLimit blocks requests over the limit and reports Retry-After', () => {
  const limiter = rateLimit({ limit: 2, windowMs: 60_000 })
  const run = () => {
    const out = { headers: {} }
    const res = { set: (k, v) => { out.headers[k] = v }, status(code) { out.status = code; return this }, json(body) { out.body = body } }
    let passed = false
    limiter({ ip: '1.2.3.4' }, res, () => { passed = true })
    return { passed, ...out }
  }
  assert.equal(run().passed, true)
  assert.equal(run().passed, true)
  const blocked = run()
  assert.equal(blocked.passed, false)
  assert.equal(blocked.status, 429)
  assert.ok(Number(blocked.headers['Retry-After']) >= 1)
})

// ---- tools against the real schema ------------------------------------------

test('every tool definition has a handler and a valid parameter schema', async () => {
  assert.deepEqual(toolDefinitions.map(t => t.function.name).sort(),
    ['check_stock', 'get_product_details', 'list_categories', 'recommend_products', 'search_products'])
  for (const tool of toolDefinitions) {
    assert.equal(tool.type, 'function')
    assert.equal(tool.function.parameters.type, 'object')
  }
})

test('check_stock reads live stock and is case-insensitive on the id', async () => {
  const result = await executeTool('check_stock', { product_id: 'p-t1' })
  assert.equal(result.products[0].stock, 7)
  assert.equal(result.products[0].stockStatus, 'in_stock')
  await sql`UPDATE products SET stock = 2 WHERE id = 'P-T1'`
  assert.equal((await executeTool('check_stock', { product_id: 'P-T1' })).products[0].stockStatus, 'low_stock')
  await sql`UPDATE products SET stock = 7 WHERE id = 'P-T1'`
  assert.equal((await executeTool('check_stock', { product_id: 'P-T2' })).products[0].stockStatus, 'out_of_stock')
  assert.equal((await executeTool('check_stock', { product_id: 'P-NOPE' })).found, false)
})

test('search_products applies price, stock and category filters and ignores hidden reviews in ratings', async () => {
  const earbuds = await executeTool('search_products', { query: 'earbuds' })
  assert.equal(earbuds.products[0].id, 'P-T1')
  assert.equal(earbuds.products[0].rating, 5, 'the hidden 1-star review must not count')
  assert.equal(earbuds.products[0].reviewCount, 1)
  assert.equal(earbuds.products[0].discountPercent, 20)
  assert.equal(earbuds.products[0].priceFormatted, 'Rp 100.000')

  const cheap = await executeTool('search_products', { max_price: 260000 })
  assert.ok(cheap.products.every(p => p.price <= 260000))
  const inStock = await executeTool('search_products', { in_stock_only: true })
  assert.ok(inStock.products.every(p => p.stock > 0))
  assert.equal((await executeTool('search_products', { category: 'accessories' })).products.length, 1)
})

test('filters still hold when a multi-word query falls back to matching any keyword', async () => {
  // "earbuds keyboard" matches no single product, so the OR fallback runs; the price cap must still apply.
  const result = await executeTool('search_products', { query: 'earbuds keyboard', max_price: 120000 })
  assert.ok(result.note)
  assert.deepEqual(result.products.map(p => p.id), ['P-T1'])
  const none = await executeTool('search_products', { query: 'earbuds keyboard', category: "x' OR '1'='1" })
  assert.equal(none.count, 0)
})

test('hostile input is treated as plain text', async () => {
  const result = await executeTool('search_products', { query: "'; DROP TABLE products;--" })
  assert.ok(Array.isArray(result.products))
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM products`
  assert.equal(n, 3)
})

test('recommend_products only returns in-stock items, with data-backed reasons', async () => {
  const result = await executeTool('recommend_products', { category: 'audio' })
  assert.deepEqual(result.recommendations.map(p => p.id), ['P-T1'], 'the sold-out speaker must be excluded')
  assert.ok(result.recommendations[0].reasons.some(r => r.includes('5/5')))
  assert.equal((await executeTool('recommend_products', { max_price: 50000 })).count, 0)
})

test('get_product_details returns specs and public reviews only', async () => {
  const result = await executeTool('get_product_details', { product_id: 'P-T1' })
  assert.deepEqual(result.specs, [{ Battery: '13 h' }, { Bluetooth: '5.3' }])
  assert.equal(result.customerReviews.length, 1)
  assert.equal(result.customerReviews[0].text, 'Great')
  assert.equal((await executeTool('get_product_details', { product_id: 'nope' })).found, false)
})

// ---- HTTP endpoint (real SDK -> fake Anthropic server -> real database) -----

test('POST /api/chat answers 503 when no API key is configured', async () => {
  // CHAT_PROVIDER is unset (the code default is openai) and every provider key
  // is deleted at the top of this file, so the default path has no key.
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(res.status, 503)
  assert.equal((await res.json()).code, 'CHAT_UNAVAILABLE')
})

test('POST /api/chat answers 503 for an unknown provider or a missing provider key', async () => {
  process.env.CHAT_PROVIDER = 'gpt'
  let res = await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(res.status, 503, 'unknown provider name')
  assert.equal((await res.json()).code, 'CHAT_UNAVAILABLE')

  process.env.CHAT_PROVIDER = 'openai'
  res = await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(res.status, 503, 'openai provider without OPENAI_API_KEY')
  assert.equal((await res.json()).code, 'CHAT_UNAVAILABLE')
  delete process.env.CHAT_PROVIDER
})

test('POST /api/chat rejects invalid payloads with 400', async () => {
  for (const body of [{}, { messages: [] }, { messages: [{ role: 'user', content: '' }] }]) {
    assert.equal((await post('/api/chat', body)).status, 400)
  }
})

test('POST /api/chat runs the full tool loop and returns an answer built from database data', async () => {
  process.env.CHAT_PROVIDER = 'anthropic'
  process.env.ANTHROPIC_API_KEY = 'test-key'
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fakeAnthropic.address().port}`
  seen.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'Is the Test Earbuds in stock?' }] })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.reply, 'Stock for Test Earbuds: 7 units.')
  assert.deepEqual(body.toolsUsed, ['check_stock'])

  assert.equal(seen.length, 2, 'one request for the tool call, one for the final answer')
  assert.equal(seen[0].model, 'claude-haiku-5-5')
  assert.deepEqual(seen[0].tools.map(t => t.name), toolDefinitions.map(t => t.function.name))
  assert.match(seen[0].system, /not signed in \(guest\)/)
  assert.match(seen[0].system, /Sunset Electronics/)
  assert.equal(seen[1].messages.at(-1).content[0].type, 'tool_result', 'the tool result is sent back in Anthropic wire shape')
  delete process.env.CHAT_PROVIDER
})

test('POST /api/chat tailors the system prompt to the signed-in role', async () => {
  process.env.CHAT_PROVIDER = 'anthropic'
  const login = await post('/api/auth/login', { email: 'ops1@test.local', password: 'correct-password' })
  const { token } = await login.json()
  seen.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'How do I advance an order?' }] }, { authorization: `Bearer ${token}` })
  assert.equal(res.status, 200)
  assert.match(seen[0].system, /"staff" role/)
  delete process.env.CHAT_PROVIDER
})

test('POST /api/chat answers a clean 503 (not a crash, no leaked details) when the model API fails', async () => {
  process.env.CHAT_PROVIDER = 'anthropic'
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'trigger-upstream-error' }] })
  assert.equal(res.status, 503)
  const body = await res.json()
  assert.equal(body.code, 'CHAT_UNAVAILABLE')
  assert.doesNotMatch(JSON.stringify(body), /x-api-key|authentication/i)
  delete process.env.CHAT_PROVIDER
})

test('Anthropic adapter translates the canonical OpenAI shape to the Anthropic wire in both directions', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fakeAnthropic.address().port}`
  seen.length = 0
  const client = createAnthropicClient()
  const call = { id: 'toolu_1', type: 'function', function: { name: 'check_stock', arguments: '{"product_id":"p-t1"}' } }
  const first = await client.messages.create({
    model: 'claude-haiku-5-5', max_tokens: 100, system: 'SYS', tools: toolDefinitions,
    messages: [{ role: 'user', content: 'stock?' }],
  })
  assert.equal(first.finish_reason, 'tool_calls')
  assert.deepEqual(first.message.tool_calls, [call])
  const wireOut = seen[0]
  assert.equal(wireOut.system, 'SYS')
  assert.deepEqual(wireOut.tools.map(t => t.name), toolDefinitions.map(t => t.function.name))
  assert.equal(wireOut.tools[0].input_schema.type, 'object')
  assert.deepEqual(wireOut.messages, [{ role: 'user', content: 'stock?' }])

  const second = await client.messages.create({
    model: 'claude-haiku-5-5', max_tokens: 100, system: 'SYS', tools: toolDefinitions,
    messages: [
      { role: 'user', content: 'stock?' },
      { role: 'assistant', content: null, tool_calls: [call] },
      { role: 'tool', tool_call_id: 'toolu_1', content: '{"products":[{"name":"Test Earbuds","stock":7}]}' },
    ],
  })
  assert.equal(second.finish_reason, 'stop')
  assert.equal(second.message.content, 'Stock for Test Earbuds: 7 units.')
  const wireIn = seen[1]
  assert.deepEqual(wireIn.messages.map(m => m.role), ['user', 'assistant', 'user'])
  assert.equal(wireIn.messages[1].content[0].type, 'tool_use')
  assert.deepEqual(wireIn.messages[1].content[0].input, { product_id: 'p-t1' })
  assert.deepEqual(wireIn.messages[2].content, [{ type: 'tool_result', tool_use_id: 'toolu_1', content: '{"products":[{"name":"Test Earbuds","stock":7}]}' }])
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_BASE_URL
})

test('POST /api/chat honors an explicit CHAT_PROVIDER=anthropic even when the openai key is present', async () => {
  process.env.CHAT_PROVIDER = 'anthropic'
  process.env.ANTHROPIC_API_KEY = 'test-key'
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fakeAnthropic.address().port}`
  process.env.OPENAI_API_KEY = 'openai-key'
  seen.length = 0
  seenOpenAI.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'Is the Test Earbuds in stock?' }] })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).reply, 'Stock for Test Earbuds: 7 units.')
  assert.equal(seen[0].model, 'claude-haiku-5-5', 'the explicit anthropic choice wins over the default provider')
  assert.equal(seenOpenAI.length, 0, 'the anthropic choice must not reach the openai path')
  delete process.env.CHAT_PROVIDER
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_BASE_URL
  delete process.env.OPENAI_API_KEY
})

// ---- OpenAI-compatible provider (openai) --------------------------------------

const seenOpenAI = []
const fakeOpenAI = http.createServer((req, res) => {
  let raw = ''
  req.on('data', chunk => { raw += chunk })
  req.on('end', () => {
    const body = JSON.parse(raw)
    seenOpenAI.push({ url: req.url, auth: req.headers.authorization, body })
    const reply = (message, finishReason) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ choices: [{ message, finish_reason: finishReason }] })) }
    const toolMessage = body.messages.findLast(m => m.role === 'tool')
    if (toolMessage) {
      const data = JSON.parse(toolMessage.content)
      return reply({ role: 'assistant', content: `Stock for ${data.products[0].name}: ${data.products[0].stock} units.` }, 'stop')
    }
    reply({ role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'check_stock', arguments: '{"product_id":"P-T1"}' } }] }, 'tool_calls')
  })
})
await new Promise(resolve => fakeOpenAI.listen(0, '127.0.0.1', resolve))
test.after(() => new Promise(resolve => fakeOpenAI.close(resolve)))

test('OpenAI-compatible adapter passes the canonical shape through untranslated', async () => {
  seenOpenAI.length = 0
  const client = createOpenAICompatibleClient({ apiKey: 'sk-test', baseURL: `http://127.0.0.1:${fakeOpenAI.address().port}/v1/` })
  const call = { id: 'call_1', type: 'function', function: { name: 'check_stock', arguments: '{"product_id":"P-T1"}' } }
  const first = await client.messages.create({
    model: 'free-model', max_tokens: 50, system: 'SYS', tools: toolDefinitions,
    messages: [{ role: 'user', content: 'stock?' }],
  })
  assert.equal(first.finish_reason, 'tool_calls')
  assert.deepEqual(first.message.tool_calls, [call])
  const sent = seenOpenAI[0]
  assert.equal(sent.auth, 'Bearer sk-test')
  assert.equal(sent.body.messages[0].role, 'system')
  assert.equal(sent.body.messages[0].content, 'SYS')
  assert.equal(sent.body.tools[0].type, 'function')
  assert.deepEqual(sent.body.tools.map(t => t.function.name), toolDefinitions.map(t => t.function.name))
  assert.equal(sent.body.tools[0].function.parameters.type, 'object')

  const second = await client.messages.create({
    model: 'free-model', max_tokens: 50, system: 'SYS', tools: toolDefinitions,
    messages: [
      { role: 'user', content: 'stock?' },
      { role: 'assistant', content: null, tool_calls: [call] },
      { role: 'tool', tool_call_id: 'call_1', content: '{"products":[{"name":"X","stock":4}]}' },
    ],
  })
  assert.equal(second.finish_reason, 'stop')
  assert.equal(second.message.content, 'Stock for X: 4 units.')
  const roles = seenOpenAI[1].body.messages.map(m => m.role)
  assert.deepEqual(roles, ['system', 'user', 'assistant', 'tool'])
  assert.equal(seenOpenAI[1].body.messages[2].tool_calls[0].function.arguments, '{"product_id":"P-T1"}')
  assert.equal(seenOpenAI[1].body.messages[3].tool_call_id, 'call_1')
})

test('OpenAI-compatible adapter surfaces provider errors with their status', async () => {
  const failing = http.createServer((_req, res) => { res.statusCode = 429; res.end('{"error":{"message":"rate limited","code":429}}') })
  await new Promise(resolve => failing.listen(0, '127.0.0.1', resolve))
  const client = createOpenAICompatibleClient({ apiKey: 'k', baseURL: `http://127.0.0.1:${failing.address().port}` })
  await assert.rejects(client.messages.create({ model: 'm', max_tokens: 5, system: 's', tools: [], messages: [{ role: 'user', content: 'x' }] }), error => error.status === 429)
  await new Promise(resolve => failing.close(resolve))
})

test('POST /api/chat reaches OpenRouter through CHAT_PROVIDER=openai + OPENAI_BASE_URL', async () => {
  // The local fake stands in for an OpenRouter-compatible /v1 host; in
  // production this is OPENAI_BASE_URL=https://openrouter.ai/api/v1.
  process.env.CHAT_PROVIDER = 'openai'
  delete process.env.CHAT_MODEL
  process.env.OPENAI_API_KEY = 'openai-key'
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${fakeOpenAI.address().port}/v1`
  seenOpenAI.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'Is Test Earbuds in stock?' }] })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { reply: 'Stock for Test Earbuds: 7 units.', toolsUsed: ['check_stock'] })
  assert.equal(seenOpenAI[0].url, '/v1/chat/completions')
  assert.equal(seenOpenAI[0].body.model, 'gpt-4o-mini', 'openai default model')
  assert.equal(seenOpenAI[0].auth, 'Bearer openai-key')
  delete process.env.CHAT_PROVIDER
})

test('CHAT_PROVIDER=openrouter is no longer a provider: answers 503 CHAT_UNAVAILABLE', async () => {
  // "openrouter" was the old name for an OpenAI-compatible host. It is now an
  // unrecognized provider, so even with a usable openai key the endpoint
  // answers 503 and never reaches the OpenAI-compatible path.
  process.env.CHAT_PROVIDER = 'openrouter'
  process.env.OPENAI_API_KEY = 'openai-key'
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${fakeOpenAI.address().port}/v1`
  seenOpenAI.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(res.status, 503)
  assert.equal((await res.json()).code, 'CHAT_UNAVAILABLE')
  assert.equal(seenOpenAI.length, 0, 'the unrecognized provider must not reach the openai path')
  delete process.env.CHAT_PROVIDER
  delete process.env.OPENAI_API_KEY
  delete process.env.OPENAI_BASE_URL
})

test('POST /api/chat uses the openai client when CHAT_PROVIDER is unset', async () => {
  delete process.env.CHAT_PROVIDER
  delete process.env.ANTHROPIC_API_KEY
  process.env.OPENAI_API_KEY = 'openai-key'
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${fakeOpenAI.address().port}/v1`
  delete process.env.CHAT_MODEL
  seenOpenAI.length = 0
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'Is Test Earbuds in stock?' }] })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { reply: 'Stock for Test Earbuds: 7 units.', toolsUsed: ['check_stock'] })
  assert.equal(seenOpenAI[0].url, '/v1/chat/completions')
  assert.equal(seenOpenAI[0].body.model, 'gpt-4o-mini', 'the default path uses the openai default model')
  delete process.env.OPENAI_API_KEY
  delete process.env.OPENAI_BASE_URL
})
