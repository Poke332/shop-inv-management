import * as THREE from 'three'

// Locally generated scenery only. Inventory meshes alone carry real location IDs.
export function buildWarehouseDiorama(model) {
  const group=new THREE.Group(), building=new THREE.Group(), roof=new THREE.Group()
  group.name='warehouse-campus';building.name='warehouse-building';roof.name='warehouse-roof'
  group.add(building);building.add(roof)
  const materials=new Map(),geometries=new Set(),pickables=[],anchors=[]
  const material=color=>{
    if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.86,metalness:.03}))
    return materials.get(color)
  }
  function box(parent,w,h,d,x,y,z,color,name){
    const geometry=new THREE.BoxGeometry(w,h,d);geometries.add(geometry)
    const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(x,y,z);mesh.name=name||''
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  function cylinder(parent,top,bottom,height,x,y,z,color,segments=10){
    const geometry=new THREE.CylinderGeometry(top,bottom,height,segments);geometries.add(geometry)
    const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh
  }
  const brand=0xc64a22,brandShade=0xa73b18,roofColor=0xc64a22,wood=0xcda66f,trim=0xfaf9f6
  const maxX=Math.max(0,...model.bins.map(b=>b.x)),maxZ=Math.max(0,...model.bins.map(b=>b.z))
  const left=-2.1,right=maxX+2.1,back=-2.1,front=maxZ+2.3,cx=(left+right)/2,cz=(back+front)/2
  const width=right-left,depth=front-back
  const minX=left-5,maxSiteX=right+7,minZ=back-5,maxSiteZ=front+10
  box(group,maxSiteX-minX,.28,maxSiteZ-minZ,(minX+maxSiteX)/2,-.4,(minZ+maxSiteZ)/2,0xe4ebef,'site-base')
  box(group,width+4,.12,depth+5,cx,-.18,cz+1,0xf2f5f7,'concrete-yard')
  box(group,maxSiteX-minX,.08,4.2,(minX+maxSiteX)/2,-.2,front+7,0x929fb9,'access-road')
  for(let x=minX+1;x<maxSiteX-1;x+=2.5)box(group,1.15,.025,.10,x,-.145,front+7,0xfff7dc)
  box(group,maxSiteX-minX,.15,.25,(minX+maxSiteX)/2,-.08,front+4.7,0xd5dce8)
  box(building,width,.2,depth,cx,-.05,cz,0xcbd7e5,'warehouse-foundation')
  // Back/side cladding stays high; the open interior removes the front/roof occlusion.
  box(building,width,4.5,.18,cx,2.2,back,brand)
  box(building,.18,4.5,depth,left,2.2,cz,brandShade)
  box(building,.18,1,depth,right,.45,cz,brand)
  for(let z=back+.4;z<front;z+=.65)box(building,.04,4.4,.035,left-.11,2.2,z,0xc14b0b)
  box(building,width+.4,.2,.3,cx,4.5,back,trim)
  // Exterior roof/front form one removable group: both modes remain actual 3D.
  const half=width/2,run=half+.3,rise=Math.min(.65,half*.1)
  // Keep the eave above the walls for every width. Fixed-angle panels used to
  // grow vertically with width and eventually intersect the shelves/ground.
  const slope=Math.atan2(rise,run),panelWidth=Math.hypot(run,rise)
  const panelY=4.6+rise/2+.08*Math.cos(slope),roofPanels=[]
  for(const side of [-1,1]){
    const panel=box(roof,panelWidth,.16,depth+.5,cx+side*half/2,panelY,cz,roofColor)
    panel.rotation.z=-side*slope;roofPanels.push(panel)
  }
  // Corrugation follows each pitched panel instead of floating at a fixed Y.
  for(const panel of roofPanels)for(let z=back;z<=front;z+=.7){
    const angle=panel.rotation.z
    const rib=box(roof,panelWidth,.035,.025,panel.position.x-.095*Math.sin(angle),panelY+.095*Math.cos(angle),z,0xf79e6e)
    rib.rotation.z=angle
  }
  box(roof,width,1,.18,cx,3.95,front,brand)
  const dockCount=Math.max(1,Math.min(3,Math.floor(width/3)))
  const dockWidth=width/dockCount
  for(let i=0;i<dockCount;i++){
    const x=left+dockWidth*(i+.5)
    box(roof,dockWidth-.2,3.5,.18,x,1.7,front,brandShade)
    box(roof,dockWidth*.65,2.6,.2,x,1.25,front+.13,trim)
    box(roof,dockWidth*.56,2.35,.22,x,1.15,front+.25,0xd1b48b)
    for(let y=.3;y<2.35;y+=.25)box(roof,dockWidth*.55,.025,.025,x,y,front+.37,0xb59a73)
    box(group,dockWidth*.8,.18,1.4,x,-.02,front+.85,0xb1bfd3)
    // Loading-lane markings are decorative, not extra stock allocations.
    box(group,.06,.02,2,x-dockWidth*.4,-.09,front+2.3,0xd7a953)
    box(group,.06,.02,2,x+dockWidth*.4,-.09,front+2.3,0xd7a953)
  }
  for(const bin of model.bins){
    const {x,z,location}=bin
    const status=bin.selected?0x2c6d5a:!bin.matches?0xaab5c6:location.status==='full'?0xc05359:0x60829f
    const base=box(building,2.2,.16,2,x,.04,z,0xb5c4d9)
    base.userData.location=location;pickables.push(base)
    for(const dx of [-1,1])for(const dz of [-.9,.9])box(building,.07,2.4,.07,x+dx,1.2,z+dz,status)
    for(const y of [.2,1.25,2.35]){
      const shelf=box(building,2.2,.08,2,x,y,z,status)
      shelf.userData.location=location;pickables.push(shelf)
    }
    const count=location.used>0?Math.min(6,Math.max(1,Math.ceil(bin.fill*6))):0
    for(let i=0;i<count;i++){
      const bx=x+(i%3-1)*.58,by=i<3?.55:1.62
      const carton=box(building,.49,.58,1.15,bx,by,z,bin.selected?0xe6bc68:wood)
      carton.userData={location,inventoryCarton:true};pickables.push(carton)
      box(building,.08,.018,1.16,bx,by+.3,z,0xe8cf9e)
    }
    anchors.push({location,interior:new THREE.Vector3(x,2.9,z),exterior:new THREE.Vector3(x,5.35,z),selected:bin.selected,matches:bin.matches})
  }
  // Trees and vehicles are static illustrative scenery, never added to inventory.
  function tree(x,z){
    cylinder(group,.09,.12,.9,x,.25,z,0x93785b)
    const geometry=new THREE.IcosahedronGeometry(.65,1);geometries.add(geometry)
    const crown=new THREE.Mesh(geometry,material(0x66ac84));crown.scale.set(.75,1.25,.75);crown.position.set(x,1.1,z);group.add(crown);crown.castShadow=true
  }
  for(let i=0;i<4;i++)tree(right+3.5,back+i*depth/4)
  for(let i=0;i<3;i++)tree(left-3.2,back+1+i*2.5)
  const forklift=new THREE.Group();forklift.name='forklift-scenery';group.add(forklift);forklift.position.set(left+1,0,front+2.5)
  box(forklift,.75,.45,1.1,0,.38,0,0xe5b84d)
  box(forklift,.65,.08,.65,0,1.32,-.1,0x33465f)
  for(const x of [-.3,.3])box(forklift,.05,.85,.05,x,.9,-.35,0x33465f)
  for(const x of [-.42,.42])for(const z of [-.35,.35]){const wheel=cylinder(forklift,.19,.19,.13,x,.18,z,0x34445d);wheel.rotation.z=Math.PI/2}
  for(const x of [-.27,.27]){box(forklift,.045,1.2,.05,x,.7,.6,0x33465f);box(forklift,.08,.05,.85,x,.15,1,0x33465f,'forklift-fork')}
  const truck=new THREE.Group();truck.name='truck-scenery';group.add(truck);truck.position.set(right+1.5,0,front+7)
  box(truck,2.3,1.2,1.05,0,.9,0,0xf7fafc);box(truck,.8,.85,1.05,1.5,.65,0,brand)
  box(truck,.04,.4,.8,1.92,.95,0,0x93c8df)
  for(const x of [-.7,.7,1.5])for(const z of [-.53,.53]){const wheel=cylinder(truck,.22,.22,.13,x,.18,z,0x34445d);wheel.rotation.x=Math.PI/2}
  group.updateMatrixWorld(true)
  // Measure generated geometry, including rotated roof panels and scenery.
  const bounds=new THREE.Box3().setFromObject(group)
  return {group,roof,forklift,pickables,anchors,bounds,dispose(){
    for(const geometry of geometries)geometry.dispose()
    for(const value of materials.values())value.dispose()
    group.clear()
  }}
}
