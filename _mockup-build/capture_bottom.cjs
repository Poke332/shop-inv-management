// CDP capture of the BELOW-THE-FOLD region of main-store.html.
// Reuses the dep-free CDP client pattern from verify.cjs.
//
// The page renders at a 1312x736 viewport (same as render.py / the existing
// mockup.png, which only shows the header + hero banner). This script lays out
// the FULL document and captures the BOTTOM 736px slice -> mockup-bottom.png
// (the category rail + product grid + load-more region the top shot misses).
//
// Writes _mockup-build/out/main-store-bottom.png AND docs/main-store/mockup-bottom.png.
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const ROOT = process.env.PWD || "/home/richie/projects/web-mobile-project";
const OUT = ROOT + "/_mockup-build/out";
const CHROME = "/snap/bin/chromium";
const W = 1312;         // same viewport width as render.py / mockup.png
const SLICE = 736;     // capture one viewport-tall slice from the bottom

async function getJSON(url) { return (await fetch(url)).json(); }

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
    shot(params = {}) { return this.send("Page.captureScreenshot", params); },
  };
}

(async () => {
  const srv = http.createServer((req, res) => {
    fs.readFile(OUT + req.url.replace(/^\/\?/, ""), (e, d) => { if (e) { res.writeHead(404); return res.end("nf"); } res.end(d); });
  });
  await new Promise((r) => srv.listen(8179, r));

  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu",
    "--disable-dev-shm-usage", "--remote-debugging-port=9335", "about:blank"], { stdio: "ignore" });
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try { target = (await getJSON("http://127.0.0.1:9335/json/list")).find((t) => t.type === "page"); } catch (e) {}
  }
  if (!target) throw new Error("no CDP target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const c = makeClient(ws);
  await c.send("Page.enable"); await c.send("Runtime.enable");

  // Normal 736-tall viewport (identical layout to the top mockup.png).
  await c.send("Emulation.setDeviceMetricsOverride", { width: W, height: SLICE, deviceScaleFactor: 1, mobile: false });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8179/main-store.html" });
  await new Promise((r) => setTimeout(r, 1000));

  // Region = everything BELOW the banner: from the hero's bottom edge to the end of content.
  // (The top mockup.png already shows header + the full-bleed hero, so this is the rest.)
  const H = await c.eval("document.documentElement.scrollHeight");
  const heroBottom = await c.eval("(function(){var h=document.querySelector('.hero');return h?Math.round(h.getBoundingClientRect().bottom):0;})()");
  const y = heroBottom;
  const h = Math.max(1, H - y);
  console.log("contentH=" + H + "  heroBottom=" + heroBottom + "  -> capturing y=" + y + " h=" + h);

  const png = await c.shot({ format: "png", captureBeyondViewport: true, clip: { x: 0, y, width: W, height: h, scale: 1 } });
  const buf = Buffer.from(png.data, "base64");
  fs.writeFileSync(OUT + "/main-store-bottom.png", buf);
  fs.writeFileSync(ROOT + "/docs/main-store/mockup-bottom.png", buf);
  console.log("-> out/main-store-bottom.png + docs/main-store/mockup-bottom.png (" + buf.length + " bytes)");

  ws.close(); chrome.kill(); srv.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
