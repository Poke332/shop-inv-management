# Sunset Glow token CSS (exact hexes from docs/color-tokens.md — 77 scale values + white canvas)
# Round-3: implements docs/design-tokens-round3.md — Roboto 400/500/600, 8pt spacing, pill badges,
# filled 44px CTAs, gradient product tiles, 1-line-clamped card titles.
TOK = {
 "sr": ["#FEE6E7","#FDCECE","#FC9C9E","#FA6B6D","#F9393C","#F7080C","#C60609","#940507","#630305","#310202","#230102"],
 "at": ["#FEEFE7","#FCDFCF","#F9BE9F","#F79E6E","#F47E3E","#F15D0E","#C14B0B","#913808","#602506","#301303","#220D02"],
 "co": ["#FEF3E6","#FDE8CE","#FCD19C","#FABA6B","#F9A339","#F78B08","#C67006","#945405","#633803","#311C02","#231401"],
 "ts": ["#FEF7E6","#FDEFCE","#FBDF9D","#FACF6B","#F8BF3A","#F6AF09","#C58C07","#946905","#624604","#312302","#221801"],
 "wg": ["#F2F7ED","#E4EFDC","#C9DFB9","#AFD095","#94C072","#79B04F","#618D3F","#496A2F","#304620","#182310","#11190B"],
 "sg": ["#EDF8F4","#DBF0EA","#B6E2D5","#92D3C0","#6DC5AB","#49B695","#3A9278","#2C6D5A","#1D493C","#0F241E","#0A1A15"],
 "bs": ["#EFF2F5","#DFE6EC","#BFCDD9","#9FB4C6","#809BB3","#60829F","#4D6880","#394E60","#263440","#131A20","#0D1216"],
}
STEPS = ["50","100","200","300","400","500","600","700","800","900","950"]

def css_vars():
    out = []
    for name, vals in TOK.items():
        for step, hexv in zip(STEPS, vals):
            out.append(f"  --{name}-{step}: {hexv};")
    return "\n".join(out)

# Category -> gradient stops (spec §3.3): 135deg, 50-step -> 400-step, glyph blueSlate-900 on all.
TILE_GRADS = {
 "audio":   "linear-gradient(135deg,var(--ts-50),var(--ts-400))",
 "smart":   "linear-gradient(135deg,var(--sg-50),var(--sg-400))",
 "gaming":  "linear-gradient(135deg,var(--at-50),var(--at-400))",
 "laptops": "linear-gradient(135deg,var(--bs-50),var(--bs-400))",
 "acc":     "linear-gradient(135deg,var(--co-50),var(--co-400))",
 "wear":    "linear-gradient(135deg,var(--sr-50),var(--sr-400))",
 "unmapped":"linear-gradient(135deg,var(--bs-50),var(--bs-400))",
}

