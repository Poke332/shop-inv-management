import { randomUUID } from 'node:crypto'
import sql from '../db.js'
import { fail, integer, text, boolean } from './validation.js'

export const POOL = 'POOL'
export async function warehouseOverview() {
  // Repeatable-read snapshot prevents a transfer from being observed half-way.
  return sql.begin('isolation level repeatable read read only', async tx => {
    const locations = await tx`SELECT * FROM warehouse_locations ORDER BY sort_index, code`
    const allocations = await tx`SELECT a.*, p.name FROM location_allocations a JOIN products p ON p.id=a.product_id WHERE a.qty>0 ORDER BY p.name`
    const products = await tx`SELECT id,name,stock FROM products WHERE stock>0 OR id IN (SELECT product_id FROM location_allocations WHERE qty>0)`
    const unallocated = products.map(p => {
      const allocated = allocations.filter(a => a.product_id===p.id).reduce((n,a)=>n+a.qty,0)
      return {productId:p.id,name:p.name,stock:p.stock,allocated,unallocated:Math.max(0,p.stock-allocated)}
    }).sort((a,b)=>a.name.localeCompare(b.name))
    const items = locations.map(l => {
      const contents = allocations.filter(a=>a.location_id===l.id).map(a=>({productId:a.product_id,name:a.name,qty:a.qty}))
      const used = contents.reduce((n,a)=>n+a.qty,0)
      return {id:l.id,code:l.code,zone:l.zone,rack:l.rack,bay:l.bay,label:l.label,capacity:l.id===POOL?null:l.capacity,active:Boolean(l.active),isTemplate:Boolean(l.is_template),used,contents,
        status:!l.active?'inactive':l.id===POOL?'pool':!used?'empty':used>=l.capacity?'full':'partial'}
    })
    const bays=items.filter(l=>l.id!==POOL),capacity=bays.reduce((n,l)=>n+l.capacity,0),allocated=bays.reduce((n,l)=>n+l.used,0)
    return {items,unallocated,stats:{locations:bays.length,capacity,allocated,utilization:capacity?Math.round(allocated/capacity*100):0,unallocatedUnits:unallocated.reduce((n,p)=>n+p.unallocated,0),products:unallocated.length}}
  })
}
async function allocated(tx, productId) {
  return Number((await tx`SELECT COALESCE(SUM(qty),0) AS n FROM location_allocations WHERE product_id=${productId}`)[0].n)
}
async function usedAt(tx, id) {
  return Number((await tx`SELECT COALESCE(SUM(qty),0) AS n FROM location_allocations WHERE location_id=${id}`)[0].n)
}
export function moveStock(payload={},actorId) {
  const productId=text(payload.productId,'Product ID'),qty=integer(payload.qty,'Qty',{min:1,max:1000000})
  const from=typeof payload.from==='string'&&payload.from?payload.from:POOL
  const to=typeof payload.to==='string'&&payload.to?payload.to:POOL
  if(from===to)fail(400,'Source and destination must differ.')
  return sql.begin(async tx=>{
    // Product lock serializes allocation with checkout/manual stock; location locks
    // serialize capacity across different products. Always lock locations in ID order.
    const [product]=await tx`SELECT id,name,stock FROM products WHERE id=${productId} FOR UPDATE`
    if(!product)fail(404,'Product not found.')
    const ids=[from,to].filter(id=>id!==POOL).sort()
    const locations=await tx`SELECT * FROM warehouse_locations WHERE id IN ${tx(ids)} ORDER BY id FOR UPDATE`
    for(const id of ids){const l=locations.find(l=>l.id===id);if(!l)fail(404,'Location not found.');if(!l.active)fail(409,'Location is inactive.')}
    if(from===POOL){const available=product.stock-await allocated(tx,productId);if(qty>available)fail(409,'Not enough unallocated stock.',{code:'ALLOCATION_EXCEEDS_STOCK',available})}
    else {const [row]=await tx`SELECT qty FROM location_allocations WHERE location_id=${from} AND product_id=${productId}`;if(qty>(row?.qty||0))fail(409,'Not enough stock at source.',{code:'LOCATION_SHORT',available:row?.qty||0})}
    if(to!==POOL){const available=locations.find(l=>l.id===to).capacity-await usedAt(tx,to);if(qty>available)fail(409,'Not enough capacity.',{code:'CAPACITY_EXCEEDED',available})}
    if(from!==POOL){
      await tx`UPDATE location_allocations SET qty=qty-${qty} WHERE location_id=${from} AND product_id=${productId}`
      await tx`DELETE FROM location_allocations WHERE location_id=${from} AND product_id=${productId} AND qty=0`
    }
    if(to!==POOL)await tx`INSERT INTO location_allocations(location_id,product_id,qty) VALUES (${to},${productId},${qty}) ON CONFLICT(location_id,product_id) DO UPDATE SET qty=location_allocations.qty+excluded.qty`
    const reason=from===POOL?'allocate':to===POOL?'return-to-pool':'transfer'
    const [movement]=await tx`INSERT INTO warehouse_movements(product_id,from_location,to_location,qty,actor_id,reason,created_at) VALUES (${productId},${from===POOL?null:from},${to===POOL?null:to},${qty},${actorId},${reason},${new Date().toISOString()}) RETURNING *`
    return {productId,from,to,qty,reason,movement,product}
  })
}

