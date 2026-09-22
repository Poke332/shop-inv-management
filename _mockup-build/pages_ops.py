# Ops console pages: inventory-dashboard, per-product-dashboard, per-product-review-panel, ongoing-orders, user-dashboard
# Round-3 (docs/design-tokens-round3.md): type scale §1, 8pt spacing §2, 44px touch floor §2,
# RBAC role accents preserved §6, TBD markers kept §5.
import sys
sys.path.insert(0, ".")
from lib import *
from pages_storefront import PAGES

OPS_CSS = """
/* §7.2 ops touch floor: 44px rows via padding+min-height, compact controls via hit area */
/* shell rules (.ops-shell/.ops-sidebar/.ops-content/.ops-page) live in lib.py v4 app-shell block */
.oprow{display:flex;align-items:center;gap:16px;padding:10px 16px;min-height:64px;border-bottom:1px solid var(--bs-200)}
.oprow:last-child{border-bottom:none}
.opname{font-weight:600;color:var(--bs-950);font-size:14px;min-width:190px}
.opsub{font-size:13px;font-weight:400;color:var(--bs-700)}
.stepper{display:inline-flex;align-items:center;border:1px solid var(--bs-200);border-radius:8px;overflow:hidden}
.stepper span{min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-weight:500;font-size:14px;background:#fff;cursor:pointer}
.stepper .on{background:var(--bs-100);color:var(--bs-500)}
.stepper .val{background:#fff;color:var(--bs-950);min-width:40px;cursor:default}
.open-edit{color:var(--at-600);font-weight:500;font-size:14px}
.setstock{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;
padding:0 16px;border-radius:8px;border:none;cursor:pointer;background:var(--at-600);color:#fff;
font-family:var(--font-sans);font-size:14px;line-height:20px;font-weight:500;transition:background-color 150ms ease}
.setstock:hover{background:var(--at-700)} .setstock:active{background:var(--at-800)}
.tabs{display:flex;gap:32px;border-bottom:1px solid var(--bs-200);padding:0 4px}
.tab{font-size:14px;font-weight:500;color:var(--bs-700);padding:12px 2px;border-bottom:3px solid transparent;cursor:pointer}
.tab.active{color:var(--bs-950);font-weight:600;border-bottom-color:var(--at-500)}
.ochip{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:16px;font-weight:600;letter-spacing:.02em;
border-radius:var(--radius-pill);padding:4px 10px;color:var(--bs-900);white-space:nowrap}
.ochip-pending{background:var(--ts-100)} .ochip-processing{background:var(--sg-100)}
.ochip-shipped{background:var(--bs-100)} .ochip-delivered{background:var(--wg-100)}
/* §6 role badges — accent-100 fill + accent-700 text + 1px accent-300 border, unchanged from color-tokens §5 */
.role-pill{display:inline-flex;align-items:center;font-size:12px;line-height:16px;font-weight:600;letter-spacing:.02em;
border-radius:var(--radius-pill);padding:4px 10px;white-space:nowrap}
.role-buyer{background:var(--at-100);color:var(--at-700);border:1px solid var(--at-300)}
.role-staff{background:var(--co-100);color:var(--co-700);border:1px solid var(--co-300)}
.role-manager{background:var(--sg-100);color:var(--sg-700);border:1px solid var(--sg-300)}
.role-admin{background:var(--sr-100);color:var(--sr-700);border:1px solid var(--sr-300)}
.urow{display:flex;align-items:center;gap:16px;padding:10px 16px;min-height:64px;border-bottom:1px solid var(--bs-200)}
.urow:last-child{border-bottom:none}
.urow.dis{border-left:3px solid var(--sr-500)}
.selectbox{display:inline-flex;align-items:center;gap:8px;min-height:44px;border:1px solid var(--bs-200);border-radius:8px;
padding:0 12px;font-size:14px;font-weight:500;color:var(--bs-950);background:#fff;cursor:pointer}
.rvcard{border:1px solid var(--bs-200);border-radius:10px;padding:16px;margin-bottom:12px;background:#fff}
.rvtext{font-size:14px;font-weight:500;color:var(--bs-950);line-height:22px}
.rvmeta{font-size:13px;font-weight:400;color:var(--bs-700);margin-top:8px}
.secthead{display:flex;align-items:center;gap:12px;margin:8px 0 16px}
.count-badge{background:var(--bs-100);color:var(--bs-700);border-radius:var(--radius-pill);font-size:12px;line-height:16px;font-weight:600;padding:2px 10px}
.bar{width:4px;height:20px;border-radius:2px}
.hint{color:var(--sr-700);font-size:13px;font-weight:500}
.btn-c{min-height:44px;padding:0 16px}
.btn-s{min-height:44px;padding:0 16px}
/* round 6 (docs/per-product-review-panel/design.md): no .approve — reviews are public on
   submission; the only actions are hide/unhide + seller comment. Unhide is reversible,
   non-destructive → willowGreen-600 text on the secondary shape, not danger-colored. */
.btn-sec.unhide{color:var(--wg-600)}
/* seller-comment composer: full-width textarea, 1px bs-200 border radius 10px;
   Save = filled atomicTangerine-600 CTA (44px, .btn-p), Cancel = secondary */
.scomposer{margin-top:12px;padding-top:12px;border-top:1px solid var(--bs-200)}
/* "Edit comment" dot: a comment already exists (blueSlate-500, spec) */
.sc-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--bs-500);margin-left:4px}
"""

