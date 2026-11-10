import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapWarehouseScene } from '../src/components/warehouse/sceneModel.js'
import { Box3, PerspectiveCamera, Vector3 } from 'three'
import { fitWarehouseCamera } from '../src/components/warehouse/cameraFraming.js'
import { buildWarehouseDiorama } from '../src/components/warehouse/warehouseDiorama.js'

for (const [layout,count,compact] of [['compact',16,true],['wide-16',16,false],['wide-256',256,false],['empty',0,false]]) {
 test(`actual roof and campus geometry stay contained before camera framing: ${layout}`,()=>{
  const model=mapWarehouseScene(Array.from({length:count},(_,i)=>({id:'L'+i,zone:compact?'Z'+Math.floor(i/4):'Z',rack:'R',bay:compact?i%4+1:i+1})))
  const world=buildWarehouseDiorama(model)
  try {
   const actual=new Box3().setFromObject(world.group)
   assert.ok(world.bounds.clone().expandByScalar(1e-4).containsBox(actual),'declared bounds must contain independently measured actual meshes')
   for(const panel of world.roof.children.slice(0,2)){
    const extent=new Box3().setFromObject(panel)
    assert.ok(extent.min.y>=4.5-1e-4,`roof cannot descend into the building: ${extent.min.y}`)
    assert.ok(extent.max.y<=6,`roof rise must remain bounded as warehouse widens: ${extent.max.y}`)
   }
   for(const aspect of [348/440,1000/560]){
    const fit=fitWarehouseCamera(model,aspect,43,world.bounds),camera=new PerspectiveCamera(43,aspect,.1,100000)
    camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld()
    for(const x of [actual.min.x,actual.max.x])for(const y of [actual.min.y,actual.max.y])for(const z of [actual.min.z,actual.max.z]){
     const projected=new Vector3(x,y,z).project(camera)
     assert.ok(Math.abs(projected.x)<=.880001&&Math.abs(projected.y)<=.880001,'all actual mesh bounds must fit mobile and desktop')
    }
   }
  } finally { world.dispose() }
 })
}
test('Sunset warehouse campus keeps every real location pickable and scenery separate from inventory',()=>{
 const locations=[{id:'POOL'},{id:'A',code:'A1-01',zone:'A',rack:'R1',bay:1,used:0,capacity:12,status:'empty',contents:[]},{id:'B',code:'A1-02',zone:'A',rack:'R1',bay:2,used:6,capacity:12,status:'partial',contents:[{productId:'P',name:'Keyboard',qty:6}]}]
 const model=mapWarehouseScene(locations)
 const world=buildWarehouseDiorama(model)
 assert.deepEqual([...new Set(world.pickables.map(mesh=>mesh.userData.location.id))].sort(),['A','B'])
 assert.ok(world.group.getObjectByName('warehouse-building'))
 assert.ok(world.group.getObjectByName('access-road'))
 assert.ok(world.group.getObjectByName('forklift-scenery'))
 assert.ok(world.group.getObjectByName('truck-scenery'))
 assert.ok(world.roof.children.length>0)
 assert.equal(world.roof.children[0].material.color.getHex(),0xc64a22,'roof must use the active Sunset storefront orange')
 const stock=[];world.group.traverse(mesh=>{if(mesh.userData.inventoryCarton)stock.push(mesh)})
 assert.ok(stock.length>0);assert.ok(stock.every(mesh=>mesh.userData.location.id==='B'))
 assert.ok(world.bounds.min.x<model.bins[0].x-1.1)
 assert.ok(world.bounds.max.z>model.depth)
 world.dispose()
 assert.equal(world.group.children.length,0)
})
