import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { fitWarehouseCamera } from '../src/components/warehouse/cameraFraming.js'
import { mapWarehouseScene, visibleSceneLabels } from '../src/components/warehouse/sceneModel.js'
test('camera framing fits all eight full-rack corners with margin in narrow and wide viewports',()=>{
 for(const count of [0,1,16,256]){
  const model=mapWarehouseScene(Array.from({length:count},(_,i)=>({id:String(i),zone:'Z'+Math.floor(i/4),rack:'R',bay:i%4})))
  for(const aspect of [348/360,865/440,200/600,1440/440]){
   const fit=fitWarehouseCamera(model,aspect,43)
   const camera=new PerspectiveCamera(43,aspect,.1,100000)
   camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld()
   assert.ok(Number.isFinite(fit.distance)&&fit.distance>=4)
   for(const bin of model.bins)for(const dx of [-1.1,1.1])for(const y of [-.09,2.4])for(const dz of [-1,1]){
    const p=new Vector3(bin.x+dx,y,bin.z+dz).project(camera)
    assert.ok(Math.abs(p.x)<=.880001&&Math.abs(p.y)<=.880001&&p.z>-1&&p.z<1,JSON.stringify({count,aspect,bin:bin.id,p}))
   }
  }
 }
})
test('projected labels never intercept each other and selected label has priority',()=>{
 const labels=[{x:100,y:100,width:80,height:44},{x:145,y:115,width:80,height:44},{x:250,y:100,width:80,height:44},{x:-10,y:100,width:80,height:44}]
 assert.deepEqual(visibleSceneLabels(labels,400,300),[true,false,true,false])
 assert.deepEqual(visibleSceneLabels(labels,400,300,1),[false,true,true,false])
})
test('empty or malformed data cannot create NaN coordinates or occupancy',()=>{
 assert.deepEqual(mapWarehouseScene(null).bins,[])
 const scene=mapWarehouseScene([null,{}, {id:'POOL'},{id:'a',zone:'A',rack:'R',bay:9999999,code:42,capacity:0,used:NaN,contents:{}},{id:'b',zone:'B',code:'B1',capacity:10,used:-4}],null)
 assert.equal(scene.bins.length,2)
 assert.ok(scene.bins.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&b.fill===0))
})
test('very large layouts have bounded 3D geometry and explicit overflow count',()=>{
 const locations=Array.from({length:10000},(_,i)=>({id:'L'+i,zone:'Z'+i,rack:'R',bay:i,code:'C'+i,contents:[]}))
 const scene=mapWarehouseScene(locations)
 assert.ok(scene.bins.length<=256)
 assert.equal(scene.overflow,10000-scene.bins.length)
 assert.ok(Number.isFinite(scene.width)&&Number.isFinite(scene.depth))
})
test('maps real location IDs, stable configured rack/bay order and shared occupancy', () => {
 const a={id:'a',zone:'A',rack:'R1',bay:2,capacity:12,used:6,status:'partial',contents:[{name:'Mouse',qty:6}]}
 const b={id:'b',zone:'A',rack:'R1',bay:1,capacity:10,used:10,status:'full',contents:[]}
 const scene=mapWarehouseScene([{id:'POOL'},a,b], 'mouse', 'a')
 assert.equal(scene.bins.length,2)
 assert.ok(scene.bins.find(x=>x.id==='a').x > scene.bins.find(x=>x.id==='b').x)
 assert.equal(scene.bins.find(x=>x.id==='a').fill,0.5)
 assert.equal(scene.bins.find(x=>x.id==='a').selected,true)
 assert.equal(scene.bins.find(x=>x.id==='a').matches,true)
 assert.equal(scene.bins.find(x=>x.id==='b').matches,false)
 assert.equal(scene.bins.find(x=>x.id==='a').location,a)
})