BASE_CSS = """
:root{
/*__VARS__*/
  --canvas:#FFFFFF;
  /* Roboto (400/500/600 only) + system fallback */
  --font-sans:"Roboto","system-ui","-apple-system","Segoe UI","sans-serif";
  /* type scale (§1) */
  --text-h1:26px; --lh-h1:36px;
  --text-section:16px; --lh-section:24px; --track-section:.05em;
  --text-card:15px; --lh-card:24px;
  --text-body:14px; --lh-body:20px;
  --text-price:14px; --lh-price:20px;
  --text-meta:13px; --lh-meta:20px;
  --text-badge:12px; --lh-badge:16px;
  /* spacing (§2) */
  --card-gutter:32px; --card-padding:24px;
  --section-rhythm:48px; --section-label-gap:20px;
  --touch-min:44px; --content-max:1200px; --page-gutter:48px;
  /* badge pills (§3.1) */
  --radius-pill:999px; --badge-pad-x:10px; --badge-pad-y:4px;
}
@media (max-width:767px){
  :root{ --card-gutter:24px; --section-rhythm:40px; --page-gutter:24px; }
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ transition:none!important; animation:none!important; }
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:var(--font-sans);background:var(--canvas);color:var(--bs-950);
font-size:var(--text-body);line-height:var(--lh-body);font-weight:500;-webkit-font-smoothing:antialiased;overflow:hidden}
a{color:var(--at-600);text-decoration:none}
a:hover{ text-decoration:underline; }
/* focus (§7.1) */
button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--at-500);outline-offset:2px}
/* ---- type ---- */
.h1{font-size:var(--text-h1);line-height:var(--lh-h1);font-weight:600;color:var(--bs-950)}
.sec-label{font-size:var(--text-section);line-height:var(--lh-section);font-weight:600;
letter-spacing:var(--track-section);color:var(--bs-950)}
.meta{font-size:var(--text-meta);line-height:var(--lh-meta);font-weight:400;color:var(--bs-700)}
/* ---- storefront header ---- */
.shead{height:56px;display:flex;align-items:center;gap:16px;padding:0 24px;border-bottom:1px solid var(--bs-200);background:#fff}
.logo{font-weight:600;font-size:17px;color:var(--bs-950);white-space:nowrap}
.logo span{color:var(--at-500)}
.searchbox{flex:1;max-width:520px;min-width:0;display:flex;align-items:center;gap:8px;border:1px solid var(--bs-200);border-radius:999px;padding:0 14px;min-height:44px;background:#fff}
.searchbox .ph{color:var(--bs-500);font-size:14px;font-weight:400}
.hactions{display:flex;align-items:center;gap:8px;margin-left:auto}
/* §8 mobile header: logo left, cart+account right, search drops to its own line */
@media (max-width:767px){
  .shead{flex-wrap:wrap;height:auto;padding:8px 16px;gap:8px}
  .searchbox{order:3;flex-basis:100%;max-width:none}
  .hactions{margin-left:auto}
}
.hicon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;color:var(--bs-950);position:relative;cursor:pointer}
.hicon .badge{position:absolute;top:2px;right:0;background:var(--at-500);color:#fff;border-radius:var(--radius-pill);
font-size:12px;font-weight:600;padding:2px 6px;line-height:16px} /* TBD: per open decision #3 (cart color accents) */
/* ---- buttons (§3.2) ---- */
.btn-p{display:inline-flex;align-items:center;justify-content:center;min-height:var(--touch-min);min-width:var(--touch-min);
padding:0 20px;border-radius:8px;border:0;cursor:pointer;background:var(--at-600);color:#fff;
font-family:var(--font-sans);font-size:14px;line-height:20px;font-weight:500;transition:background-color 150ms ease}
.btn-p:hover{background:var(--at-700)}
.btn-p:active{background:var(--at-800)}
.btn-p:disabled,.btn-p[aria-disabled=true]{background:var(--bs-100);color:var(--bs-400);cursor:not-allowed}
.btn-p.full{width:100%;display:inline-flex}
.btn-sec{display:inline-flex;align-items:center;justify-content:center;min-height:var(--touch-min);min-width:var(--touch-min);
padding:0 20px;border-radius:8px;cursor:pointer;background:#fff;border:1px solid var(--bs-200);color:var(--bs-950);
font-family:var(--font-sans);font-size:14px;line-height:20px;font-weight:500;transition:background-color 150ms ease}
.btn-sec:hover{background:var(--bs-100)}
.btn-del{display:inline-flex;align-items:center;justify-content:center;min-height:var(--touch-min);min-width:var(--touch-min);
padding:0 20px;border-radius:8px;border:0;cursor:pointer;background:var(--sr-600);color:#fff;
font-family:var(--font-sans);font-size:14px;line-height:20px;font-weight:500;transition:background-color 150ms ease}
.btn-del:hover{background:var(--sr-700)} .btn-del:active{background:var(--sr-800)}
/* ---- badges (§3.1) ---- */
.pill{display:inline-flex;align-items:center;gap:4px;border-radius:var(--radius-pill);
padding:var(--badge-pad-y) var(--badge-pad-x);font-size:12px;line-height:16px;font-weight:600;
letter-spacing:.02em;color:var(--bs-900);white-space:nowrap;background:var(--bs-100)}
.pill-pending{background:var(--ts-100)} .pill-processing{background:var(--sg-100)}
.pill-shipped{background:var(--bs-100)} .pill-delivered{background:var(--wg-100)}
.pill-in{background:var(--wg-100)} .pill-low{background:var(--co-100)} .pill-out{background:var(--sr-100)}
.pill-active{background:var(--wg-100)} .pill-disabled{background:var(--sr-100)}
/* round 6 review state pills (docs/per-product-review-panel/design.md): reuse existing scale
   tokens, no new colors. Public = willowGreen-100/700; Hidden = strawberryRed-100/700 (soft). */
.pill-rv-public{background:var(--wg-100);color:var(--wg-700)}
.pill-rv-hidden{background:var(--sr-100);color:var(--sr-700)}
/* card badge pills (on tiles; §3.1 fills + borders) */
.tb{position:absolute;display:inline-flex;align-items:center;gap:4px;border-radius:var(--radius-pill);
padding:var(--badge-pad-y) var(--badge-pad-x);font-size:12px;line-height:16px;font-weight:600;letter-spacing:.02em;
white-space:nowrap;background:#fff;box-shadow:none}
.tb-sale{background:var(--sr-600);color:#fff}
.tb-feat{background:var(--ts-500);color:var(--bs-950);border:1px solid var(--ts-600)}
.tb-low{background:var(--co-500);color:var(--bs-950);border:1px solid var(--co-600)}
.tb-oos{background:var(--sr-100);color:var(--sr-700)}
/* ---- status / chips ---- */
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:16px;font-weight:600;letter-spacing:.02em;
border-radius:var(--radius-pill);padding:4px 10px;color:var(--bs-900);white-space:nowrap}
.chip-pending{background:var(--ts-100)} .chip-processing{background:var(--sg-100)}
.chip-shipped{background:var(--bs-100)} .chip-delivered{background:var(--wg-100)}
.stars{color:var(--ts-500);letter-spacing:2px;font-size:15px;line-height:20px} /* TBD: per open decision (rating colors) */
.stars .off{color:var(--ts-200)}
/* ---- product visuals (§3.3) ---- */
.ptile{position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;display:grid;place-items:center}
.ptile svg{width:40px;height:40px;stroke:1.5;color:var(--bs-900)}
.pimg{display:inline-grid;place-items:center;border-radius:8px;overflow:hidden}
.pimg svg{color:var(--bs-900)}
/* ---- generic ---- */
.price{color:var(--at-600);font-weight:600;font-size:var(--text-price);line-height:var(--lh-price)}
.strike{color:var(--bs-600);text-decoration:line-through;font-weight:400;font-size:var(--text-meta);line-height:var(--lh-price)}
.btn-loadmore{width:320px}
@media (max-width:767px){ .btn-loadmore{width:100%} }
.loadmore-note{font-size:13px;line-height:20px;font-weight:400;color:var(--bs-700);text-align:center}
.grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--card-gutter)}
.grid4 .pcard{min-width:0}
/* §8: <390px → 1 col; 390–767px → 2 cols; 768–1023px → 3 cols; ≥1024px → 4 cols */
@media (max-width:1023px){ .grid4{grid-template-columns:repeat(3,minmax(0,1fr))} }
@media (max-width:767px){ .grid4{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width:389px){ .grid4{grid-template-columns:1fr} }
.card{background:#fff;border:1px solid var(--bs-200);border-radius:12px}
.input{border:1px solid var(--bs-200);border-radius:8px;padding:9px 12px;min-height:44px;font-size:14px;color:var(--bs-950);background:#fff;font-family:inherit}
.input.wfull{width:100%}
.input::placeholder{color:var(--bs-500)}
.label{font-size:13px;font-weight:600;color:var(--bs-950)}
.muted{color:var(--bs-700);font-size:13px}
.link{color:var(--at-600);font-size:13px}
.step-num{width:26px;height:26px;border-radius:50%;background:var(--at-600);color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none}
.qty{display:inline-flex;align-items:center;border:1px solid var(--bs-200);border-radius:8px;overflow:hidden}
.qty span{min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-weight:500;font-size:14px;background:#fff;cursor:pointer}
.qty span.on{background:var(--bs-100);color:var(--bs-500)}
.qty span.val{background:#fff;color:var(--bs-950);min-width:40px;cursor:default}
input[type=range]{accent-color:var(--at-500)}
svg{flex:none}
/* ---- ops app shell (v4, docs/control-panel/design.md) ---- */
:root{
  --ops-sidebar-w:230px;
  --ops-page-pad:32px;          /* the sidebar↔content gutter (reset-proof class padding) */
  --ops-page-pad-mobile:24px;
}
@media (max-width:767px){ :root{ --ops-page-pad:var(--ops-page-pad-mobile); } }
.ops-shell{display:flex;min-height:100dvh}
.ops-sidebar{width:var(--ops-sidebar-w);background:var(--bs-900);color:var(--bs-50);padding:20px 14px;
display:flex;flex-direction:column;gap:4px;flex:none;overflow-y:auto}
/* v4 gutter: class padding beats the *{padding:0} reset (specificity 0,1,0) */
.ops-content{flex:1;min-width:0;padding:var(--ops-page-pad);overflow:auto}
/* internal to multi-column pages (list|editor split); the shell gutter stays .ops-content's padding */
.ops-page{display:flex;gap:24px;flex:1;min-height:0;overflow-x:auto}
@media (max-width:767px){ /* mobile: sidebar off-canvas drawer, closed by default */
  .ops-sidebar{position:fixed;top:0;bottom:0;left:0;transform:translateX(-100%);z-index:50}
  .ops-sidebar.open{transform:none}
  .ops-page{gap:0;flex-wrap:wrap}
}
.ops-sidebar .os-title{font-size:12px;font-weight:600;letter-spacing:.1em;color:var(--bs-50);margin:0 8px 12px}
.ops-sidebar .os-title b{color:var(--ts-400);font-weight:600}
.onav{display:flex;align-items:center;gap:8px;padding:0 10px;min-height:44px;border-radius:8px;font-size:14px;font-weight:500;color:var(--bs-50);border-left:3px solid transparent;cursor:pointer}
.onav.active{background:var(--bs-800);border-left-color:var(--at-500);font-weight:600}
.onav .nbadge{margin-left:auto;background:var(--sr-600);color:#fff;border-radius:var(--radius-pill);font-size:12px;line-height:16px;font-weight:600;padding:2px 7px}
.foot{font-size:12px;color:var(--bs-500);margin:12px 8px 0;line-height:1.5}
/* ---- timeline ---- */
.timeline{display:flex;align-items:center;gap:0}
.tl-step{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:var(--bs-700)}
.tl-dot{width:14px;height:14px;border-radius:50%;flex:none}
.tl-step.done .tl-dot{background:var(--wg-500);color:#fff}
.tl-step.cur .tl-dot{background:var(--at-500)}
.tl-step.up .tl-dot{background:var(--bs-200)}
.tl-step.done{color:var(--bs-900)} .tl-step.cur{color:var(--bs-950);font-weight:600}
.tl-line{width:44px;height:2px;background:var(--bs-200);margin:0 6px;flex:none}
.tl-line.done{background:var(--wg-500)}
/* switch */
.switch{width:44px;height:44px;border-radius:999px;display:grid;place-items:center;background:transparent;flex:none;cursor:pointer}
.switch .track{width:40px;height:24px;border-radius:999px;background:var(--wg-500);position:relative}
.switch .track::after{content:'';position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;right:2px}
.switch.off .track{background:var(--bs-200)}
.switch.off .track::after{right:auto;left:2px}
"""

