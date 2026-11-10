import {test} from 'node:test'
import {Box3,PerspectiveCamera,Vector3} from 'three'
import {fitWarehouseCamera} from '../src/components/warehouse/cameraFraming.js'
import assert from 'node:assert/strict'
import {mapWarehouseScene} from '../src/components/warehouse/sceneModel.js'
import {buildWarehouseDiorama} from '../src/components/warehouse/warehouseDiorama.js'
import {createTransferRig} from '../src/components/warehouse/transferRig.js'
import {planTransfer,sampleTransfer} from '../src/components/warehouse/transferAnimation.js'
test('visual rig moves forklift and cargo, then disposes temporary resources and restores parking pose',()=>{
 const model=mapWarehouseScene([{id:'A',zone:'Z',rack:'R',bay:1,contents:[]},{id:'B',zone:'Z',rack:'R',bay:2,contents:[]}]),world=buildWarehouseDiorama(model)
 const initial=world.forklift.position.clone(),scale=world.forklift.scale.clone(),ids=world.pickables.map(m=>m.userData.location.id)
 const plan=planTransfer({id:'1',from:'A',to:'B'},model),rig=createTransferRig(world,plan)
 let disposed=0;rig.cargo.geometry.addEventListener('dispose',()=>disposed++)
 const sample=sampleTransfer(plan,plan.durationMs*.5);rig.apply(sample)
 assert.deepEqual(world.forklift.position.toArray(),sample.position);assert.equal(rig.cargo.visible,true)
 assert.ok(world.group.getObjectByName('transfer-route'))
 rig.dispose();rig.dispose()
 assert.equal(disposed,1);assert.deepEqual(world.forklift.position.toArray(),initial.toArray());assert.deepEqual(world.forklift.scale.toArray(),scale.toArray())
 assert.equal(world.group.getObjectByName('transfer-route'),undefined);assert.deepEqual(world.pickables.map(m=>m.userData.location.id),ids)
 world.dispose()
})
test('steep activity camera keeps actual campus geometry framed on desktop and mobile',()=>{
 const model=mapWarehouseScene(Array.from({length:16},(_,i)=>({id:'L'+i,zone:'Z'+Math.floor(i/4),rack:'R',bay:i%4+1,contents:[]}))),world=buildWarehouseDiorama(model),direction=new Vector3(.35,1.6,.45).normalize()
 for(const aspect of [.6,1.6]){
   const fit=fitWarehouseCamera(model,aspect,43,world.bounds,direction),camera=new PerspectiveCamera(43,aspect,.1,100000)
   assert.ok(fit.position.clone().sub(fit.target).normalize().distanceTo(direction)<1e-6)
   camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld()
   for(const x of [world.bounds.min.x,world.bounds.max.x])for(const y of [world.bounds.min.y,world.bounds.max.y])for(const z of [world.bounds.min.z,world.bounds.max.z]){
     const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.88+1e-6&&Math.abs(p.y)<=.88+1e-6)
   }
 }
 world.dispose()
})
test('actual scaled forklift and cargo geometry clear every rack during aisle transport',()=>{
 const model=mapWarehouseScene(Array.from({length:16},(_,i)=>({id:'L'+i,zone:'Z'+Math.floor(i/4),rack:'R',bay:i%4+1,contents:[]}))),world=buildWarehouseDiorama(model)
 const shelves=world.pickables.map(mesh=>new Box3().setFromObject(mesh))
 for(const [from,to] of [['L0','L9'],['L3','L12'],['L15','L0'],['L0','L1']]){
   const plan=planTransfer({id:from+to,from,to},model),rig=createTransferRig(world,plan)
   for(let step=0;step<=200;step++){
     const sample=sampleTransfer(plan,plan.durationMs*step/200)
     if(['pickup','drop'].includes(sample.phase))continue // Cargo intentionally meets its rack here.
     rig.apply(sample);world.group.updateMatrixWorld(true)
     const body=new Box3().setFromObject(world.forklift)
     for(const shelf of shelves)assert.ok(!body.intersectsBox(shelf),`${from} → ${to}, ${sample.phase}, sample ${step}`)
   }
   rig.dispose()
 }
 world.dispose()
})
