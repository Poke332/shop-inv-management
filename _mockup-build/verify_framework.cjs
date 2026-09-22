#!/usr/bin/env node
"use strict";
// verify_framework.cjs — v3-framework conformance gate (checks 1–5).
// Entry point is _mockup-build/verify_framework.sh (rebuilds out/, then execs this).
//
//   [1] framework lock: docs/design-tokens-round3.md + docs/color-tokens.md
//       byte-identical to the lock commit (default 17da448)
//   [2] no color outside the docs/color-tokens.md §1 scale (77 hex, parsed from the
//       §1 table rows only — the anchor-note prose mentions the retired #F94144)
//       + #FFFFFF canvas. rgba()/rgb() are resolved to their base hex and checked
//       against the scale (alpha-tinting a scale color is sanctioned; a new hue is
//       not). hsl() is always drift.
//       Audited in: _mockup-build/out/*.html (13) + docs/<page>/design.md (13+1)
//   [3] no font-weight > 600 (framework §1: Roboto 400/500/600 only)
//   [4] spacing tokens on the 8pt grid:
//       - HTML: the seven framework spacing-token declarations (:root + @media block)
//         must equal the 17da448 framework values exactly (card-gutter 32/24,
//         card-padding 24, section-rhythm 48/40, section-label-gap 20, touch-min 44,
//         content-max 1200, page-gutter 48/24)
//       - design.md: any px literal attached to a spacing property (padding/margin/
//         gap/gutter/rhythm/pad) must be an 8pt multiple or a framework-documented
//         component value (design-tokens-round3.md §2–§3: 44 touch floor, 20
//         section-label-gap, 12 card-internal step, 4/10 badge padding, 20 button
//         padding-x, 1–2 borders). Layout widths (e.g. the v4 230px ops sidebar)
//         are not spacing and are not audited.
//   [5] every framework-referencing line deleted from a design.md since the lock
//       (concrete hex / token family / weight / px / typography language) must be
//       either still present in the file or covered by an `intended-redesign`
//       marker line in the same file — otherwise it is unexplained v3 erosion.
//
// Exit: 0 clean · 1 drift found · 2 environment / missing-input error.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const getArg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const LOCK = getArg("--lock", "356edf3");
const HEAD = getArg("--commit", "HEAD");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_mockup-build", "out");

function sh(cmd) { return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim(); }

const REQUIRED_PAGES = [
  "login", "register", "main-store", "search-browse", "product-details",
  "cart", "checkout", "orders-placed", "inventory-dashboard",
  "per-product-dashboard", "per-product-review-panel", "ongoing-orders",
  "user-dashboard",
];
const OPTIONAL_PAGES = ["control-panel"]; // v4-added app-shell spec: scanned if present, never required
const FRAMEWORK_FILES = ["docs/design-tokens-round3.md", "docs/color-tokens.md"];

// A deleted line is "framework-referencing" only when it carries concrete framework
// substance: a scale hex, a token family name, or weight/px/typography values.
const FRAME_RE = /#([0-9A-Fa-f]{6})\b|strawberryRed|atomicTangerine|carrotOrange|tuscanSun|willowGreen|seagrass|blueSlate|font-weight|Roboto\b|8pt|8px|px\b|\bw\d{3}\b|letter-spacing|border-radius|min-height|44px|400\/500\/600/;

// framework §2–§3 sanctioned off-grid component px values
const EXEMPT_PX = new Set([0, 1, 2, 4, 10, 12, 14, 20, 44]);
// design.md: px literal immediately describing a spacing property (not a layout width)
const MD_SPACING_RE = /\b(padding|margin|gap|gutter|rhythm|page-pad|section-label-gap|sidebar-gap|touch)[^\d]{0,40}(\d+(?:\.\d+)?)\s*px\b/g;