HEAD_LINKS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
              '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
              '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap" rel="stylesheet">\n')

ICONS = {
"search":'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bs-500)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
"cart":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h2l2.4 12.2a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L21 8H8.4"/><circle cx="10" cy="20.5" r="1.4" fill="currentColor"/><circle cx="18" cy="20.5" r="1.4" fill="currentColor"/></svg>',
"user":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.6-3.4 4.6-5 8-5s6.4 1.6 8 5"/></svg>',
"trash":'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
"plus":'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
# glyph paths (24x24, drawn for 40px @ stroke 1.5, color set by .ptile/.pimg CSS)
"earbuds":'<path d="M3 14a9 9 0 0 1 18 0"/><rect x="3" y="13" width="4" height="7" rx="1.6"/><rect x="17" y="13" width="4" height="7" rx="1.6"/>',
"powerbank":'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 8l-2.5 4.5H12L10.5 17"/>',
"keyboard":'<rect x="2.5" y="7" width="19" height="11" rx="2"/><path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M6 14.5h.01M10 14.5h4M18 14.5h.01"/>',
"gamepad":'<path d="M7 8h10a5 5 0 0 1 5 5l-.7 3.4a2.6 2.6 0 0 1-4.7.7L15.5 15h-7L7.4 17.1a2.6 2.6 0 0 1-4.7-.7L2 13a5 5 0 0 1 5-5Z"/><path d="M7.5 11v3M6 12.5h3"/><circle cx="16" cy="11.8" r=".9"/><circle cx="18" cy="13.6" r=".9"/>',
"watch":'<circle cx="12" cy="12" r="5.5"/><path d="M12 9.5V12l2 1.5M9.5 6.5 9 3h6l.5 3.5M9.5 17.5 9 21h6l.5-3.5"/>',
"router":'<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 17h.01M10 17h.01M17 14V8M17 8l-3-3M17 8l3-3"/>',
"speaker":'<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14" r="3.2"/><circle cx="12" cy="7" r="1"/>',
"laptop":'<rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20"/>',
}