def ops_shell(active, badges, content_html, title):
    """v4 app-shell (docs/control-panel/design.md): .ops-content carries the gutter
    as an explicit --ops-page-pad class padding — reset-proof, token-driven."""
    return page_wrap(
        f'<div class="ops-shell">{onav(OPS_NAV, active, badges)}'
        f'<main class="ops-content"><div class="ops-page">{content_html}</div></main></div>',
        OPS_CSS, title)

# ---------------- inventory dashboard ----------------
def inv_row(name, cat, price, qty, status, zebra=False):
    pillcls = {"In stock": "pill-in", "Low": "pill-low", "Out of stock": "pill-out"}[status]
    bg = "background:var(--bs-50);" if zebra else ""
    low = " · LOW" if status == "Low" else ""
    return f'''<div class="oprow" style="{bg}">
      <span class="opname">{name}</span>
      <span class="opsub" style="width:110px">{cat}</span>
      <span class="price" style="width:120px">Rp {price}</span>
      <div class="stepper"><span class="on">−</span><span class="val">{qty}</span><span>+</span></div>
      <span class="pill {pillcls}" style="width:120px;justify-content:center">{status}</span>
      <div style="margin-left:auto;display:flex;gap:16px;align-items:center">
        <button class="setstock">Set stock</button>
        <a class="open-edit" href="#">Open editor</a>
      </div></div>'''

PAGES["inventory-dashboard"] = ops_shell(
    "Inventory",
    {"Inventory": 3, "Ongoing Orders": 4},
    f'''<div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:20px">
      <h1 class="h1">Inventory</h1>
      <div class="muted">48 products · 3 need attention</div>
    </div>
    <div style="background:var(--co-100);border:1px solid var(--co-300);border-radius:10px;padding:16px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:14px;font-weight:600;color:var(--bs-950)">Needs attention</span>
        <span class="count-badge" style="background:var(--co-600);color:#fff">3</span>
      </div>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:16px;font-size:14px;color:var(--bs-950);font-weight:500"><b>ASUS RT-AX58</b><span class="opsub">Smart Home</span><span class="hint">stock 0 · out of stock</span><a style="margin-left:auto;color:var(--at-600);font-weight:500" href="#">Open editor</a></div>
        <div style="display:flex;gap:16px;font-size:14px;color:var(--bs-950);font-weight:500"><b>Logitech MX Keys S</b><span class="opsub">Gaming</span><span class="hint">stock 3 · low</span><a style="margin-left:auto;color:var(--at-600);font-weight:500" href="#">Open editor</a></div>
        <div style="display:flex;gap:16px;font-size:14px;color:var(--bs-950);font-weight:500"><b>Anker 735 PB</b><span class="opsub">Accessories</span><span class="hint">stock 5 · low</span><a style="margin-left:auto;color:var(--at-600);font-weight:500" href="#">Open editor</a></div>
      </div>
    </div>
    <div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px;overflow:hidden">
      <div style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bs-200);background:var(--bs-50)">
        <span class="sec-label" style="font-size:13px">All products (48)</span>
        <span style="margin-left:auto;width:220px;display:block"><input class="input wfull" style="padding:9px 12px;min-height:44px" placeholder="Search name / category…"></span>
      </div>
      {inv_row("Sony WF-C710N","Audio","1.290.000",34,"In stock")}
      {inv_row("Anker 735 PB","Accessories","380.000",5,"Low",zebra=True)}
      {inv_row("Razer V3","Gaming","240.000",2,"Low")}
      {inv_row("Samsung Galaxy Watch6","Wearables","1.650.000",18,"In stock",zebra=True)}
      {inv_row("ASUS RT-AX58","Smart Home","549.000",0,"Out of stock")}
      <div style="padding:12px 16px;font-size:13px;color:var(--bs-700);border-top:1px solid var(--bs-200)">… 43 more products · stock ≤ 5 flagged LOW</div>
    </div></div>''',
    "Inventory Dashboard")

