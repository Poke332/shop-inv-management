import { lazy, Suspense, useState } from 'react'
import { FiBox,FiList,FiSearch,FiArrowRight,FiLayers,FiPlus,FiActivity,FiGrid } from 'react-icons/fi'
import '../styles/warehouse.css'
const WarehouseScene=lazy(()=>import('../components/warehouse/WarehouseScene.jsx'))
const statuses={empty:'Empty',partial:'In use',full:'Full',inactive:'Inactive',pool:'Unassigned'}
const reasons={allocate:'Allocation',transfer:'Transfer','return-to-pool':'Return to unassigned','settle-order':'Order adjustment','settle-manual':'Stock adjustment'}

export default function WarehouseWorkspace({data,movements,role,canWrite,searchTerm,setSearchTerm,highlightLocation,onLocationClick,onCreate,children,transferEvent,transferNotice,onTransferEnd}){
 const [view,setView]=useState('3d')
 const displayedView=transferEvent?'3d':view
 const showLocations=()=>{if(transferEvent)onTransferEnd(transferEvent.id,'skipped');setView('list')}
 const bays=data.items.filter(l=>l.id!=='POOL'),active=bays.filter(l=>l.active)
 const term=searchTerm.trim().toLocaleLowerCase('en')
 const visible=bays.filter(loc=>!term||[loc.code,loc.label,loc.zone,loc.rack,...loc.contents.map(c=>c.name)].filter(Boolean).some(v=>String(v).toLocaleLowerCase('en').includes(term)))
 const pending=data.unallocated.filter(p=>p.unallocated>0)
 const pool={...(data.items.find(l=>l.id==='POOL')||{id:'POOL',code:'POOL',status:'pool'}),label:'Unassigned',contents:pending.map(p=>({productId:p.productId,name:p.name,qty:p.unallocated}))}
 const allocated=bays.reduce((n,l)=>n+l.used,0),capacity=active.reduce((n,l)=>n+l.capacity,0),utilization=capacity?Math.round(allocated/capacity*100):0
 const name=id=>!id||id==='POOL'?'Unassigned':data.items.find(l=>l.id===id)?.code||id
 return <>
  <header className="wh-header"><div><p className="wh-eyebrow">OPERATIONS / SPATIAL INVENTORY</p><h1>Warehouse 3D</h1><p>A clearer view of your space. A closer look at every item.</p></div><div className="wh-mode"><span><i/> Local workspace</span><small>{role==='staff'?'Staff · read-only':`${role==='manager'?'Manager':'Admin'} · manage inventory`}</small></div></header>
  <dl className="wh-summary" aria-label="Warehouse summary">
   <div><dt><FiBox aria-hidden="true"/>Total stock</dt><dd>{(allocated+data.stats.unallocatedUnits).toLocaleString('en')}<span> units</span></dd><small>{data.unallocated.length} stocked products</small></div>
   <div><dt><FiLayers aria-hidden="true"/>Allocated</dt><dd>{allocated.toLocaleString('en')}<span> units</span></dd><small>Across {active.length} active locations</small></div>
   <div><dt><FiActivity aria-hidden="true"/>Space utilization</dt><dd>{utilization}<span>%</span></dd><small>{Math.max(0,capacity-allocated).toLocaleString('en')} units of space available</small></div>
   <div><dt><FiGrid aria-hidden="true"/>Unassigned</dt><dd>{data.stats.unallocatedUnits.toLocaleString('en')}<span> units</span></dd><small>{pending.length} products ready to allocate</small></div>
  </dl>
  <section className="wh-panel wh-main" aria-labelledby="wh-layout-title">
   <div className="wh-toolbar"><div><span className="wh-eyebrow">YOUR WAREHOUSE, IN PERSPECTIVE</span><h2 id="wh-layout-title">Facility overview</h2></div><div className="wh-view" aria-label="Warehouse view"><button type="button" aria-pressed={displayedView==='3d'} onClick={()=>setView('3d')}><FiLayers aria-hidden="true"/>3D overview</button><button type="button" aria-pressed={displayedView==='list'} onClick={showLocations}><FiList aria-hidden="true"/>Locations</button></div></div>
   <div className="wh-tools"><label className="wh-search" htmlFor="global-search"><FiSearch aria-hidden="true"/><span className="sr-only">Search products or locations</span><input id="global-search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search a product, location or zone…"/>{searchTerm&&<button type="button" onClick={()=>setSearchTerm('')} aria-label="Clear search">×</button>}</label>{canWrite&&<button type="button" className="wh-secondary" onClick={onCreate}><FiPlus aria-hidden="true"/>Add location</button>}</div>
   <div className="wh-workspace">
    <div className="wh-stage">{displayedView==='3d'?<Suspense fallback={<p className="wh-no-results">Loading 3D workspace…</p>}><WarehouseScene locations={data.items} searchTerm={searchTerm} selectedId={highlightLocation} onSelect={onLocationClick} onFallback={showLocations} transferEvent={transferEvent} onTransferEnd={onTransferEnd}/></Suspense>:<section className="wh-location-list" aria-label="Storage locations">{visible.map(loc=><button type="button" key={loc.id} className={`wh-location-row ${highlightLocation===loc.id?'is-selected':''}`} onClick={()=>onLocationClick(loc)}><div><strong>{loc.code}</strong><small>{loc.zone} · Rack {loc.rack||'—'} · {loc.label}</small><small>{loc.contents.map(c=>`${c.name} × ${c.qty}`).join(', ')||'No products allocated'}</small></div><div><span className={`wh-status wh-status-${loc.status}`}>{statuses[loc.status]}</span><small>{loc.used} / {loc.capacity} units</small></div><FiArrowRight aria-hidden="true"/></button>)}{!visible.length&&<p className="wh-no-results">No matching locations.</p>}</section>}</div>
    <aside className="wh-inspector" aria-label="Inventory overview"><div className="wh-inspector-title"><span className="wh-card-icon"><FiBox aria-hidden="true"/></span><div><span className="wh-eyebrow">INVENTORY OVERVIEW</span><h3>Ready for a place</h3></div></div><p>Unassigned stock, ready to move into a storage location.</p><div className="wh-pool-total">{data.stats.unallocatedUnits.toLocaleString('en')}<span> units unassigned</span></div><div className="wh-pool-products">{pending.filter(p=>!term||p.name.toLocaleLowerCase('en').includes(term)||'unassigned pool'.includes(term)).map(p=><div key={p.productId}><span className="wh-product-icon"><FiBox aria-hidden="true"/></span><span>{p.name}<small>Available to allocate</small></span><strong>{p.unallocated}</strong></div>)}{!pending.length&&<p>All stock has a location.</p>}</div><button type="button" className="wh-pool-link" onClick={()=>onLocationClick(pool)}>View unassigned stock <FiArrowRight aria-hidden="true"/></button><div className="wh-inspector-note"><span className="wh-live-dot"/>Connected to the local inventory API<br/><small>Scenery is illustrative. Inventory counts are live.</small></div></aside>
   </div>
   <div className="wh-legend" aria-label="Location status legend">{['empty','partial','full','inactive'].map(s=><span key={s}><i className={`wh-dot wh-dot-${s}`}/>{statuses[s]}</span>)}<span className="wh-result" role="status">{term?`${visible.length} matching locations`:'Schematic layout · not a surveyed floor plan'}</span></div>
  </section>
  {transferNotice && <p className="wh-transfer-notice" role="status">{transferNotice}</p>}
  {children}
  {!canWrite&&<p className="wh-readonly">Read-only access. A manager or admin can allocate stock and configure locations.</p>}
  <section className="wh-panel wh-history" aria-labelledby="wh-history-title"><div className="wh-toolbar"><div><span className="wh-eyebrow">EVERY MOVE, ACCOUNTED FOR</span><h2 id="wh-history-title">Recent movements</h2><p>Latest 20 entries. Stock adjustments do not represent physical picking.</p></div><span className="wh-history-count">{movements.length} entries</span></div><div className="wh-table-wrap" tabIndex={0} role="region" aria-label="Stock movement history"><table><thead><tr><th>Time</th><th>Product / operator</th><th>Movement</th><th>Quantity</th><th>Type</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td><time>{m.createdAt}</time></td><td><strong>{m.productName||m.productId}</strong><small>by {m.actor}</small></td><td>{name(m.from)} → {name(m.to)}</td><td><strong>{m.qty}</strong> units</td><td>{reasons[m.reason]||m.reason}</td></tr>)}{!movements.length&&<tr><td colSpan={5} className="wh-empty-history">No movements yet. Allocate stock to begin your history.</td></tr>}</tbody></table></div></section>
 </>
}
