import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { startWarehouseFixture } from './helpers/warehouseFixture.js'
const fixture = await startWarehouseFixture()
after(() => fixture.close())
const { sql } = fixture
const service = await import('../src/services/warehouse.js')
const { stockChange } = await import('../src/services/management.js')
test('parallel browser reads do not corrupt the isolated PostgreSQL wire session', async () => {
 const paths=['/auth/me','/warehouse','/warehouse/movements','/products','/ops/orders']
 const results=await Promise.all(paths.map(path=>fixture.request(path)))
 assert.deepEqual(results.map(r=>r.status),paths.map(()=>200),JSON.stringify(results))
})
test('product and order HTTP lists serialize every row with the real SQL connection', async () => {
 const products = await fixture.request('/products', {role:null})
 assert.equal(products.status,200,JSON.stringify(products.body))
 assert.equal(products.body.items.length,2)
 assert.ok(products.body.items.every(item=>Array.isArray(item.specs)))
 for (const reference of ['FIXTURE-ORDER-1','FIXTURE-ORDER-2']) {
  await sql`INSERT INTO orders(reference,buyer_id,client_request_id,request_hash,buyer_contact,shipping_address,payment_method,subtotal,shipping,total)
   VALUES (${reference},3,${reference},'fixture','{}','{}','bank_transfer',100000,0,100000)`
 }
 for (const [path,role] of [['/ops/orders','manager'],['/orders/mine','buyer']]) {
  const result=await fixture.request(path,{role})
  assert.equal(result.status,200,JSON.stringify(result.body))
  const items=Array.isArray(result.body)?result.body:result.body.items
  assert.equal(items.length,2)
  assert.ok(items.every(item=>Array.isArray(item.lines)&&item.buyer==='fixture-buyer'))
 }
})
test('PG migrations and POOL → full bin → another bin → POOL persist through HTTP readback', async () => {
 const call=fixture.request
 const overview=await call('/warehouse')
 assert.equal(overview.status,200)
 assert.equal(overview.body.items.length,17)
 for (const [from,to] of [['POOL','ZA-R1-B1'],['ZA-R1-B1','ZA-R1-B2'],['ZA-R1-B2','POOL']]) {
   const result=await call('/warehouse/move',{method:'POST',body:{productId:'FIXTURE-1',from,to,qty:12}})
   assert.equal(result.status,201,JSON.stringify(result.body))
   const live=(await call('/warehouse')).body
   assert.equal(live.unallocated.find(p=>p.productId==='FIXTURE-1').unallocated,to==='POOL'?12:0)
 }
 assert.equal(Number((await sql`SELECT count(*) AS n FROM warehouse_movements`)[0].n),3)
})
test('manual stock reduction settles allocations atomically on the same PG transaction',async()=>{
 await service.moveStock({productId:'FIXTURE-1',to:'ZA-R1-B1',qty:12},1)
 await sql.begin(tx=>stockChange('FIXTURE-1',5,1,tx))
 const live=await service.warehouseOverview()
 assert.equal(live.unallocated.find(p=>p.productId==='FIXTURE-1').allocated,5)
})
test('invalid moves roll back allocations and audit rows',async()=>{
 const before=JSON.stringify((await fixture.request('/warehouse')).body)
 const count=Number((await sql`SELECT count(*) AS n FROM warehouse_movements`)[0].n)
 for(const [body,status] of [
  [{productId:'FIXTURE-2',to:'ZA-R1-B2',qty:0},400],
  [{productId:'FIXTURE-2',to:'ZA-R1-B2',qty:1.5},400],
  [{productId:'FIXTURE-2',from:'ZA-R1-B2',to:'POOL',qty:1},409],
  [{productId:'FIXTURE-2',to:'ZA-R1-B2',qty:9},409],
  [{productId:'FIXTURE-2',to:'missing',qty:1},404],
  [{productId:'FIXTURE-2',from:'POOL',to:'POOL',qty:1},400]
 ])assert.equal((await fixture.request('/warehouse/move',{method:'POST',body})).status,status)
 assert.equal(JSON.stringify((await fixture.request('/warehouse')).body),before)
 assert.equal(Number((await sql`SELECT count(*) AS n FROM warehouse_movements`)[0].n),count)
})
test('capacity, inactive locations and fixed pool are protected',async()=>{
 const call=fixture.request
 const created=await call('/warehouse/locations',{method:'POST',body:{code:'T1-01',zone:'Test',label:'Fixture only',capacity:2}})
 assert.equal(created.status,201,JSON.stringify(created.body));const id=created.body.id
 assert.equal((await call('/warehouse/move',{method:'POST',body:{productId:'FIXTURE-2',to:id,qty:3}})).status,409)
 assert.equal((await call('/warehouse/move',{method:'POST',body:{productId:'FIXTURE-2',to:id,qty:2}})).status,201)
 assert.equal((await call('/warehouse/locations/'+id,{method:'PATCH',body:{capacity:1}})).status,409)
 assert.equal((await call('/warehouse/locations/'+id,{method:'PATCH',body:{active:false}})).status,409)
 assert.equal((await call('/warehouse/locations/POOL',{method:'PATCH',body:{capacity:0}})).status,409)
 assert.equal((await call('/warehouse/move',{method:'POST',body:{productId:'FIXTURE-2',from:id,to:'POOL',qty:2}})).status,201)
 assert.equal((await call('/warehouse/locations/'+id,{method:'PATCH',body:{active:false}})).status,200)
 assert.equal((await call('/warehouse/move',{method:'POST',body:{productId:'FIXTURE-2',to:id,qty:1}})).status,409)
 const history=await call('/warehouse/movements?product=FIXTURE-2&location='+id+'&limit=1')
 assert.equal(history.status,200);assert.equal(history.body.items.length,1);assert.equal(history.body.items[0].from,id)
})
test('warehouse read and mutation HTTP role gates are enforced',async()=>{
 for(const [role,status] of [[null,401],['buyer',403],['staff',200],['manager',200],['admin',200]])assert.equal((await fixture.request('/warehouse',{role})).status,status)
 for(const [role,status] of [[null,401],['buyer',403],['staff',403]])assert.equal((await fixture.request('/warehouse/move',{role,method:'POST',body:{productId:'FIXTURE-2',to:'ZA-R1-B2',qty:1}})).status,status)
 assert.equal((await fixture.request('/warehouse/locations/ZA-R1-B2',{role:'admin',method:'PATCH',body:{label:'Admin fixture label'}})).status,200)
})
test('checkout settles allocated stock once and idempotent retry preserves both ledgers',async()=>{
 await service.moveStock({productId:'FIXTURE-2',to:'ZA-R1-B2',qty:8},1)
 const body={id:'fixture-checkout-once',buyerContact:{name:'Fixture buyer',email:'buyer@warehouse.test',phone:'08123456789'},shippingAddress:{address:'Fixture test address number 123',district:'Test',city:'Test',province:'Test',postalCode:'12345'},paymentMethod:'bank_transfer',lines:[{productId:'FIXTURE-2',qty:3}]}
 const first=await fixture.request('/orders',{role:'buyer',method:'POST',body})
 assert.equal(first.status,201,JSON.stringify(first.body))
 const afterFirst=(await fixture.request('/warehouse')).body
 assert.equal(afterFirst.unallocated.find(p=>p.productId==='FIXTURE-2').stock,5)
 assert.equal(afterFirst.unallocated.find(p=>p.productId==='FIXTURE-2').allocated,5)
 const count=Number((await sql`SELECT count(*) AS n FROM warehouse_movements WHERE reason='settle-order'`)[0].n)
 const retry=await fixture.request('/orders',{role:'buyer',method:'POST',body})
 assert.equal(retry.status,201);assert.equal(retry.body.id,first.body.id)
 assert.equal(JSON.stringify((await fixture.request('/warehouse')).body),JSON.stringify(afterFirst))
 assert.equal(Number((await sql`SELECT count(*) AS n FROM warehouse_movements WHERE reason='settle-order'`)[0].n),count)
 assert.equal((await fixture.request('/orders',{role:'buyer',method:'POST',body:{...body,lines:[{productId:'FIXTURE-2',qty:4}]}})).status,409)
})
test('product update settles allocations through the same transaction without cloud storage',async()=>{
 const result=await fixture.request('/ops/products/FIXTURE-2',{method:'PATCH',body:{name:'Fixture mouse',brand:'TEST FIXTURE',category:'fixture',price:100000,stock:2,specs:[]}})
 assert.equal(result.status,200,JSON.stringify(result.body))
 const product=(await fixture.request('/warehouse')).body.unallocated.find(p=>p.productId==='FIXTURE-2')
 assert.equal(product.stock,2);assert.equal(product.allocated,2)
})