# ---------------- per-product dashboard ----------------
PAGES["per-product-dashboard"] = ops_shell(
    "Products",
    {},
    f'''<div style="width:330px;flex:none;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
        <h1 class="h1">Products</h1>
      </div>
      <input class="input wfull" style="margin-bottom:16px" placeholder="Search products…">
      <div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px;overflow:hidden;flex:1">
        <div class="urow" style="border-left:3px solid var(--at-500);background:var(--at-100)"><span class="opname">P-231 Sony WF-C710N</span><span style="margin-left:auto" class="pill pill-in">In · 34</span></div>
        <div class="urow"><span class="opname">P-198 Anker 735 PB</span><span style="margin-left:auto" class="pill pill-low">Low · 5</span></div>
        <div class="urow"><span class="opname">P-140 Logi MX Keys S</span><span style="margin-left:auto" class="pill pill-low">Low · 3</span></div>
        <div class="urow"><span class="opname">P-087 Razer V3</span><span style="margin-left:auto" class="pill pill-out">Out · 0</span></div>
        <div style="padding:12px 16px;font-size:13px;color:var(--bs-700);border-top:1px solid var(--bs-200)">… 44 more</div>
      </div>
      <button class="btn-p full" style="margin-top:16px">+ New product</button>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
        <h1 class="h1" style="font-size:16px;line-height:24px">Product editor</h1>
        <span class="muted">#P-231</span>
      </div>
      <div style="background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:24px">
        <div style="display:grid;grid-template-columns:130px 1fr;gap:16px 24px;align-items:center">
          <label class="label">Name</label><input class="input wfull" value="Sony WF-C710N Wireless Earbuds">
          <label class="label">Price</label><input class="input wfull" value="1290000">
          <label class="label">Category</label><div class="selectbox">Audio ▾</div>
          <label class="label">Image</label>
          <div style="display:flex;gap:16px;align-items:center"><div class="pimg" style="width:80px;height:60px;background:{TILE_GRADS['audio']}">{glyph("earbuds",32)}</div><button class="btn-sec btn-s">Replace</button></div>
          <label class="label">Description</label>
          <div class="input wfull" style="min-height:64px;font-size:14px;color:var(--bs-950)">Active noise cancellation, Bluetooth 5.3 multipoint, up to 13 h battery with case, IPX4.</div>
          <label class="label">Initial stock</label><input class="input wfull" style="max-width:120px" value="34">
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--bs-200);display:flex;justify-content:space-between;align-items:center">
          <span class="muted">Auto-decremented on each order — enter actual shelf count</span>
          <button class="btn-p">Save changes</button>
        </div>
      </div>
    </div>''',
    "Per Product Dashboard")