// Caller MUST pass its transaction, having locked the product row first.
// Numeric stock reconciliation is not a record of physical picking.
export async function settleProductAllocations(tx,productId,{actorId,orderId=null,reason='settle-manual'}) {
  const [product]=await tx`SELECT stock FROM products WHERE id=${productId}`
  if(!product)return 0
  let overflow=await allocated(tx,productId)-product.stock,settled=0
  if(overflow<=0)return 0
  const rows=await tx`SELECT location_id,qty FROM location_allocations WHERE product_id=${productId} ORDER BY qty DESC,location_id ASC`
  for(const row of rows){
    if(overflow<=0)break
    const take=Math.min(row.qty,overflow)
    await tx`UPDATE location_allocations SET qty=qty-${take} WHERE location_id=${row.location_id} AND product_id=${productId}`
    await tx`DELETE FROM location_allocations WHERE location_id=${row.location_id} AND product_id=${productId} AND qty=0`
    await tx`INSERT INTO warehouse_movements(product_id,from_location,qty,actor_id,reason,order_id,created_at) VALUES (${productId},${row.location_id},${take},${actorId},${reason},${orderId},${new Date().toISOString()})`
    overflow-=take;settled+=take
  }
  return settled
}
export function upsertWarehouseLocation(input={},_actorId,create=false,idOverride=null) {
  return sql.begin(async tx=>{
    if(create){
      const code=text(input.code,'Code',{max:20}).toUpperCase()
      if(!/^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}$/.test(code))fail(400,'Code must be like A1-01.')
      const zone=text(input.zone,'Zone',{max:40}),label=text(input.label??'','Label',{min:0,max:80}),capacity=integer(input.capacity,'Capacity',{max:1000000})
      const rack=input.rack?text(input.rack,'Rack',{max:10}):null,bay=input.bay==null?null:integer(input.bay,'Bay',{min:1,max:9999})
      const [exists]=await tx`SELECT id FROM warehouse_locations WHERE code=${code}`
      if(exists)fail(409,'Location code already exists.')
      const id='L-'+randomUUID()
      try {return (await tx`INSERT INTO warehouse_locations(id,code,zone,rack,bay,label,capacity,sort_index) VALUES (${id},${code},${zone},${rack},${bay},${label},${capacity},(SELECT COALESCE(MAX(sort_index),0)+1 FROM warehouse_locations)) RETURNING *`)[0]}
      catch(error){if(error.code==='23505')fail(409,'Location code already exists.');throw error}
    }
    const id=idOverride||input.id
    if(!id)fail(404,'Location not found.')
    if(id===POOL)fail(409,'The pool is fixed and cannot be edited.')
    const [row]=await tx`SELECT * FROM warehouse_locations WHERE id=${id} FOR UPDATE`
    if(!row)fail(404,'Location not found.')
    const label=input.label===undefined?row.label:text(input.label,'Label',{min:0,max:80})
    const capacity=input.capacity===undefined?row.capacity:integer(input.capacity,'Capacity',{max:1000000})
    const active=input.active===undefined?row.active:Number(boolean(input.active,'Active'))
    const used=await usedAt(tx,id)
    if(capacity<used)fail(409,'Capacity cannot be below allocated units.',{code:'CAPACITY_BELOW_ALLOCATED',available:used})
    if(!active&&used)fail(409,'Transfer stock out before deactivating this location.')
    return (await tx`UPDATE warehouse_locations SET label=${label},capacity=${capacity},active=${active} WHERE id=${id} RETURNING *`)[0]
  })
}
export async function warehouseMovements({productId,location,limit=50}={}) {
  const rows=await sql`SELECT m.id,m.product_id AS "productId",p.name AS "productName",m.from_location AS "from",m.to_location AS "to",m.qty,m.reason,m.created_at AS "createdAt",m.order_id AS "orderId",COALESCE(u.username,'system') AS actor,COALESCE(u.role,'buyer') AS "actorRole" FROM warehouse_movements m JOIN products p ON p.id=m.product_id LEFT JOIN users u ON u.id=m.actor_id
    WHERE (${productId||null}::text IS NULL OR m.product_id=${productId||null}) AND (${location||null}::text IS NULL OR m.from_location=${location||null} OR m.to_location=${location||null} OR (${location||null}='POOL' AND (m.from_location IS NULL OR m.to_location IS NULL))) ORDER BY m.created_at DESC,m.id DESC LIMIT ${Math.min(limit,200)}`
  return rows.map(row=>({...row,from:row.from||POOL,to:row.to||POOL}))
}
