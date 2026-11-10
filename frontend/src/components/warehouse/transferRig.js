import * as THREE from 'three'

// Temporary visual-only objects; never part of inventory or location pickables.
export function createTransferRig(world,plan) {
  const actor=world.forklift,origin={position:actor.position.clone(),rotation:actor.rotation.clone(),scale:actor.scale.clone()}
  const forks=actor.children.filter(m=>m.name==='forklift-fork').map(mesh=>({mesh,y:mesh.position.y}))
  const group=new THREE.Group();group.name='transfer-route';world.group.add(group)
  const geometries=[],materials=[]
  const geometry=value=>{geometries.push(value);return value}
  const material=value=>{materials.push(value);return value}
  for(const [bin,color] of [[plan.source,0xc64a22],[plan.destination,0x2c6d5a]]){
    const box=new THREE.BoxGeometry(2.36,.12,2.12),edges=geometry(new THREE.EdgesGeometry(box));box.dispose()
    const line=new THREE.LineSegments(edges,material(new THREE.LineBasicMaterial({color})))
    line.position.set(bin.x,.16,bin.z);group.add(line)
  }
  const route=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(plan.carry.map(([x,z])=>new THREE.Vector3(x,.12,z)))),material(new THREE.LineBasicMaterial({color:0xc64a22,transparent:true,opacity:.7})))
  group.add(route)
  const cargo=new THREE.Mesh(geometry(new THREE.BoxGeometry(.6,.5,.55)),material(new THREE.MeshStandardMaterial({color:0xcda66f,roughness:.9})))
  cargo.name='transfer-cargo';cargo.castShadow=true;actor.add(cargo)
  actor.scale.setScalar(.7)
  let disposed=false
  return {cargo,apply(sample){
    if(disposed)return
    actor.position.fromArray(sample.position);actor.rotation.set(0,sample.yaw,0)
    cargo.visible=sample.cargoVisible;cargo.position.set(0,sample.cargoY,sample.cargoZ)
    for(const {mesh} of forks)mesh.position.y=sample.cargoVisible?sample.cargoY-.25:.15
  },dispose(){
    if(disposed)return;disposed=true
    cargo.removeFromParent();group.removeFromParent()
    actor.position.copy(origin.position);actor.rotation.copy(origin.rotation);actor.scale.copy(origin.scale)
    for(const {mesh,y} of forks)mesh.position.y=y
    for(const value of geometries)value.dispose()
    for(const value of materials)value.dispose()
  }}
}
