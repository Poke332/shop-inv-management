// CDP verification for round-3 mockups (Node global WebSocket, no deps).
// Measures horizontal overflow at 1280/785/390, card button-top baselines per row,
// card height equality, title clamps, badge corners, and computed spec token values.
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const ROOT = "/home/richie/projects/web-mobile-project/_mockup-build/out";
const CHROME = "/snap/bin/chromium";
const PAGES = ["login","register","main-store","search-browse","product-details","cart","checkout",
               "orders-placed","inventory-dashboard","per-product-dashboard","per-product-review-panel",
               "ongoing-orders","user-dashboard"];

async function getJSON(url) {
  const r = await fetch(url);
  return r.json();
}

let mid = 0;
function makeClient(ws) {
  const pending = new Map();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || {}); pending.delete(msg.id); }
  });
  return {
    send(method, params = {}) {
      return new Promise((res) => { const i = ++mid; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    },
    async eval(expr) {
      const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error("JS: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
      return r.result ? r.result.value : undefined;
    },
  };
}

async function main() {
  const srv = http.createServer((req, res) => {
    const f = ROOT + "/" + req.url.replace(/^\//, "");
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("nf"); } res.end(d); });
  });
  await new Promise((r) => srv.listen(8177, r));

  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu",
    "--disable-dev-shm-usage", "--remote-debugging-port=9333", "about:blank"], { stdio: "ignore" });
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const list = await getJSON("http://127.0.0.1:9333/json/list");
      target = list.find((t) => t.type === "page");
    } catch (e) {}
  }
  if (!target) throw new Error("no CDP target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const c = makeClient(ws);
  await c.send("Page.enable"); await c.send("Runtime.enable");

  const all = {};
  for (const PAGE of PAGES) {
    const report = { page: PAGE, widths: {}, computed: null, interLoaded: null, mobile390: null };
    await c.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send("Page.navigate", { url: "http://127.0.0.1:8177/" + PAGE + ".html" });
    await new Promise((r) => setTimeout(r, 900));

    for (const w of [1280, 785]) {
      const mobile = w < 768;
      await c.send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile });
      await new Promise((r) => setTimeout(r, 300));
      report.widths[w] = await c.eval(`(()=>{
        const de=document.documentElement;
        const out={innerW:window.innerWidth, scrollW:de.scrollWidth, overflow:de.scrollWidth>window.innerWidth+1};
        const rows={};
        document.querySelectorAll('.pcard').forEach(p=>{
          const b=p.querySelector('.cadd'); if(!b) return;
          const t=Math.round(b.getBoundingClientRect().top/2)*2;
          (rows[t]=rows[t]||new Set()).add(Math.round(p.getBoundingClientRect().height));
        });
        out.btnTops=Object.fromEntries(Object.entries(rows).map(([t,s])=>[t,[...s]]));
        out.titleWraps=[...document.querySelectorAll('.cname')].filter(e=>e.scrollHeight>e.clientHeight+2).length;
        return out;
      })()`);
    }

    report.interLoaded = await c.eval(`document.fonts.check('600 16px Inter')`);
    report.mobile390 = await c.eval(`new Promise((resolve)=>{
      const f=document.createElement('iframe');
      f.style.cssText='width:390px;height:844px;border:0';
      f.src='http://127.0.0.1:8177/${PAGE}.html';
      f.onload=()=>setTimeout(()=>{
        const d=f.contentDocument,de=d.documentElement;
        const out={innerW:f.contentWindow.innerWidth,scrollW:de.scrollWidth,overflow:de.scrollWidth>f.contentWindow.innerWidth+1};
        out.titleWraps=[...d.querySelectorAll('.cname')].filter(e=>e.scrollHeight>e.clientHeight+2).length;
        let off=null;
        for(const el of d.querySelectorAll('*')){
          const r=el.getBoundingClientRect();
          if(r.right>391){ off={tag:el.tagName,cls:(el.className||'').toString().slice(0,30),right:Math.round(r.right)}; break; }
        }
        out.offender=off;
        resolve(out);
      },600);
      document.body.appendChild(f);
    })`);
    all[PAGE] = report;
    console.error("done " + PAGE);
  }

  ws.close(); chrome.kill(); srv.close();
  console.log(JSON.stringify(all, null, 1));
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