# ---------------- review panel ----------------
# round 6 (docs/per-product-review-panel/design.md): auto-approve — no pending/approved queue,
# no approve, no delete. Two sections: PUBLIC (newest first) + HIDDEN (collapsed, clearly
# labelled so a manager can confirm what the public is NOT seeing). Every row: stars,
# anonymized buyer + order, description, state pill, [Hide|Unhide] + [Add|Edit comment]
# (composer opens inline under the row — .scomposer).
def rv_card(stars_n, quote, buyer, order, state, comment=None, show_composer=False, composer_val=""):
    pillcls = "pill-rv-public" if state == "public" else "pill-rv-hidden"
    toggle = ('<button class="btn-sec btn-s">Hide</button>' if state == "public"
             else '<button class="btn-sec btn-s unhide">Unhide</button>')
    if comment:
        cbtn = f'<button class="btn-sec btn-s">Edit comment<span class="sc-dot" aria-hidden="true"></span></button>'
    else:
        cbtn = '<button class="btn-sec btn-s">Add comment</button>'
    composer = ""
    if show_composer:
        composer = f'''<div class="scomposer">
        <label class="label" for="sc">Seller comment</label>
        <textarea class="input wfull" id="sc" style="min-height:66px;border-radius:10px;margin-top:8px" aria-label="Seller comment">{composer_val}</textarea>
        <div style="display:flex;gap:12px;margin-top:12px"><button class="btn-p btn-c">Save comment</button><button class="btn-sec btn-s">Cancel</button></div>
      </div>'''
    return f'''<div class="rvcard">
    <div style="display:flex;align-items:center;gap:10px">{stars(stars_n)}<span class="rvtext">“{quote}”</span>
      <span class="pill {pillcls}" style="margin-left:auto" aria-label="{state}">{"Public" if state == "public" else "Hidden"}</span></div>
    <div class="rvmeta">— {buyer} (order {order})</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">{toggle}{cbtn}</div>
    {composer}
  </div>'''

PAGES["per-product-review-panel"] = ops_shell(
    "Reviews",
    {"Reviews": 128},
    f'''<div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <h1 class="h1">Reviews</h1>
      <span class="muted">Product:</span>
      <div class="selectbox">Sony WF-C710N (P-231) ▾</div>
      <span class="meta" style="margin-left:auto">122 public / 6 hidden · 128 total</span>
    </div>
    <!-- PUBLIC: reviews are public on submission (round 6); newest first. -->
    <div class="secthead"><div class="bar" style="background:var(--wg-500)"></div><span class="sec-label" style="font-size:13px">Public</span><span class="count-badge">122</span><span class="meta" style="margin-left:auto">shown on product page ↓</span></div>
    {rv_card(4,"Solid build, ANC keeps up on the train…","buyer_102 · Sony WF-C710N ×1","#WB-0987","public",
             comment="Thanks — firmware 2.1 improved ANC.", show_composer=True, composer_val="Thanks — firmware 2.1 improved ANC.")}
    {rv_card(5,"Fast charge, great for travel","buyer_207 · Anker 735 PB ×1","#WB-0951","public",
             comment="We ship the 20 000 mAh variant — 36 h max.")}
    {rv_card(3,"OK sound, case is bulkier than expected","buyer_348 · Sony WF-C710N ×1","#WB-0922","public")}
    <!-- HIDDEN: not public, still counts in the 128 total; collapsed behind its count header. -->
    <div class="secthead" style="margin-top:16px"><div class="bar" style="background:var(--bs-400)"></div><span class="sec-label" style="font-size:13px">Hidden</span><span class="count-badge">6</span><span class="meta" style="margin-left:auto">not public · still counts in total</span><a class="link" style="margin-left:8px">Expand ▾</a></div>
    {rv_card(2,"Arrived cracked in the mail","buyer_311 · Sony WF-C710N ×1","#WB-0890","hidden",
             comment="Replacement shipped — order #WB-0901.")}
    <div class="meta" style="margin-top:auto;padding-top:12px">Reviews are public on submission (no approval step) · actions per row: hide/unhide + seller comment · a seller comment renders publicly beneath the review while it is public · hidden reviews keep counting in the total (128 = 122 public + 6 hidden; stars counted in the average — TBD) · staff have no access to this panel</div>
  </div>''',
    "Per Product Review Panel")

