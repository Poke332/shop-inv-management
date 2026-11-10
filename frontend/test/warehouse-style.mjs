import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir,writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { PerspectiveCamera,Vector3 } from 'three'
const base=process.env.WAREHOUSE_TEST_BASE||'http://127.0.0.1:5180'
const out=new URL(process.env.WAREHOUSE_EVIDENCE_URL||'../../work-in-progress-warehouse/3d-style-revision/after/',import.meta.url)
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'chrome'}:{executablePath:'/home/christo/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']})
const checks=[],errors=[];const pass=name=>{checks.push(name);console.log('PASS',name)}
async function login(page,role='manager'){
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(base+'/ops/warehouse');await page.locator('input[type=email]').fill(role+'@warehouse.test');await page.getByRole('textbox',{name:'Password',exact:true}).fill('Fixture-only-2026!');await page.getByRole('button',{name:'Sign in →',exact:true}).click();await page.getByRole('heading',{name:'Warehouse 3D',exact:true}).waitFor({timeout:5000})
}
async function screenshot(page,name){await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),fullPage:true})}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}})
 await page.addInitScript(()=>{window.__contexts=[];const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const context=original.call(this,type,...args);if(type==='webgl2'&&context&&!window.__contexts.includes(context))window.__contexts.push(context);return context}})
 await login(page)
 await page.evaluate(async()=>{const {API_BASE}=await import('/src/data/runtime.js');if(API_BASE!=='http://127.0.0.1:3138/api')throw new Error('Refusing non-isolated fixture');const {httpApi}=await import('/src/data/httpApi.js');const data=await httpApi.getWarehouseOverview();for(const l of data.items.filter(l=>l.id!=='POOL'))for(const p of l.contents)await httpApi.moveWarehouseStock({productId:p.productId,from:l.id,to:'POOL',qty:p.qty})})
 await page.reload();await page.getByRole('heading',{name:'Warehouse 3D',exact:true}).waitFor()
 const host=page.locator('.wh-scene-host'),canvas=host.locator('canvas')
 await canvas.waitFor();await page.waitForFunction(()=>Number(document.querySelector('.wh-scene-host')?.dataset.frames)>0)
 assert.equal(await page.getByRole('button',{name:/2D|Peta/}).count(),0);assert.equal(await page.locator('.wh-map').count(),0);assert.equal(await host.getAttribute('data-style'),'sunset-warehouse-campus');pass('3D is default, 2D map removed, English warehouse navigation')
 assert.equal(await page.getByRole('link',{name:'Warehouse 3D',exact:true}).count(),1)
 await screenshot(page,'desktop-overview')
 await page.locator('.wh-stage').screenshot({path:fileURLToPath(new URL('sunset-campus.png',out))})
 const fit=async(name)=>{
  const state=await host.evaluate(node=>({camera:node.dataset.camera,target:node.dataset.target,bounds:JSON.parse(node.dataset.bounds),fov:43,aspect:node.clientWidth/node.clientHeight}))
  const projection=new PerspectiveCamera(state.fov,state.aspect,.1,100000);projection.position.fromArray(state.camera.split(',').map(Number));projection.lookAt(new Vector3(...state.target.split(',').map(Number)));projection.updateMatrixWorld()
  const corners=[];for(const x of [state.bounds.min[0],state.bounds.max[0]])for(const y of [state.bounds.min[1],state.bounds.max[1]])for(const z of [state.bounds.min[2],state.bounds.max[2]])corners.push(new Vector3(x,y,z).project(projection).toArray())
  assert.ok(corners.every(([x,y,z])=>Math.abs(x)<.91&&Math.abs(y)<.91&&z>-1&&z<1),name);await writeFile(new URL(name+'-geometry.json',out),JSON.stringify({state,corners},null,2))
 }
 await fit('desktop-campus');pass('entire campus fits desktop framing')
 const initial=await host.getAttribute('data-camera'),rect=await canvas.boundingBox()
 await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height*.65);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.4,rect.y+rect.height*.7,{steps:10});await page.mouse.up();await page.waitForTimeout(100);assert.notEqual(await host.getAttribute('data-camera'),initial)
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(100)
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(100);assert.equal(await host.getAttribute('data-camera'),initial);pass('orbit, zoom and reset remain interactive')
 await page.getByRole('button',{name:'Interior',exact:true}).click();assert.equal(await host.getAttribute('data-interior'),'true');await page.getByRole('button',{name:'Open location A1-01',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');pass('interior exposes actual shelves and location details')
 async function live(){return page.evaluate(async()=>{const {httpApi}=await import('/src/data/httpApi.js');return httpApi.getWarehouseOverview()})}
 page.on('dialog',dialog=>dialog.accept())
 async function move(product,from,to,qty){
  await page.locator('#move-source').selectOption(from==='POOL'?'pool':'bin');if(from!=='POOL')await page.locator('#move-from').selectOption(from)
  await page.locator('#move-product').selectOption(product);await page.locator('#move-to').selectOption(to);await page.locator('#move-qty').fill(String(qty))
  const response=page.waitForResponse(r=>r.url().endsWith('/warehouse/move')&&r.request().method()==='POST');await page.locator('form[aria-label="Stock allocation and transfers"] button[type=submit]').click();assert.equal((await response).status(),201);await page.waitForFunction(()=>document.querySelector('#move-product')?.value===''&&document.querySelector('#move-source')?.value==='pool')
 }
 await move('FIXTURE-1','POOL','ZA-R1-B1',12);await move('FIXTURE-2','POOL','ZB-R1-B1',8);assert.equal((await live()).stats.unallocatedUnits,0);await move('FIXTURE-1','ZA-R1-B1','ZA-R1-B2',12);await page.reload();await page.getByRole('heading',{name:'Warehouse 3D',exact:true}).waitFor();assert.equal((await live()).items.find(l=>l.id==='ZA-R1-B2').used,12);pass('real HTTP stock allocation, zero-pool transfer and reload persistence preserved')
 await page.locator('#global-search').fill('Fixture keyboard');await page.getByRole('button',{name:'Interior',exact:true}).click();await page.getByRole('button',{name:'Open location A1-02',exact:true}).click();assert.ok((await page.getByRole('dialog').innerText()).includes('Fixture keyboard'));await screenshot(page,'desktop-selected');await page.keyboard.press('Escape');await page.locator('#global-search').fill('');pass('search highlights actual assigned product and detail content')
 await move('FIXTURE-1','ZA-R1-B2','POOL',12);await move('FIXTURE-2','ZB-R1-B1','POOL',8)
 await page.getByRole('button',{name:'Add location',exact:true}).click();await page.getByRole('dialog').waitFor();assert.ok((await page.getByRole('dialog').innerText()).includes('Create location'));await page.keyboard.press('Escape');pass('English configuration modal and keyboard dismissal')
 const frames=await host.getAttribute('data-frames');await page.waitForTimeout(500);assert.equal(await host.getAttribute('data-frames'),frames);pass('no perpetual rendering while idle')
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Locations',exact:true}).click();assert.equal(await page.locator('canvas').count(),0);await page.getByRole('button',{name:'3D overview',exact:true}).click();await canvas.waitFor();await page.waitForTimeout(100)}
 assert.ok((await page.evaluate(()=>window.__contexts.slice(0,-1).every(gl=>gl.isContextLost()))));pass('view changes release retired WebGL contexts')
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await canvas.scrollIntoViewIfNeeded();await fit('mobile-campus');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await screenshot(page,'mobile-overview');pass('full campus fits mobile without horizontal overflow')
 await page.evaluate(()=>window.__contexts.at(-1).getExtension('WEBGL_lose_context').loseContext());await page.getByRole('alert').filter({hasText:'WebGL context lost'}).waitFor();await page.getByRole('button',{name:'Open locations',exact:true}).click();await page.getByRole('region',{name:'Storage locations',exact:true}).waitFor();assert.equal(await page.locator('.wh-map').count(),0);pass('context-loss fallback uses accessible list, never restores 2D')
 const noGL=await browser.newPage({viewport:{width:390,height:844}});await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).startsWith('webgl')?null:original.call(this,type,...args)}});await login(noGL);await noGL.getByRole('alert').filter({hasText:'WebGL is unavailable'}).waitFor();await noGL.getByRole('button',{name:'Open locations',exact:true}).click();await noGL.getByRole('region',{name:'Storage locations',exact:true}).waitFor();pass('missing WebGL retains keyboard location access')
 const staff=await browser.newPage();await login(staff,'staff');assert.equal(await staff.locator('#move-source').count(),0);assert.equal(await staff.getByRole('button',{name:'Add location',exact:true}).count(),0);pass('staff remains read-only')
 assert.deepEqual(errors,[]);pass('no unexpected browser JavaScript errors')
}catch(error){const page=browser.contexts()[0]?.pages()[0];if(page)await screenshot(page,'failure');console.error(error);throw error}
finally{await browser.close();await writeFile(new URL('results.json',out),JSON.stringify({checks,errors},null,2))}
