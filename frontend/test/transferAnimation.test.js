import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapWarehouseScene } from '../src/components/warehouse/sceneModel.js'
import { confirmedTransfer,planTransfer,sampleTransfer } from '../src/components/warehouse/transferAnimation.js'
const locations=Array.from({length:16},(_,i)=>({id:'L'+i,code:'B'+i,zone:'Z'+Math.floor(i/4),rack:'R',bay:i%4+1,capacity:12,used:3,contents:[]}))
const model=mapWarehouseScene(locations)
const response={reason:'transfer',from:'L0',to:'L9',qty:3,productId:'P',product:{name:'Keyboard'},movement:{id:42}}
test('forklift routes use row aisles and side corridor, never a straight line through shelves',()=>{
 const plan=planTransfer(confirmedTransfer(response),model)
 assert.ok(plan);assert.equal(plan.source.id,'L0');assert.equal(plan.destination.id,'L9')
 const unchanged=JSON.stringify(model)
 for(const route of [plan.approach,plan.carry,plan.returning])for(let i=1;i<route.length;i++){
  const [a,b]=[route[i-1],route[i]];assert.ok(a[0]===b[0]||a[1]===b[1])
  for(let t=0;t<=1;t+=.05){const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t
   assert.ok(model.bins.every(bin=>Math.abs(x-bin.x)>1.1+.34||Math.abs(z-bin.z)>1+.34),'vehicle center must stay in a clear aisle')
  }
 }
 assert.equal(planTransfer({...confirmedTransfer(response),from:'missing'},model),null)
 assert.equal(planTransfer({...confirmedTransfer(response),from:'POOL'},model),null)
 assert.equal(JSON.stringify(model),unchanged)
})
test('playback samples pickup, transport, drop and return deterministically without mutating stock',()=>{
 const event=confirmedTransfer(response),plan=planTransfer(event,model),before=JSON.stringify({event,model})
 assert.equal(sampleTransfer(plan,0).phase,'approach')
 assert.equal(sampleTransfer(plan,plan.durationMs*.27).phase,'pickup')
 assert.equal(sampleTransfer(plan,plan.durationMs*.5).phase,'carry')
 assert.equal(sampleTransfer(plan,plan.durationMs*.73).phase,'drop')
 assert.equal(sampleTransfer(plan,plan.durationMs*.9).phase,'return')
 assert.equal(sampleTransfer(plan,plan.durationMs+1000).done,true)
 assert.deepEqual(sampleTransfer(plan,500),sampleTransfer(plan,500))
 assert.equal(sampleTransfer(plan,plan.durationMs*.5).cargoVisible,true)
 assert.equal(sampleTransfer(plan,plan.durationMs*.9).cargoVisible,false)
 assert.equal(JSON.stringify({event,model}),before)
})
test('only a confirmed inter-location transfer creates a visual event',()=>{
 assert.equal(confirmedTransfer(null),null)
 assert.equal(confirmedTransfer({...response,reason:'allocate',from:'POOL'}),null)
 assert.equal(confirmedTransfer({...response,reason:'return-to-pool',to:'POOL'}),null)
 assert.equal(confirmedTransfer({...response,movement:null}),null)
 assert.equal(confirmedTransfer({...response,qty:0}),null)
 assert.deepEqual(confirmedTransfer(response),{id:'42',from:'L0',to:'L9',qty:3,productId:'P',productName:'Keyboard'})
})
