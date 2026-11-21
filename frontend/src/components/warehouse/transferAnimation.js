// Bins are 2.2×2 with 4.5 between rows. A scaled forklift fits the clear
// row aisles and the narrow corridor just inside the right-hand wall.
export function planTransfer(event,model) {
  if(!event || event.from==='POOL' || event.to==='POOL' || event.from===event.to)return null
  const source=model.bins.find(b=>b.id===event.from),destination=model.bins.find(b=>b.id===event.to)
  if(!source||!destination)return null
  const maxX=Math.max(...model.bins.map(b=>b.x)),maxZ=Math.max(...model.bins.map(b=>b.z))
  const corridor=maxX+1.55,park=[-1.1,maxZ+4.8]
  const from=[source.x,source.z+2.25],to=[destination.x,destination.z+2.25]
  const tidy=points=>points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1])
  return {event,source,destination,durationMs:11000,
    approach:tidy([park,[corridor,park[1]],[corridor,from[1]],from]),
    carry:tidy(from[1]===to[1]?[from,to]:[from,[corridor,from[1]],[corridor,to[1]],to]),
    returning:tidy([to,[corridor,to[1]],[corridor,park[1]],park])}
}
function along(points,progress) {
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]))
  let remaining=distances.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress))
  for(let i=0;i<distances.length;i++){
    if(remaining<=distances[i]||i===distances.length-1){
      const a=points[i],b=points[i+1],t=distances[i]?Math.min(1,remaining/distances[i]):1
      return {position:[a[0]+(b[0]-a[0])*t,.08,a[1]+(b[1]-a[1])*t],yaw:Math.atan2(b[0]-a[0],b[1]-a[1])}
    }
    remaining-=distances[i]
  }
  return {position:[points[0][0],.08,points[0][1]],yaw:Math.PI}
}
export function sampleTransfer(plan,elapsedMs) {
  const t=Math.max(0,Math.min(1,elapsedMs/plan.durationMs))
  let phase,pose,cargoY=.95,cargoZ=1.1
  if(t<.22){phase='approach';pose=along(plan.approach,t/.22)}
  else if(t<.32){phase='pickup';pose={...along(plan.approach,1),yaw:Math.PI};const p=(t-.22)/.1;cargoY=.55+.4*p;cargoZ=2.6-1.5*p}
  else if(t<.68){phase='carry';pose=along(plan.carry,(t-.32)/.36)}
  else if(t<.78){phase='drop';pose={...along(plan.carry,1),yaw:Math.PI};const p=(t-.68)/.1;cargoY=.95-.4*p;cargoZ=1.1+1.5*p}
  else {phase=t===1?'complete':'return';pose=along(plan.returning,(t-.78)/.22)}
  return {...pose,phase,cargoVisible:['pickup','carry','drop'].includes(phase),cargoY,cargoZ,done:t===1}
}

// Visual events come only from the successful HTTP mutation response.
// None of the playback helpers read/write inventory or call the API.
export function confirmedTransfer(result) {
  if(!result || result.reason!=='transfer' || !result.movement?.id ||
    typeof result.from!=='string' || typeof result.to!=='string' ||
    result.from==='POOL' || result.to==='POOL' || result.from===result.to ||
    !Number.isSafeInteger(result.qty) || result.qty<=0 || typeof result.productId!=='string')return null
  return {id:String(result.movement.id),from:result.from,to:result.to,qty:result.qty,productId:result.productId,productName:result.product?.name||result.productId}
}
