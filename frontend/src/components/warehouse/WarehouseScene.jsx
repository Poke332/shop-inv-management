import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mapWarehouseScene, visibleSceneLabels } from './sceneModel.js'
import { fitWarehouseCamera } from './cameraFraming.js'
import { buildWarehouseDiorama } from './warehouseDiorama.js'
import { planTransfer,sampleTransfer } from './transferAnimation.js'
import { createTransferRig } from './transferRig.js'


export default function WarehouseScene({ locations, searchTerm, selectedId, onSelect, onFallback, transferEvent, onTransferEnd }) {
  const host = useRef(null)
  const actions = useRef(null)
  const select = useRef(onSelect)
  const notifyEnd=useRef(onTransferEnd),playedId=useRef(null),resumable=useRef(null)
  useEffect(() => { select.current = onSelect;notifyEnd.current=onTransferEnd }, [onSelect,onTransferEnd])
  const [error, setError] = useState('')
  const [interior,setInterior]=useState(false)
  const [transferPhase,setTransferPhase]=useState('approach')
  const isInterior=interior||Boolean(transferEvent)
  const overflowCount=mapWarehouseScene(locations,searchTerm,selectedId).overflow
  useEffect(() => {
    if (error) return
    const node = host.current
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) }
    catch {
      let alive = true
      queueMicrotask(() => { if (alive) setError('WebGL is unavailable. Open the location list to continue.') })
      return () => { alive = false }
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setClearColor(0xfaf9f6)
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25
    const canvas = renderer.domElement
    canvas.setAttribute('aria-label', 'Warehouse 3D: drag to orbit, scroll to zoom. Open a location from its label or the list.')
    canvas.tabIndex = 0
    node.appendChild(canvas)
    const model = mapWarehouseScene(locations, searchTerm, selectedId)
    const scene = new THREE.Scene()
    const world=buildWarehouseDiorama(model);world.roof.visible=!isInterior;scene.add(world.group)
    renderer.shadowMap.enabled=model.bins.length<=64;renderer.shadowMap.type=THREE.PCFShadowMap
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 2000)
    const center = new THREE.Vector3((model.width - 3) / 2, 0, (model.depth - 3) / 2)
    const span = Math.max(model.width, model.depth, 10)
    camera.far=Math.max(2000,span*12);camera.updateProjectionMatrix()
    const controls = new OrbitControls(camera, canvas)
    controls.target.copy(center)
    controls.minDistance = 4
    controls.maxDistance = span * 4
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enableDamping = false
    const pickables = world.pickables
    const labels = []
    let frame = 0, disposed = false, draws = 0, playback=null
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
    function draw(time=performance.now()) {
      frame = 0
      if (disposed || renderer.getContext().isContextLost()) return
      if(playback){
        const sample=sampleTransfer(playback.plan,time-playback.start)
        playback.rig.apply(sample)
        node.dataset.transferPhase=sample.phase;node.dataset.forklift=sample.position.map(n=>n.toFixed(3)).join(',')
        if(playback.phase!==sample.phase){playback.phase=sample.phase;setTransferPhase(sample.phase)}
        if(sample.done)finishPlayback('complete')
      }
      renderer.render(scene, camera)
      draws++
      node.dataset.frames = String(draws)
      node.dataset.camera = camera.position.toArray().map(v => v.toFixed(3)).join(',')
      const projected=labels.map(({element,position})=>{
        const v=position.clone().project(camera),x=(v.x+1)*node.clientWidth/2,y=(-v.y+1)*node.clientHeight/2
        element.hidden=false; element.style.left=`${x}px`;element.style.top=`${y}px`
        return {x,y,width:element.offsetWidth,height:element.offsetHeight,clipped:element.dataset.enabled==='false' || v.z < -1 || v.z > 1}
      })
      const selectedLabel=model.bins.findIndex(b=>playback?b.id===playback.event.to:b.selected)
      const priority=selectedLabel>=0?selectedLabel:searchTerm?.trim()?model.bins.findIndex(b=>b.matches):-1
      const visible=visibleSceneLabels(projected,node.clientWidth,node.clientHeight,priority)
      labels.forEach(({element},i)=>{element.hidden=!visible[i]})
      if(playback)requestDraw()
    }
    function requestDraw() { if (!disposed && !frame) frame = requestAnimationFrame(draw) }
    function finishPlayback(reason,notify=true) {
      if(!playback)return
      const finished=playback;playback=null;finished.rig.dispose()
      node.dataset.transferPhase='idle';delete node.dataset.forklift
      for(const {element,position,normalY} of labels){element.classList.remove('is-transfer-source','is-transfer-destination');element.dataset.enabled=String(isInterior||element.dataset.normalEnabled==='true');position.y=normalY}
      if(!disposed){setInterior(true);requestDraw()}
      if(notify)queueMicrotask(()=>notifyEnd.current?.(finished.event.id,reason))
    }
    function startTransfer(event){
      if(playedId.current===event.id)return
      playedId.current=event.id
      const previous=resumable.current;resumable.current=null
      const plan=planTransfer(event,model)
      if(!plan || document.hidden || motion.matches){
        const reason=!plan?'unavailable':motion.matches?'reduced-motion':'skipped'
        queueMicrotask(()=>notifyEnd.current?.(event.id,reason));return
      }
      playback={event,plan,rig:createTransferRig(world,plan),start:previous?.event.id===event.id?previous.start:performance.now(),phase:null}
      for(const {element,position} of labels){
        const source=element.dataset.location===event.from,destination=element.dataset.location===event.to
        element.classList.toggle('is-transfer-source',source);element.classList.toggle('is-transfer-destination',destination)
        element.dataset.enabled=String(source||destination);position.y=4
      }
      // Focus on the shelf/aisle activity, not the decorative truck and road.
      const activity=new THREE.Box3()
      for(const bin of model.bins){activity.expandByPoint(new THREE.Vector3(bin.x-1.2,0,bin.z-1.1));activity.expandByPoint(new THREE.Vector3(bin.x+1.2,4.5,bin.z+1.1))}
      for(const [x,z] of [...plan.approach,...plan.carry,...plan.returning]){activity.expandByPoint(new THREE.Vector3(x-1.1,0,z-1.1));activity.expandByPoint(new THREE.Vector3(x+1.1,1.5,z+1.1))}
      const fit=fitWarehouseCamera(model,camera.aspect,camera.fov,activity,new THREE.Vector3(.35,1.6,.45))
      controls.target.copy(fit.target);camera.position.copy(fit.position);controls.update()
      node.dataset.target=fit.target.toArray().map(v=>v.toFixed(3)).join(',')
      requestDraw()
    }
    function visibilityChanged(){if(document.hidden)finishPlayback('skipped')}
    function motionChanged(){if(motion.matches)finishPlayback('reduced-motion')}
    document.addEventListener('visibilitychange',visibilityChanged);motion.addEventListener('change',motionChanged)
    function reset() {
      const fit=fitWarehouseCamera(model,camera.aspect,camera.fov,world.bounds)
      controls.target.copy(fit.target)
      controls.maxDistance=Math.max(span*4,fit.distance*2)
      camera.position.copy(fit.position)
      node.dataset.target=fit.target.toArray().map(v=>v.toFixed(3)).join(',')
      camera.far=Math.max(2000,controls.maxDistance+span*4);camera.updateProjectionMatrix()
      controls.update(); requestDraw()
    }
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa3b0bf, 2.5))
    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(center.x-8,22,center.z+12);light.castShadow=model.bins.length<=64
    light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-span-12;light.shadow.camera.right=span+12;light.shadow.camera.top=span+12;light.shadow.camera.bottom=-span-12;light.shadow.camera.far=span*8+100;light.shadow.normalBias=.04
    light.target.position.copy(center);scene.add(light.target);scene.add(light)
    for(const anchor of world.anchors){
      const {location}=anchor
      const element=document.createElement('button')
      element.type='button';element.className=`wh-scene-label${anchor.selected?' is-selected':''}${!anchor.matches?' is-dimmed':''}`
      element.textContent=location.code;element.title=`${location.code} · ${location.used}/${location.capacity}`
      element.setAttribute('aria-label',`Open location ${location.code}`)
      element.dataset.enabled=String(isInterior||anchor.selected||Boolean(searchTerm.trim())&&anchor.matches)
      element.onclick=()=>select.current(location);node.appendChild(element)
      element.dataset.location=location.id
      element.dataset.normalEnabled=element.dataset.enabled
      const position=(isInterior?anchor.interior:anchor.exterior).clone()
      labels.push({element,position,normalY:position.y})
    }
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2()
    let down = null
    function pointerDown(e) { down = [e.clientX,e.clientY] }
    function pointerUp(e) {
      if (!down || Math.hypot(e.clientX-down[0], e.clientY-down[1]) > 6) return
      const rect = canvas.getBoundingClientRect()
      pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1)
      ray.setFromCamera(pointer,camera)
      const hit = ray.intersectObjects(pickables)[0]
      if (hit) select.current(hit.object.userData.location)
    }
    function contextLost(e) { e.preventDefault(); finishPlayback('unavailable');setError('WebGL context lost. Open the location list to continue.'); }
    let viewportWidth=0,viewportHeight=0
    function resize() {
      const width=node.clientWidth,height=node.clientHeight
      if (!width || !height || (width===viewportWidth && height===viewportHeight)) return
      viewportWidth=width;viewportHeight=height
      // CSS owns canvas dimensions; never feed renderer size back into the host.
      renderer.setSize(width,height,false)
      camera.aspect=width/height;camera.updateProjectionMatrix()
      reset()
    }
    actions.current = { reset,startTransfer,skip:()=>finishPlayback('skipped'), zoom: factor => { camera.position.sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance).add(controls.target); controls.update(); requestDraw() } }
    canvas.addEventListener('pointerdown',pointerDown)
    canvas.addEventListener('pointerup',pointerUp)
    canvas.addEventListener('webglcontextlost',contextLost)
    controls.addEventListener('change',requestDraw)
    const observer = new ResizeObserver(resize); observer.observe(node)
    resize()
    node.dataset.bins = String(model.bins.length)
    node.dataset.style='sunset-warehouse-campus';node.dataset.interior=String(isInterior)
    node.dataset.bounds=JSON.stringify({min:world.bounds.min.toArray(),max:world.bounds.max.toArray()})
    return () => {
      disposed = true
      // React StrictMode probes effects, and scene props may rebuild the renderer.
      // Dispose the old rig immediately, but let a same-turn setup resume its clock.
      if(playback){
        const resume={event:playback.event,start:playback.start};resumable.current=resume;playedId.current=null
        finishPlayback('skipped',false)
        queueMicrotask(()=>{if(resumable.current===resume){resumable.current=null;notifyEnd.current?.(resume.event.id,'skipped')}})
      }
      cancelAnimationFrame(frame); observer.disconnect()
      document.removeEventListener('visibilitychange',visibilityChanged);motion.removeEventListener('change',motionChanged)
      canvas.removeEventListener('pointerdown',pointerDown); canvas.removeEventListener('pointerup',pointerUp)
      canvas.removeEventListener('webglcontextlost',contextLost)
      controls.removeEventListener('change',requestDraw); controls.dispose()
      world.dispose();light.dispose()
      renderer.dispose(); renderer.forceContextLoss()
      labels.forEach(({element}) => element.remove()); canvas.remove(); actions.current = null
    }
  }, [locations, searchTerm, selectedId, error, isInterior])
  useEffect(()=>{
    if(!transferEvent)return
    if(error){onTransferEnd?.(transferEvent.id,'unavailable');return}
    actions.current?.startTransfer(transferEvent)
  },[transferEvent,locations,searchTerm,selectedId,error,isInterior,onTransferEnd])
  const phases={approach:'Approaching source',pickup:'Picking up',carry:'Moving through the aisle',drop:'Placing at destination',return:'Returning forklift',complete:'Complete'}
  return <section className="wh-3d" aria-label="3D warehouse campus">
    <div className="wh-scene-toolbar"><div className="wh-scene-modes"><button type="button" aria-pressed={!isInterior} disabled={Boolean(transferEvent)} onClick={()=>setInterior(false)}>Exterior</button><button type="button" aria-pressed={isInterior} disabled={Boolean(transferEvent)} onClick={()=>setInterior(true)}>Interior</button></div><div><button type="button" onClick={()=>actions.current?.zoom(.8)} aria-label="Zoom in">+</button><button type="button" onClick={()=>actions.current?.zoom(1.25)} aria-label="Zoom out">−</button><button type="button" onClick={()=>actions.current?.reset()}>Reset view</button></div></div>
    {transferEvent&&<div className="wh-transfer-banner" role="status" aria-live="polite"><div><strong>Transfer saved</strong><span>{transferEvent.qty} units · {transferEvent.productName} · {locations.find(l=>l.id===transferEvent.from)?.code||transferEvent.from} → {locations.find(l=>l.id===transferEvent.to)?.code||transferEvent.to}</span><small>{phases[transferPhase]} · Visual replay, not an additional stock movement</small></div><button type="button" onClick={()=>actions.current?.skip()}>Skip animation</button></div>}
    <div className="wh-scene-host" ref={host} style={error?{display:'none'}:undefined}/>
    {error&&<div className="wh-no-results" role="alert">{error}<button type="button" className="wh-secondary" onClick={onFallback}>Open locations</button></div>}
    {overflowCount>0&&<p className="wh-scene-help" role="status">3D displays up to 256 locations. {overflowCount} more locations are available in the complete location list.</p>}
    <div className="wh-scene-caption"><span><i/> Interactive 3D workspace</span><span>Drag to orbit · Scroll to zoom · Interior to explore shelves</span></div>
    <p className="wh-scene-help">Illustrative facility and vehicles, not tracked assets. Shelf contents reflect inventory allocations.</p>
  </section>
}