def glyph(icon, size=40, sw=1.5):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{ICONS[icon]}</svg>')

def page(body_html, extra_css="", title=""):
    css = BASE_CSS.replace("/*__VARS__*/", css_vars())
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>{title}</title>
{HEAD_LINKS}<style>{css}\n{extra_css}</style></head>
<body>{body_html}</body></html>
"""

def shead(cart_n, search_ph="Search products, brands, categories…"):
    badge = f'<span class="badge"><!-- TBD: per open decision #3 -->{cart_n}</span>' if cart_n != "" else ""
    return f'''<div class="shead"><div class="logo">Sunset&nbsp;<span>Electronics</span></div>
<div class="searchbox">{ICONS["search"]}<span class="ph">{search_ph}</span></div>
<div class="hactions"><div class="hicon" role="img" aria-label="Cart">{ICONS["cart"]}{badge}</div>
<div class="hicon" role="img" aria-label="Account">{ICONS["user"]}</div></div></div>'''

def onav(items, active, badges=()):
    out = []
    for it in items:
        badge = ""
        if it in badges:
            badge = f'<span class="nbadge">{badges[it]}</span>'
        cls = "onav active" if it == active else "onav"
        out.append(f'<div class="{cls}">{it}{badge}</div>')
    foot = '<div class="foot">Nav items are role-gated (RBAC matrix, Sheets-report.md): staff see Ongoing Orders + Inventory + Products read-only; manager/admin see all five; Users is admin-only.</div>'
    return (f'<aside class="ops-sidebar" aria-label="Ops navigation">'
            f'<div class="os-title">OPS <b>CONSOLE</b></div>' + "".join(out) + foot + '</aside>')

OPS_NAV = ["Ongoing Orders", "Inventory", "Products", "Reviews", "Users"]

def pill(cls, text):
    return f'<span class="pill {cls}">{text}</span>'

def stars(n):
    full, empty = "★" * int(n), "☆" * (5 - int(n))
    return f'<span class="stars"><!-- TBD: per open decision (star-rating colors) -->{full}<span class="off">{empty}</span></span>'

def prod_img(icon, w, h, oos=False, grad="unmapped", tile=False):
    """Product visual (spec §3.3): category gradient tile, blueSlate-900 glyph, OOS = opacity .4 + pill elsewhere."""
    op = ' style="opacity:.4"' if oos else ""
    glyph_s = 40 if min(w, h) >= 120 else 32
    cls = "ptile" if tile else "pimg"
    return (f'<div class="{cls}" style="width:{w}px;height:{h}px;background:{TILE_GRADS[grad]}"{op}>'
            f'{glyph(icon, glyph_s)}</div>')

def page_wrap(body, extra_css="", title=""):
    return page(body, extra_css, title)