# ---------------- ongoing orders ----------------
def orow(oid, dt, lines_n, total, chipcls, chipicon, chiptext, action, expanded=False, detail=None):
    exp = f'<div style="padding:12px 16px 16px;font-size:13px;color:var(--bs-700);background:var(--bs-50);border-radius:0 0 8px 8px">{detail}</div>' if expanded else ""
    act = f'<button class="btn-p btn-c">{action}</button>' if action else ""
    return f'''<div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px;overflow:hidden;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;min-height:64px">
      <span style="font-weight:600;color:var(--bs-950)">{oid}</span>
      <span class="opsub">{dt}</span>
      <span class="opsub">{lines_n} lines</span>
      <span class="price">{total}</span>
      <span class="ochip {chipcls}">{chipicon} {chiptext}</span>
      <div style="margin-left:auto;display:flex;gap:16px;align-items:center">
        <a class="link" href="#">{"Details ▴" if expanded else "Details ▾"}</a>
        {act}
      </div></div>{exp}</div>'''

PAGES["ongoing-orders"] = ops_shell(
    "Ongoing Orders",
    {"Inventory": 3},
    f'''<div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
      <h1 class="h1">Ongoing orders</h1>
    </div>
    <div class="tabs" style="margin-bottom:16px">
      <span class="tab">All (42)</span><span class="tab active">Pending (9)</span><span class="tab">Processing (5)</span><span class="tab">Shipped (3)</span><span class="tab">Delivered</span>
    </div>
    {orow("#WB-1042","19 Sep 12:04","2","Rp 1.670.000","ochip-pending","●","pending","Start processing",True,
         "WF-C710N ×1 · 735 PB ×1 · Jl. Kemang Selatan 12, Jakarta Selatan · buyer: jordan.wjy — Anker 735 Power Bank ×1, Logitech MX Keys S ×2")}
    {orow("#WB-1039","18 Sep 09:11","1","Rp 240.000","ochip-processing","◐","processing","Mark shipped",True,
         "Razer BlackWidow V3 ×1 · Jkt, Indonesia · buyer: rian_w")}
    {orow("#WB-1036","18 Sep 07:42","3","Rp 2.030.000","ochip-pending","●","pending","Start processing")}
    {orow("#WB-1031","17 Sep 16:20","1","Rp 549.000","ochip-pending","●","pending","Start processing")}
    <div class="meta" style="margin-top:auto;padding-top:12px">Queue sorted by age (oldest pending first) · status advances forward-only (pending → processing → shipped → delivered)</div>
  </div>''',
    "Ongoing Orders")

# ---------------- user dashboard ----------------
def urow2(name, role, active, last):
    cls = "urow" + (" dis" if not active else "")
    pill = f'<span class="pill pill-{"active" if active else "disabled"}">{"Active" if active else "Disabled"}</span>'
    sw = f'<div class="switch {"on" if active else "off"}" role="switch" aria-checked="{"true" if active else "false"}"><div class="track"></div></div>'
    return f'''<div class="{cls}">
      <span class="opname">{name}</span>
      <span class="role-pill role-{role}">{role}</span>
      {pill}
      <span class="opsub">last active {last}</span>
      <div style="margin-left:auto;display:flex;gap:16px;align-items:center">
        <div class="selectbox">{"admin" if name=="admin_ria" else role} ▾</div>
        {sw}
      </div></div>'''

PAGES["user-dashboard"] = ops_shell(
    "Users",
    {},
    f'''<div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
      <h1 class="h1">Users</h1>
      <span class="pill pill-processing">Admin only</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      <span style="width:260px;display:block"><input class="input wfull" placeholder="Search name / email…"></span>
      <span class="muted">128 users · 3 staff · 2 managers · 1 admin</span>
    </div>
    <div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px;overflow:hidden">
      {urow2("buyer_102","buyer",True,"2d")}
      {urow2("ops_marta","staff",True,"1h")}
      {urow2("ops_dan","manager",False,"40d")}
      {urow2("rian_w","buyer",True,"6d")}
      {urow2("admin_ria","admin",True,"2h")}
    </div>
    <div style="margin-top:16px;background:var(--wg-100);border:1px solid var(--wg-300);border-radius:10px;padding:12px 16px;font-size:14px;font-weight:500;color:var(--wg-700)">Role updated to manager · ops_marta</div>
    <div class="meta" style="margin-top:auto;padding-top:12px">Users nav item: admin-only · toggle = disable/enable account · disabled users see “Account not available” on login</div>
  </div>''',
    "User Dashboard")
