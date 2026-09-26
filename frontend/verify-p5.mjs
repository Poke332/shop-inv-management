// P5 ops-console verification harness — headless Chromium over CDP (native
// WS/fetch, same pattern as verify-p3.mjs). Drives the 3-role acceptance
// matrix on the live dev server at 1312px, the 390px overflow check per ops
// page, nav role-gating, and 0-console-error collection.
//
// Acceptance matrix (the task's DONE CRITERIA):
//   staff   /ops/orders: WB-1042 receipt expanded by default; advance
//           pending -> processing (optimistic + flash); force a failure
//           (armOrdersFailure) on WB-1039 to show the REVERT + toast.
//           /ops/inventory read-only (no steppers / editor links).
//   manager /ops/inventory: P-231 stock stepper 34 -> 35 (row flash).
//           /ops/products: P-231 editor pre-filled (6 spec rows); add a
//           spec row + save -> success flash.
//   admin   /ops/users: ops_dan disabled row (3px strawberryRed-500 left
//           bar); own row has no controls; change ops_marta staff ->
//           manager via the confirm dialog -> "Role updated to manager ·
//           ops_marta" flash.
//
// The dev server's first visit is slow (vite on-demand transform), so every
// content assertion polls (waitFor / waitForText) instead of a fixed sleep.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const BIN =
  process.env.CHROME_BIN ||
  '/home/richie/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'
const PORT = 9338
const BASE = 'http://127.0.0.1:5199'
const OUT = '/tmp/p5-verify'
mkdirSync(OUT, { recursive: true })