function main() {
  let fails = 0;
  const fail = (m) => { fails++; console.log("FAIL  " + m); };
  const pass = (m) => console.log("PASS  " + m);

  let lockTree;
  try { sh(`git rev-parse ${LOCK}^{tree}`); lockTree = true; }
  catch (e) { console.log("ERROR cannot resolve lock " + LOCK + ": " + e.message.trim()); process.exit(2); }

  // ---------- [1] framework lock: byte-identical ----------
  for (const f of FRAMEWORK_FILES) {
    try {
      const d = sh(`git diff --no-color --stat ${LOCK} ${HEAD} -- ${f}`);
      if (d === "") pass(`[1] ${f} byte-identical to lock ${LOCK.slice(0, 7)}`);
      else fail(`[1] ${f} diverges from lock ${LOCK.slice(0, 7)} (framework lock broken):\n${d}`);
    } catch (e) { fail(`[1] ${f}: diff error: ${e.message.trim().split("\n")[0]}`); }
  }

  // ---------- permitted color set: §1 scale table rows ONLY (77) + canvas ----------
  let scale;
  try {
    const doc = fs.readFileSync(path.join(ROOT, "docs", "color-tokens.md"), "utf8");
    const tableRows = doc.split("\n").filter(l => /^\| `/.test(l));
    scale = new Set();
    for (const row of tableRows) for (const m of row.matchAll(/#[0-9A-Fa-f]{6}\b/g)) scale.add(m[0].toUpperCase());
    scale.add("#FFFFFF"); // declared neutral canvas (color-tokens §2)
  } catch (e) { console.log("ERROR cannot parse docs/color-tokens.md §1: " + e.message); process.exit(2); }
  if (scale.size - 1 !== 77) fail(`[2] color-tokens §1 table parsed ${scale.size - 1} scale hex, expected 77 — table format changed?`);
  else console.log(`      color scale parsed: 77 scale hex + #FFFFFF canvas (${scale.size} total)`);
  const allowed = scale;

  // ---------- required inputs ----------
  const htmlFiles = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter(f => f.endsWith(".html")) : [];
  const missingHtml = REQUIRED_PAGES.filter(p => !htmlFiles.includes(p + ".html"));
  const mdFiles = [];
  for (const p of [...REQUIRED_PAGES, ...OPTIONAL_PAGES]) {
    const f = path.join(ROOT, "docs", p, "design.md");
    if (fs.existsSync(f)) mdFiles.push(f);
  }
  const missingMd = REQUIRED_PAGES.filter(p => !mdFiles.includes(path.join(ROOT, "docs", p, "design.md")));
  if (missingHtml.length || missingMd.length)
    fail(`inputs missing${missingHtml.length ? " — out/: " + missingHtml.map(p => p + ".html").join(", ") : ""}${missingMd.length ? " — docs/: " + missingMd.join(", ") : ""}`);

  // ---------- [2] hex / [3] weight / [4] spacing scanners ----------
  const groups = { hx: new Map(), fw: new Map(), sp: new Map() };
  const add = (g, file, line, what) => {
    const key = file + "\u0000" + what;
    if (!groups[g].has(key)) groups[g].set(key, { file, what, lines: [], count: 0 });
    const e = groups[g].get(key);
    e.count++;
    if (e.lines.length < 5) e.lines.push(line);
  };
  const hexOf = (r, g, b) => "#" + [r, g, b].map(v => Number(v).toString(16).padStart(2, "0")).join("").toUpperCase();

  const audit = (file, rel) => {
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      // [2] hex literals (6- and 3-digit)
      for (const m of line.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])|#[0-9A-Fa-f]{3}(?![0-9A-Fa-f])/g)) {
        let h = m[0];
        if (h.length === 4) h = "#" + h.slice(1).split("").map(c => c + c).join("");
        if (!allowed.has(h.toUpperCase())) add("hx", rel, i + 1, "out-of-scale hex " + h.toUpperCase());
      }
      // [2] rgba()/rgb(): resolve the base triple to a scale hex; alpha is sanctioned
      for (const m of line.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
        const h = hexOf(m[1], m[2], m[3]);
        if (!allowed.has(h)) add("hx", rel, i + 1, `rgba base ${m[1]},${m[2]},${m[3]} (= ${h}) not in scale`);
      }
      if (/\bhsla?\s*\(/.test(line)) add("hx", rel, i + 1, "hsl() color — outside the hex-token system");
      // [3] font-weight
      for (const m of line.matchAll(/\bfont-weight\s*:\s*(\d+|[a-z]+)\b/g)) {
        const w = m[1] === "bold" ? 700 : m[1] === "bolder" ? 900 : Number(m[1]);
        if (Number.isFinite(w) && w > 600) add("fw", rel, i + 1, `font-weight ${m[1]} (max 600)`);
      }
      for (const m of line.matchAll(/\bfont\s*:\s*(\d{3})\s/g))
        if (Number(m[1]) > 600) add("fw", rel, i + 1, `font shorthand weight ${m[1]} (max 600)`);
      // [4] design.md only: px literals on spacing properties
      if (rel.endsWith(".md")) for (const m of line.matchAll(MD_SPACING_RE)) {
        const n = Number(m[2]);
        if (n % 8 === 0 || EXEMPT_PX.has(n)) continue;
        add("sp", rel, i + 1, `${m[1]} ${m[2]}px — off 8pt grid and not framework-exempt`);
      }
    });
  };
  for (const f of htmlFiles) audit(path.join(OUT, f), "_mockup-build/out/" + f);
  for (const f of mdFiles) audit(f, path.relative(ROOT, f));

  // [4] HTML spacing-token declarations vs the 17da448 framework values
  try {
    const fwDoc = sh(`git show ${LOCK}:docs/design-tokens-round3.md`);
    const TOKENS = ["card-gutter", "card-padding", "section-rhythm", "section-label-gap", "touch-min", "content-max", "page-gutter"];
    const decls = (text) => { // {token: Set(values)} across :root + @media
      const m = {};
      for (const t of TOKENS) m[t] = new Set(text.matchAll(new RegExp("--" + t + ":\\s*([^;}\n]+)", "g")).map(x => x[1].trim()));
      return m;
    };
    const want = decls(fwDoc);
    for (const f of htmlFiles) {
      const got = decls(fs.readFileSync(path.join(OUT, f), "utf8"));
      for (const t of TOKENS) {
        if (got[t].size === 0) { add("sp", "_mockup-build/out/" + f, 0, `spacing token --${t} not declared`); continue; }
        for (const v of got[t]) if (!want[t].has(v)) add("sp", "_mockup-build/out/" + f, 0, `--${t}: ${v} differs from framework (${[...want[t]].join(" / ")})`);
      }
    }
  } catch (e) { fail(`[4] cannot read framework spacing tokens: ${e.message.trim().split("\n")[0]}`); }

  const section = (n, g, note) => {
    const es = [...groups[g].values()].sort((a, b) => a.file.localeCompare(b.file) || a.lines[0] - b.lines[0]);
    if (es.length) { fails++; console.log(`FAIL  [${n}]${note}\n${es.map(e => `      ${e.file}${e.lines[0] ? ":" + e.lines.join(", ") : ""}  ${e.what}${e.count > 1 ? `  (×${e.count})` : ""}`).join("\n")}`); }
    else console.log(`PASS  [${n}]${note}`);
  };
  section("2", "hx", " color conformance — 77-value scale + #FFFFFF canvas");
  section("3", "fw", " font-weight ≤ 600");
  section("4", "sp", " spacing conformance — framework token values + 8pt grid (exempt px: " + [...EXEMPT_PX].sort((a, b) => a - b).join("/") + ")");

  // ---------- [5] deleted framework lines in design.md ----------
  let deleted;
  try { deleted = parseDeleted(sh(`git diff -U0 --no-color ${LOCK} ${HEAD} -- 'docs/*/design.md'`)); }
  catch (e) { console.log("ERROR git diff for check 5: " + e.message.trim().split("\n")[0]); process.exit(2); }

  const unexplained = [];
  for (const d of deleted) {
    if (!FRAME_RE.test(d.text)) continue; // not framework substance (plain page content)
    const cur = fs.readFileSync(d.file, "utf8").split("\n");
    if (cur.some(l => l.trim() === d.text.trim())) continue;        // survived elsewhere in the file
    if (cur.some(l => l.includes("intended-redesign"))) continue;   // documented intended redesign
    unexplained.push(d);
  }
  const frameworkDeletions = deleted.filter(d => FRAME_RE.test(d.text));
  if (unexplained.length) {
    fails++;
    console.log(`FAIL  [5] ${unexplained.length} framework-referencing line(s) deleted from design.md since ${LOCK.slice(0, 7)} with no 'intended-redesign' marker in the file:\n` +
      unexplained.map(d => `      ${path.relative(ROOT, d.file)}:  ${d.text.slice(0, 90)}`).join("\n") +
      `\n      fix: reconcile the content back, or add an "intended-redesign: <reason>" line to the same design.md.`);
  } else {
    pass(`[5] design.md deletion audit — ${frameworkDeletions.length} framework-referencing line(s) deleted since lock; all kept-or-intended-redesign`);
  }

  // ---------- summary ----------
  const groupsFound = groups.hx.size + groups.fw.size + groups.sp.size;
  console.log(fails
    ? `\nverify_framework: FAIL — ${fails} check group(s) with findings (${groupsFound} scanner finding group(s)${unexplained.length ? " + " + unexplained.length + " deletion(s)" : ""}); fix and re-run`
    : `\nverify_framework: CLEAN — lock ${LOCK.slice(0, 7)} holds; 13/13 pages conform (scale hex, weight ≤ 600, spacing tokens + 8pt grid, deletion audit)`);
  process.exit(fails ? 1 : 0);
}

// Parse unified-diff deleted lines for 'docs/*/design.md' into [{file, text}]
function parseDeleted(diff) {
  const out = [];
  let cur = null;
  for (const line of diff.split("\n")) {
    const gf = line.match(/^diff --git a\/(\S+)/);
    if (gf) {
      cur = gf[1];
      continue;
    }
    if (cur && /^docs\/[\w-]+\/design\.md$/.test(cur)) {
      const rm = line.match(/^-(?!-)(.*)$/);
      if (rm) out.push({ file: path.join(ROOT, cur), text: rm[1] });
    }
  }
  return out;
}

main();
