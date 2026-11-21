// Hide colliding projected labels; the keyboard list still exposes every location.
export function visibleSceneLabels(labels, width, height, selectedIndex = -1) {
  const visible = labels.map(() => false), occupied = []
  const order = labels.map((_,i)=>i).sort((a,b)=>Number(b===selectedIndex)-Number(a===selectedIndex))
  for (const index of order) {
    const p=labels[index], box={left:p.x-p.width/2,right:p.x+p.width/2,top:p.y-p.height/2,bottom:p.y+p.height/2}
    if (p.clipped || box.left<4 || box.right>width-4 || box.top<4 || box.bottom>height-4) continue
    if (occupied.some(b=>box.left<b.right+4&&box.right>b.left-4&&box.top<b.bottom+4&&box.bottom>b.top-4)) continue
    visible[index]=true; occupied.push(box)
  }
  return visible
}

// Both views use configured zone/rack/bay ordering, NOT measured physical coordinates.
export function mapWarehouseScene(locations, search = '', selectedId = null) {
  const term = String(search ?? '').trim().toLocaleLowerCase('id')
  const unique = new Map()
  for (const l of Array.isArray(locations) ? locations : []) {
    if (l && typeof l.id==='string' && l.id && l.id!=='POOL' && !unique.has(l.id)) unique.set(l.id,l)
  }
  const key=l=>`${l.zone ?? ''}\u0000${l.rack ?? ''}`
  const all=[...unique.values()].sort((a,b)=>key(a).localeCompare(key(b)) || (Number(a.bay)||0)-(Number(b.bay)||0) || String(a.code??'').localeCompare(String(b.code??'')))
  const bays=all.slice(0,256)
  const selected=unique.get(selectedId)
  if(selected&&!bays.includes(selected))bays[bays.length-1]=selected
  const groups = [...new Set(bays.map(key))].sort()
  const bins = groups.flatMap((group,row)=>bays.filter(l=>key(l)===group).map((location,column)=>({
    id:location.id,location,x:column*2.6,z:row*4.5,
    fill:Number.isFinite(location.used/location.capacity)?Math.max(0,Math.min(1,location.used/location.capacity)):0,
    selected:selectedId===location.id,
    matches:!term || [location.code,location.label,location.zone,location.rack,...(Array.isArray(location.contents)?location.contents:[]).map(c=>c?.name)].filter(v=>v!=null).some(v=>String(v).toLocaleLowerCase('id').includes(term)),
  })))
  return { bins, overflow:Math.max(0,all.length-bins.length), width:Math.max(6,...bins.map(b=>b.x+3)), depth:Math.max(6,...bins.map(b=>b.z+3)) }
}