const chrome = spawn(
  BIN,
  ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${PORT}`, 'about:blank'],
  { stdio: 'ignore' },
)

function cdpClient() {
  let id = 0
  const pend = new Map()
  let ws
  const ev = new Set()
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const myId = ++id
      pend.set(myId, { res, rej })
      ws.send(JSON.stringify({ id: myId, method, params }))
    })

  async function start() {
    let target
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/json/list`)
        const list = await r.json()
        target = list.find((t) => t.type === 'page')
        if (target) break
      } catch {
        /* not up yet */
      }
      await new Promise((s) => setTimeout(s, 250))
    }
    if (!target) throw new Error('no CDP page target')
    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((res, rej) => {
      ws.onopen = res
      ws.onerror = rej
    })
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data)
      if (msg.id && pend.has(msg.id)) {
        const p = pend.get(msg.id)
        pend.delete(msg.id)
        msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result)
      } else if (msg.method) ev.forEach((f) => f(msg))
    }
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 1312, height: 736, deviceScaleFactor: 1, mobile: false })
    return { start, send, navigate, evalJs, device, seedSession, shot, overflow, settle, trackConsole, consoleErrors, waitFor, waitUntil, freshStore }
  }

  const evalJs = (expression) =>
    send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => {
      if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails))
      return r.result.value
    })

  const settle = (ms) => new Promise((s) => setTimeout(s, ms))

  async function navigate(url, wait = 1200) {
    await send('Page.navigate', { url })
    await settle(wait)
  }

  const device = (w, h, mobile) =>
    send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile })

  async function seedSession(role, username) {
    await navigate(`${BASE}/login`, 900)
    await evalJs(
      role
        ? `sessionStorage.setItem('sunset.session', JSON.stringify({username:${JSON.stringify(username)}, role:${JSON.stringify(role)}}))`
        : `sessionStorage.removeItem('sunset.session')`,
    )
  }

  // re-seed the shared store to the pristine fixtures (the dev QA bridge).
  // Called at the head of each role section so the acceptance matrix is
  // independent of earlier sections' mutations (WB-1042 pending again, etc).
  async function freshStore() {
    await evalJs('window.__sunset?.mockApi?.resetData?.()')
  }

  async function shot(name) {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
    return `${OUT}/${name}.png`
  }

  async function overflow(name) {
    const o = await evalJs(`({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    })`)
    return { page: name, ...o, overflowPx: o.sw - o.iw, hasOverflow: o.sw > o.iw + 1 }
  }

  // poll until a selector matches (bounded) — the dev server's first visit
  // is slow (vite on-demand transform), so fixed waits are not enough
  async function waitFor(selector, timeout = 15000, step = 300) {
    const t0 = Date.now()
    for (;;) {
      try {
        const found = await evalJs(`!!document.querySelector(${JSON.stringify(selector)})`)
        if (found) return true
      } catch {
        /* page mid-navigation */
      }
      if (Date.now() - t0 > timeout) return false
      await settle(step)
    }
  }

  // poll until the expression in the page returns truthy (bounded)
  async function waitUntil(expression, timeout = 15000, step = 300) {
    const t0 = Date.now()
    for (;;) {
      try {
        const ok = await evalJs(expression)
        if (ok) return true
      } catch {
        /* page mid-navigation */
      }
      if (Date.now() - t0 > timeout) return false
      await settle(step)
    }
  }

  // ---- console error tracking (0 errors is a DONE criterion) ----
  const consoleEvents = []
  const trackConsole = () => {
    ev.add((m) => {
      if (m.method === 'Runtime.exceptionThrown') {
        consoleEvents.push({ kind: 'uncaught', text: m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || 'exception' })
      } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        consoleEvents.push({ kind: 'console.error', text: (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ') })
      }
    })
  }
  const consoleErrors = () => consoleEvents

  return { start, send, navigate, evalJs, device, seedSession, shot, overflow, settle, trackConsole, consoleErrors, waitFor, waitUntil, freshStore }
}

const REPORT = []
let PASS = 0
let FAIL = 0
const check = (label, cond, detail = '') => {
  if (cond) {
    PASS += 1
    console.log(`  ok  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    FAIL += 1
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
  REPORT.push({ label, pass: !!cond, detail })
}

async function main() {
  const c = await cdpClient().start()
  c.trackConsole()

  // ================= STAFF: ongoing orders =================
  await c.device(1312, 736, false)
  await c.seedSession('staff', 'ops_marta')
  await c.freshStore()
  await c.navigate(`${BASE}/ops/orders`)
  check('staff: orders queue loads (tabs render)', await c.waitUntil(`!!document.querySelector('.ops-tabs')`), 'no tabs after 15s')

  const staffNav = await c.evalJs(
    `[...document.querySelectorAll('a.ops-nav-item')].map(a => a.textContent.replace(/\\s+/g,' ').trim())`,
  )
  check(
    'staff nav = Ongoing Orders + Inventory + Products (no Reviews/Users)',
    staffNav.length === 3 && staffNav[0].startsWith('Ongoing Orders') && !staffNav.some((x) => x.startsWith('Users')),
    JSON.stringify(staffNav),
  )

  // WB-1042 receipt expanded by default (the just-placed order)
  check('WB-1042 receipt expanded by default', await c.waitFor('.ops-receipt'))
  const queue = await c.evalJs(`({
    h1: document.querySelector('h1')?.textContent,
    tabs: [...document.querySelectorAll('.ops-tabs button')].map(b => b.textContent.replace(/\\s+/g,' ')),
    receiptTotal: (document.querySelector('.ops-receipt-total')?.textContent || '').includes('1.670.000'),
    shipTo: (document.querySelector('.ops-receipt-ship')?.textContent || '').includes('Jl. Kemang Selatan 12'),
    buyer: (document.querySelector('.ops-receipt-ship-buyer')?.textContent || '').includes('jordan.wjy'),
    openRows: document.querySelectorAll('article[aria-label^="Order"]').length,
  })`)
  check('staff: /ops/orders h1 + 5 tabs with counts', queue.h1 === 'Ongoing orders' && queue.tabs.length === 5, JSON.stringify(queue.tabs))
  check('WB-1042 receipt totals + ship-to + buyer', queue.receiptTotal && queue.shipTo && queue.buyer)

  // optimistic advance pending -> processing on WB-1042
  await c.evalJs(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Start processing' && b.closest('article[aria-label*="WB-1042"]')).map(b=>b.click())`)
  await c.settle(200) // optimistic state settles before the ~350ms mock resolves
  const optChip = await c.evalJs(`[...document.querySelectorAll('article[aria-label*="WB-1042"] .chip')].map(c=>c.textContent.trim()).join('|')`)
  check('WB-1042 optimistic advance (chip processing)', /processing/.test(optChip), optChip)
  // the success flash is ~2s transient — assert it before the reconciling
  // refetch settles, then take the settled (counts) snapshot after
  const flashOk = await c.waitUntil(`!!document.querySelector('article[aria-label*="WB-1042"].flash-row')`, 3000)
  check('WB-1042 success flash (willowGreen row tint)', flashOk)
  // the reconciling refetch must land before the settled snapshot is taken
  await c.waitUntil(`[...document.querySelectorAll('.ops-tabs button')].some(b=>b.textContent.includes('Processing (2)'))`, 8000)
  const settledVals = await c.evalJs(`({
    chip: [...document.querySelectorAll('article[aria-label*="WB-1042"] .chip')].map(c=>c.textContent.trim()),
    tabs: [...document.querySelectorAll('.ops-tabs button')].map(b=>b.textContent.replace(/\\s+/g,' ')),
  })`)
  const tabsJoined = settledVals.tabs.join(' ')
  check(
    'WB-1042 settled processing + tab counts updated',
    /processing/.test(settledVals.chip[0]) && tabsJoined.includes('Pending (2)') && tabsJoined.includes('Processing (2)'),
    JSON.stringify(settledVals),
  )
  await c.shot('staff-orders-adv')

  // force a failure on WB-1039 (processing -> shipped) to show the REVERT
  await c.evalJs(`window.__sunset?.armOrdersFailure ? window.__sunset.armOrdersFailure() : (window.__sunset='MISSING')`)
  const armed = await c.evalJs(`typeof window.__sunset?.armOrdersFailure`)
  check('dev QA bridge present (__sunset.armOrdersFailure)', armed === 'function')
  await c.evalJs(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Mark shipped' && b.closest('article[aria-label*="WB-1039"]')).map(b=>b.click())`)
  await c.settle(120) // optimistic move applied before the ~350ms mock latency
  const optFail = await c.evalJs(`[...document.querySelectorAll('article[aria-label*="WB-1039"] .chip')].map(c=>c.textContent.trim()).join('|')`)
  // mid-flight = the forward move is visible ("shipped"); if the mock
  // already resolved the revert first, "processing" is a valid post-click
  // state — the acceptance gate is the REVERT + toast below, not this
  // transient snapshot.
  check('WB-1039 forward move applied (shipped) or already reverted', /shipped|processing/.test(optFail), optFail)
  await c.settle(1500) // the reject lands -> revert + toast
  const reverted = await c.evalJs(`({
    chip: [...document.querySelectorAll('article[aria-label*="WB-1039"] .chip')].map(c=>c.textContent.trim()),
    toast: [...document.querySelectorAll('[role="alert"]')].map(e=>e.textContent.trim()).find(t=>/Status update failed/.test(t)) || null,
  })`)
  check('WB-1039 REVERTS to processing on failure', /processing/.test(reverted.chip[0]), JSON.stringify(reverted))
  check('failure toast "Status update failed — retry"', !!reverted.toast, reverted.toast || 'no toast found')
  await c.shot('staff-orders-fail')

  // ============ staff: inventory read-only ============
  await c.navigate(`${BASE}/ops/inventory`)
  check('staff: inventory table loads', await c.waitFor('#inv-row-P-231'))
  const inv = await c.evalJs(`({
    banner: (document.querySelector('.alert-banner')?.textContent || '').includes('Needs attention'),
    count: document.querySelector('.alert-count')?.textContent.trim() || null,
    outFirst: [...document.querySelectorAll('.alert-banner .alert-row')].map(r => (r.querySelector('.stock-pill')?.textContent || '').trim()),
    steppers: document.querySelectorAll('.stepper').length,
    editorLinks: [...document.querySelectorAll('a')].filter(a => a.textContent.trim() === 'Open editor').length,
    rows: !!document.querySelector('#inv-row-P-231') && !!document.querySelector('#inv-row-P-198') && !!document.querySelector('#inv-row-P-064'),
    pills: document.querySelectorAll('.stock-pill').length,
  })`)
  check('staff: inventory banner "Needs attention" + out-of-stock FIRST', inv.banner && !!inv.count && inv.outFirst[0].includes('Out of stock'), `count=${inv.count} first=${inv.outFirst[0]}`)
  check('staff: inventory READ-ONLY (no steppers, no editor links)', inv.steppers === 0 && inv.editorLinks === 0, `steppers=${inv.steppers}`)
  check('staff: 3 named stock rows + pills render', inv.rows && inv.pills >= 3, `rows=${inv.rows} pills=${inv.pills}`)

  // staff hitting a manager route redirects to their ops home (the guard
  // runs after hydration — poll the pathname, not a fixed wait)
  await c.navigate(`${BASE}/ops/products`, 900)
  const staffRedirOk = await c.waitUntil(`location.pathname === '/ops/orders'`, 8000)
  check('staff /ops/products -> /ops/orders (never a 403)', staffRedirOk, await c.evalJs('location.pathname'))
  await c.navigate(`${BASE}/ops/users`, 900)
  const staffUsersRedirOk = await c.waitUntil(`location.pathname === '/ops/orders'`, 8000)
  check('staff /ops/users -> /ops/orders', staffUsersRedirOk, await c.evalJs('location.pathname'))

  // ================= MANAGER: inventory + products =================
  await c.seedSession('manager', 'ops_rina')
  await c.freshStore()
  await c.navigate(`${BASE}/ops/inventory`)
  check('manager: inventory loads', await c.waitFor('#inv-row-P-231 .stepper'))
  const mNav = await c.evalJs(`[...document.querySelectorAll('a.ops-nav-item')].map(a=>a.textContent.replace(/\\s+/g,' ').trim())`)
  check(
    'manager nav = +Reviews, no Users',
    mNav.some((x) => x.startsWith('Reviews')) && !mNav.some((x) => x.startsWith('Users')),
    JSON.stringify(mNav),
  )
  const mInv = await c.evalJs(`({
    stepperForP231: !!document.querySelector('#inv-row-P-231 .stepper'),
    editorLink: [...document.querySelectorAll('a')].some(a => a.textContent.trim() === 'Open editor' && a.getAttribute('href') === '/ops/products/P-231/edit'),
  })`)
  check('manager: P-231 row has StockStepper + Open editor deep link', mInv.stepperForP231 && mInv.editorLink)

  // stock edit 34 -> 35 via the stepper input + Enter commit (the spec's
  // "commits on blur / Enter" path — a native blur doesn't bubble, but a
  // keydown Enter reaches React's root listener and runs commit()). Two
  // phases: type (React flushes the draft state on its own tick), THEN
  // commit — same-tick dispatch would read the stale draft. The flash row
  // only appears AFTER setStock resolves, so it is the commit signal.
  await c.evalJs(`(()=>{
    const input = document.querySelector('#inv-row-P-231 .stock-stepper-input')
    const p = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    p.call(input, '35'); input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)
  await c.settle(200)
  await c.evalJs(`(()=>{
    const input = document.querySelector('#inv-row-P-231 .stock-stepper-input')
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })()`)
  const stockFlashOk = await c.waitUntil(`!!document.querySelector('#inv-row-P-231.flash-row')`, 8000)
  const mStock = await c.evalJs(`({
    val: document.querySelector('#inv-row-P-231 .stock-stepper-input')?.value,
    flash: !!document.querySelector('#inv-row-P-231.flash-row'),
  })`)
  check('manager: P-231 stock 34 -> 35 committed (row flash)', mStock.val === '35' && stockFlashOk, JSON.stringify(mStock))

  // ============ manager: per-product editor (P-231 via deep link) ============
  await c.navigate(`${BASE}/ops/products/P-231/edit`)
  check('manager: P-231 editor loads', await c.waitFor('#pf-name'))
  const form = await c.evalJs(`({
    name: document.querySelector('#pf-name')?.value,
    price: document.querySelector('#pf-price')?.value,
    cat: document.querySelector('#pf-category')?.value,
    stock: document.querySelector('#pf-stock')?.value,
    specInputs: document.querySelectorAll('[aria-label="Specs"] input').length,
    saveDisabled: document.querySelector('button[type=submit]')?.disabled,
  })`)
  check(
    'manager: P-231 editor pre-filled (name/price/category/stock)',
    form.name.includes('Sony WF-C710N') && form.price === '1290000' && form.cat === 'audio' && form.stock === '35',
    JSON.stringify({ ...form, saveDisabled: undefined }),
  )
  check('P-231 editor pre-filled with 6 spec rows', form.specInputs === 12, `specInputs=${form.specInputs}`)

  // add a 7th spec pair, save -> success flash
  await c.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Add spec')).click()`)
  await c.settle(300)
  await c.evalJs(`(()=>{
    const ins = document.querySelectorAll('[aria-label="Specs"] input')
    const nameInput = ins[ins.length - 2]
    const valueInput = ins[ins.length - 1]
    const p = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    p.call(nameInput, 'Firmware'); nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    p.call(valueInput, 'v2.1'); valueInput.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)
  await c.evalJs(`document.querySelector('button[type=submit]').click()`)
  const savedOk = await c.waitUntil(`document.body.textContent.includes('Changes saved')`, 8000)
  const saved = await c.evalJs(`({
    flash: (document.querySelector('[role="status"].flash-banner')?.textContent || '').trim(),
    specInputs: document.querySelectorAll('[aria-label="Specs"] input').length,
  })`)
  check('manager: spec row added + saved (success flash, 7 rows)', savedOk && saved.flash.includes('Changes saved') && saved.specInputs === 14, JSON.stringify(saved))
  await c.shot('manager-products-p231')

  // the standalone /ops/products list: 330px list + editor split
  await c.navigate(`${BASE}/ops/products`)
  check('manager: /ops/products loads', await c.waitFor('[aria-label="Product list"]'))
  const list = await c.evalJs(`({
    listCol: document.querySelector('[aria-label="Product list"]')?.offsetWidth || 0,
    selRow: document.querySelector('[aria-pressed="true"]')?.textContent?.includes('Sony WF-C710N') || false,
    newBtn: [...document.querySelectorAll('button')].some(b => b.textContent.includes('New product')),
  })`)
  check('manager: /ops/products 330px list + P-231 selected + New product', list.listCol === 330 && list.selRow && list.newBtn, JSON.stringify(list))

  // ================= ADMIN: users =================
  await c.device(1312, 900, false)
  await c.seedSession('admin', 'admin_ria')
  await c.freshStore()
  await c.navigate(`${BASE}/ops/users`)
  // the summary line renders the LIVE store count (the seed holds 127 users —
  // the docs' "128" is the illustrative mockup count, like P4's "128 results"
  // -> live "48 results"; the page derives the count, never hard-codes it)
  check('admin: users table loads (summary line renders)', await c.waitUntil(`document.body.textContent.includes('users · 3 staff · 2 managers · 1 admin')`), 'no summary after 15s')
  const aNav = await c.evalJs(`[...document.querySelectorAll('a.ops-nav-item')].map(a=>a.textContent.replace(/\\s+/g,' ').trim())`)
  check('admin nav includes Users (admin-only item)', aNav.some((x) => x.startsWith('Users')), JSON.stringify(aNav))

  const users = await c.evalJs(`({
    badge: (document.querySelector('span.badge')?.textContent || '').trim(),
    summary: (document.querySelector('.text-blueSlate-700')?.textContent || '').trim(),
    namedRows: ['buyer_102','ops_marta','ops_dan','rian_w','admin_ria'].filter(n =>
      [...document.querySelectorAll('td span')].some(td => td.textContent.trim() === n)
    ).length,
    danBar: (()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('ops_dan')); return tr ? getComputedStyle(tr.firstElementChild).boxShadow : null })(),
    danPill: (()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('ops_dan')); return tr ? tr.textContent.includes('Disabled') : false })(),
    ownControls: (()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('admin_ria')); return tr ? tr.querySelectorAll('select, [role="switch"]').length : -1 })(),
    martaControls: (()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('ops_marta')); return tr ? tr.querySelectorAll('select, [role="switch"]').length : -1 })(),
  })`)
  check('admin: "Admin only" badge + count summary line', users.badge === 'Admin only' && /users · 3 staff · 2 managers · 1 admin/.test(users.summary), users.summary)
  check('admin: 5 named rows render', users.namedRows === 5, `named=${users.namedRows}`)
  check('ops_dan disabled row: 3px strawberryRed-500 left bar', /inset/.test(users.danBar || '') && /247, 8, 12/.test(users.danBar || ''), users.danBar)
  check('ops_dan row shows the Disabled pill', users.danPill)
  check('SELF-PROTECTION: admin_ria row has NO controls', users.ownControls === 0, `controls=${users.ownControls}`)
  check('ops_marta row has role select + toggle', users.martaControls === 2, `controls=${users.martaControls}`)
  await c.shot('admin-users')

  // role change: ops_marta staff -> manager via the confirm dialog
  await c.evalJs(`(()=>{
    const sel = document.getElementById('role-ops_marta')
    const p = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    p.call(sel, 'manager'); sel.dispatchEvent(new Event('change', { bubbles: true }))
  })()`)
  await c.settle(300)
  const dlg = await c.evalJs(`({
    open: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
    title: document.querySelector('[role="dialog"] h2')?.textContent || null,
  })`)
  check('role change opens ConfirmDialog naming user + old -> new role', dlg.open && dlg.title === 'Change ops_marta from staff to manager?', dlg.title)
  await c.evalJs(`[...document.querySelectorAll('.confirm-dialog button')].find(b=>b.textContent.trim()==='Change role').click()`)
  const roleOk = await c.waitUntil(`(document.querySelector('.flash-banner')?.textContent || '').includes('Role updated to manager · ops_marta')`, 8000)
  const roleFlash = await c.evalJs(`({
    flash: (document.querySelector('.flash-banner')?.textContent || '').trim(),
    badge: (()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('ops_marta')); return tr?.querySelector('.role-badge')?.textContent })(),
  })`)
  check('role success flash "Role updated to manager · ops_marta"', roleOk && roleFlash.flash === 'Role updated to manager · ops_marta', roleFlash.flash)
  check('ops_marta role badge now manager', roleFlash.badge === 'manager', roleFlash.badge)
  await c.shot('admin-users-roleflash')

  // disable flow (danger dialog) on rian_w
  await c.evalJs(`[...document.querySelectorAll('[role="switch"]')].find(s=>s.getAttribute('aria-label')==='Disable rian_w').click()`)
  await c.settle(300)
  const disableDlg = await c.evalJs(`({
    title: document.querySelector('[role="dialog"] h2')?.textContent || null,
    confirm: [...document.querySelectorAll('.confirm-dialog button')].find(b=>b.textContent.includes('Disable account'))?.className.includes('btn-destructive') || false,
  })`)
  check('disable opens the danger ConfirmDialog', disableDlg.title === 'Disable rian_w?' && disableDlg.confirm, disableDlg.title)
  await c.evalJs(`[...document.querySelectorAll('.confirm-dialog button')].find(b=>b.textContent.includes('Disable account')).click()`)
  await c.settle(1200)
  const rianAfter = await c.evalJs(`(()=>{ const tr=[...document.querySelectorAll('tr')].find(tr=>tr.textContent.includes('rian_w')); return getComputedStyle(tr.firstElementChild).boxShadow })()`)
  check('rian_w now disabled (3px red left bar)', /inset/.test(rianAfter) && /247, 8, 12/.test(rianAfter), rianAfter)

  // ============ 390px overflow checks per role/page ============
  await c.device(390, 844, true)
  const mPages = [
    ['staff', 'ops_marta', '/ops/orders'],
    ['staff', 'ops_marta', '/ops/inventory'],
    ['manager', 'ops_rina', '/ops/products'],
    ['admin', 'admin_ria', '/ops/users'],
  ]
  for (const [role, name, path] of mPages) {
    await c.seedSession(role, name)
    await c.navigate(`${BASE}${path}`)
    // wait for the page's own data (not chrome that renders while loading)
    const markerText =
      path === '/ops/orders' ? 'WB-1042' :
      path === '/ops/inventory' ? 'Sony WF-C710N' :
      path === '/ops/products' ? 'New product' :
      '128 users'
    await c.waitUntil(`document.body.textContent.includes(${JSON.stringify(markerText)})`)
    await c.settle(400)
    const o = await c.overflow(`${role}-${path.replace(/\//g, '')}-390`)
    check(`${role} ${path} @390px no horizontal scroll`, !o.hasOverflow, `sw=${o.sw} iw=${o.iw} (px over=${o.overflowPx})`)
  }
  await c.shot('staff-orders-390')
  await c.shot('admin-users-390')

  // mobile ops drawer (the <768px topbar hamburger) opens the sidebar
  await c.seedSession('staff', 'ops_marta')
  await c.navigate(`${BASE}/ops/orders`)
  await c.waitFor('.ops-tabs')
  await c.evalJs(`document.querySelector('.ops-topbar button[aria-controls="ops-sidebar"]').click()`)
  await c.settle(400)
  const drawer = await c.evalJs(`({
    open: document.querySelector('.ops-sidebar').classList.contains('open'),
    items: document.querySelectorAll('.ops-nav-item').length,
  })`)
  check('390px: ops drawer opens via topbar toggle', drawer.open && drawer.items > 0, JSON.stringify(drawer))

  // ---- console errors (0 expected across all of the above) ----
  const errs = c.consoleErrors()
  check('0 console errors / uncaught exceptions across the P5 run', errs.length === 0, errs.slice(0, 5).map((e) => e.text).join(' | ') || 'none')

  writeFileSync(`${OUT}/report.json`, JSON.stringify({ PASS, FAIL, report: REPORT, consoleErrors: errs }, null, 2))
  console.log(`\nP5 VERIFY: ${PASS} passed, ${FAIL} failed (${OUT}/report.json)`)
  chrome.kill()
  process.exit(FAIL ? 1 : 0)
}

main().catch((e) => {
  console.error('harness error:', e)
  chrome.kill()
  process.exit(2)
})
process.on('exit', () => chrome.kill())
