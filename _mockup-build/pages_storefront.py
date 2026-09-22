# Storefront pages: main-store, search-browse, product-details, cart, checkout, orders-placed
# Round-3 (docs/design-tokens-round3.md): §3.3 gradient tiles, §3.4 clamped card titles + pinned CTA,
# §3.5 single SHOP ALL grid (no FEATURED strip), §3.1 tile badge pills, §3.2 filled 44px CTAs.
import sys
sys.path.insert(0, ".")
from lib import *
from pages_auth import PAGES

CARD_CSS = """
/* §3.4 card layout — baselines that line up */
.grid-search{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.grid-search .pcard{min-width:0}
@media (max-width:767px){ .grid-search{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px} }
@media (max-width:389px){ .grid-search{grid-template-columns:1fr} }
.sfilters{display:block}
@media (max-width:767px){ .sfilters{display:none} } /* mobile: catalog-only; filters are a desktop affordance */
.pcard{background:#fff;border:1px solid var(--bs-200);border-radius:12px;overflow:hidden;
display:flex;flex-direction:column;min-width:0;min-height:300px}
.pcard .ptile{border-radius:0;width:100%}
.cbody{padding:24px;display:flex;flex-direction:column;gap:12px;flex:1}
.cbody>.ttl{min-width:0}
.cname{font-size:15px;line-height:24px;font-weight:600;color:var(--bs-950);
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csub{font-size:13px;line-height:20px;font-weight:400;color:var(--bs-700)}
.cprice{height:20px}
.crow{display:flex;align-items:center;justify-content:space-between;margin-top:auto}
.cadd{width:44px;height:44px;border-radius:999px;border:none;background:var(--at-600);color:#fff;
display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background-color 150ms ease}
.cadd:hover{background:var(--at-700)} .cadd:active{background:var(--at-800)}
.cadd svg{width:20px;height:20px}
.cadd[aria-disabled=true]{background:var(--bs-100);color:var(--bs-400);cursor:not-allowed}
"""

CAT_MAP = {"Audio": "audio", "Smart Home": "smart", "Gaming": "gaming",
           "Laptops": "laptops", "Laptops & PC": "laptops", "Accessories": "acc",
           "Wearables": "wear"}

def grad_for(sub):
    for key, g in CAT_MAP.items():
        if key in sub:
            return g
    return "unmapped"

def card(name, sub, price, icon, h="auto", tag=None, oos=False, only=None, sale=False, featured=False, w="auto"):
    """§3.4 card: clamped 1-line title, 13px metadata, 14px/600 at-600 price, pinned 44px add-to-cart.
    §3.3 tile: 4:3 aspect-ratio gradient swatch, blueSlate-900 glyph. Badge pills (§3.1):
    sale/out-of-stock top-left, featured top-right, low-stock bottom-left."""
    th = "aspect-ratio:4/3" if h == "auto" else f"height:{h}px"
    tiles = (f'<div class="ptile" style="{th};background:{TILE_GRADS[grad_for(sub)]}">{glyph(icon)}</div>')
    btl = f'<span class="tb tb-sale" style="top:8px;left:8px">On sale</span>' if (sale and not oos) else ""
    btr = '<span class="tb tb-feat" style="top:8px;right:8px">Featured</span>' if (featured or tag) else ""
    bbl = ""
    if oos:
        bbl = '<span class="tb tb-oos" style="bottom:8px;left:8px">Out of stock</span>'
    elif only:
        bbl = f'<span class="tb tb-low" style="bottom:8px;left:8px">Only {only} left</span>'
    op = "0.4" if oos else "1"
    add = ('<button class="cadd" aria-disabled="true" aria-label="Add to cart (out of stock)">'
           f'{ICONS["plus"]}</button>') if oos else \
          f'<button class="cadd" aria-label="Add {name} to cart">{ICONS["plus"]}</button>'
    wstyle = "" if w == "auto" else f"max-width:{w}px;"
    return f'''<a class="pcard" style="{wstyle}" href="#product-details" aria-label="{name}">
  <div style="position:relative;opacity:{op}">{tiles}{btl}{btr}{bbl}</div>
  <div class="cbody">
    <div class="ttl"><div class="cname">{name}</div><div class="csub">{sub}</div></div>
    <div class="cprice"><span class="price">Rp {price}</span></div>
    <div class="crow">
      {add}
    </div>
  </div></a>'''

CAT = ["All", "Audio", "Smart Home", "Gaming", "Laptops", "Accessories", "Wearables"]

# §3.5 curation — one SHOP ALL grid, featured first (tile-marked); the two rows never share a product.
FEATURED = [
    ("Sony WF-C710N Wireless Earbuds", "Noise-cancelling · Audio · Sony", "1.290.000", "earbuds", dict(sale=True, featured=True)),
    ("Anker 735 Power Bank 20 000 mAh", "USB-C PD 140 W · Accessories · Anker", "380.000", "powerbank", dict(featured=True)),
    ("Logitech MX Keys S", "Backlit keyboard · Accessories · Logitech", "415.000", "keyboard", dict(featured=True)),
    ("Razer BlackWidow V3", "Mechanical gaming · Gaming · Razer", "240.000", "gamepad", dict(featured=True, only=3)),
]
SHOP_ALL = [
    ("Apple MacBook Air M3", "13\u2033 · Laptops & PC · Apple", "17.499.000", "laptop", dict()),
    ("JBL Charge 5 Speaker", "Bluetooth · Audio · JBL", "1.899.000", "speaker", dict(sale=True)),
    ("ASUS RT-AX58 Wi-Fi 6 Router", "Mesh-ready · Smart Home · ASUS", "549.000", "router", dict()),
    ("Anker 65 W GaN Charger", "GaN II · Accessories · Anker", "259.000", "powerbank", dict()),
    ("Samsung Galaxy Watch6", "Biosensor · Wearables · Samsung", "1.650.000", "watch", dict(only=4)),
    ("Razer BlackShark V2 Pro", "Wired headset · Gaming · Razer", "450.000", "gamepad", dict()),
    ("Xiaomi Mi Smart Bulb 2", "Wi-Fi · Smart Home · Xiaomi", "120.000", "router", dict()),
    ("Logitech G Pro X Superlight", "Wireless · Gaming · Logitech", "999.000", "gamepad", dict()),
]

PAGES["main-store"] = page_wrap(
    f'''{shead("3")}
<div style="max-width:var(--content-max);margin:0 auto;padding:40px 48px 0">
  <h1 class="h1" style="margin-bottom:20px">Shop</h1>
  <div class="sec-label" style="margin-bottom:20px">Shop All</div>
  <div class="grid4">
    {''.join(card(n, s, p, i, **kw) for n, s, p, i, kw in FEATURED)}
    {''.join(card(n, s, p, i, **kw) for n, s, p, i, kw in SHOP_ALL)}
  </div>
  <div style="display:flex;justify-content:center;margin-top:40px">
    <button class="btn-p btn-loadmore">See more</button>
  </div>
</div>''',
    CARD_CSS, "Main Store")

PAGES["search-browse"] = page_wrap(
    f'''{shead("2","sony audio")}
<div style="display:flex;gap:0;height:calc(736px - 56px)">
  <aside class="sfilters" style="width:220px;border-right:1px solid var(--bs-200);padding:20px 16px;overflow:hidden">
    <div class="sec-label" style="margin-bottom:16px">Filters</div>
    <div style="font-size:14px;font-weight:600;color:var(--bs-950);margin:16px 0 8px">Category</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      {''.join(f'<div style="font-size:14px;font-weight:{"600" if c in ("All","Audio") else "500"};color:{"var(--at-600)" if c=="Audio" else "var(--bs-950)"};background:{"var(--at-50)" if c in ("All","Audio") else "transparent"};padding:6px 8px;border-radius:6px;min-height:32px;display:flex;align-items:center">{"\\u2713 " if c in ("All","Audio") else ""}{c}</div>' for c in CAT)}
    </div>
    <div style="font-size:14px;font-weight:600;color:var(--bs-950);margin:16px 0 8px">Brand</div>
    <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;font-weight:500;color:var(--bs-950)">
      <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked style="accent-color:var(--at-500);width:16px;height:16px"> Sony</label>
      <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" style="accent-color:var(--at-500);width:16px;height:16px"> Anker</label>
      <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" style="accent-color:var(--at-500);width:16px;height:16px"> Logitech</label>
      <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" style="accent-color:var(--at-500);width:16px;height:16px"> Samsung</label>
      <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" style="accent-color:var(--at-500);width:16px;height:16px"> ASUS</label>
    </div>
    <div style="font-size:14px;font-weight:600;color:var(--bs-950);margin:16px 0 8px">Price</div>
    <input type="range" style="width:100%;accent-color:var(--at-500)">
    <div style="font-size:13px;font-weight:400;color:var(--bs-700);margin-top:8px">Rp 50k \u2013 Rp 5.000.000</div>
  </aside>
  <div style="flex:1;padding:20px 24px;min-width:0">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <span class="chip">Sony <span style="color:var(--sr-600)">\u00d7</span></span>
      <span class="chip">Audio <span style="color:var(--sr-600)">\u00d7</span></span>
      <a class="link" href="#">Clear all</a>
      <span class="meta" style="margin-left:auto">128 results</span>
      <button class="btn-sec" style="min-height:44px">Sort: Featured \u25be</button>
    </div>
    <div class="grid-search">
      {card("Sony WF-C710N Wireless Earbuds","Audio \u00b7 Sony","1.290.000","earbuds",sale=True,featured=True)}
      {card("Anker 735 Power Bank 20 000 mAh","Accessories \u00b7 Anker","380.000","powerbank")}
      {card("Razer BlackWidow V3","Gaming \u00b7 Razer","240.000","gamepad",only=3)}
      {card("Logitech MX Keys S","Accessories \u00b7 Logitech","415.000","keyboard")}
      {card("ASUS RT-AX58 Wi-Fi 6 router","Smart Home \u00b7 ASUS","549.000","router",oos=True)}
      {card("Samsung Galaxy Watch6","Wearables \u00b7 Samsung","1.650.000","watch")}
    </div>
    <div style="display:flex;justify-content:center;margin-top:24px"><button class="btn-p btn-loadmore">See more</button></div>
  </div>
</div>''',
    CARD_CSS, "Search / Browse")

# ---------------- product details ----------------
PAGES["product-details"] = page_wrap(
    f'''{shead("2")}
<div style="padding:20px 24px">
  <a class="meta" href="#" style="color:var(--at-600);margin-bottom:16px;display:inline-block">← Back to shop</a>
  <div style="display:flex;gap:32px">
    <div style="width:440px;flex:none;min-width:0">
      <div style="position:relative">
        <div class="ptile" style="height:330px;background:{TILE_GRADS['audio']};border:1px solid var(--bs-200)">{glyph("earbuds")}</div>
        <span class="tb tb-sale" style="top:8px;left:8px">On sale</span>
        <span class="tb tb-feat" style="top:8px;right:8px">Featured</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div class="pimg" style="width:84px;height:64px;background:{TILE_GRADS['audio']};border:2px solid var(--at-500)">{glyph("earbuds",32)}</div>
        <div class="pimg" style="width:84px;height:64px;background:{TILE_GRADS['acc']}">{glyph("powerbank",32)}</div>
        <div class="pimg" style="width:84px;height:64px;background:{TILE_GRADS['wear']}">{glyph("watch",32)}</div>
      </div>
    </div>
    <div style="flex:1;min-width:0">
      <div class="meta">Sony</div>
      <h1 class="h1" style="margin:4px 0 8px">Sony WF-C710N Wireless Earbuds</h1>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        {stars(4)}
        <span class="meta">4.3 (128 reviews)</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:24px;line-height:32px;font-weight:600;color:var(--at-600)">Rp 1.290.000</span>
        <span class="strike">Rp 1.518.000</span>
        <span class="chip chip-pending" style="background:var(--sr-100);color:var(--sr-700)">\u221215%</span>
      </div>
      <div class="meta" style="color:var(--wg-600);margin-bottom:16px">In stock · 34 left</div>
      <div style="display:flex;gap:16px;align-items:center">
        <div class="qty"><span class="on">−</span><span class="val">1</span><span>+</span></div>
        <button class="btn-p" style="padding:0 28px">Add to cart</button>
      </div>
      <div style="margin-top:40px">
        <div class="sec-label" style="margin-bottom:20px">Specs</div>
        <div style="border:1px solid var(--bs-200);border-radius:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--bs-200)">
            <div style="padding:12px 16px;border-right:1px solid var(--bs-200)"><span class="meta">Model</span><div style="font-weight:500;color:var(--bs-950)">WF-C710N</div></div>
            <div style="padding:12px 16px"><span class="meta">Bluetooth</span><div style="font-weight:500;color:var(--bs-950)">5.3, multipoint</div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--bs-200)">
            <div style="padding:12px 16px;border-right:1px solid var(--bs-200)"><span class="meta">Battery</span><div style="font-weight:500;color:var(--bs-950)">13 h w/ case</div></div>
            <div style="padding:12px 16px"><span class="meta">ANC</span><div style="font-weight:500;color:var(--bs-950)">yes</div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr">
            <div style="padding:12px 16px;border-right:1px solid var(--bs-200)"><span class="meta">IP rating</span><div style="font-weight:500;color:var(--bs-950)">IPX4</div></div>
            <div style="padding:12px 16px"><span class="meta">Weight</span><div style="font-weight:500;color:var(--bs-950)">5.4 g per bud</div></div>
          </div>
        </div>
      </div>
      <div style="margin-top:40px">
        <div class="sec-label" style="margin-bottom:16px">Description</div>
        <div style="font-size:14px;line-height:22px;font-weight:400;color:var(--bs-700)">Active noise cancellation with ambient sound mode, Bluetooth 5.3 multipoint and up to 13 hours of battery with the charging case. IPX4 water resistance for everyday use. <a class="link" href="#">Read more</a></div>
      </div>
    </div>
  </div>
  <div style="margin-top:40px">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="sec-label">Reviews (128)</div>
      <span class="meta">filter: all / ★1 / ★2 / ★3 / ★4 / ★5</span>
    </div>
    <div style="border:1px solid var(--bs-200);border-radius:10px;padding:16px;margin-top:16px">
      <div style="display:flex;align-items:center;gap:10px">
        {stars(4)}
        <span style="font-weight:500;color:var(--bs-950)">“Solid build, ANC keeps up on the train”</span>
        <span class="meta" style="margin-left:auto">12 Sep 2026</span>
      </div>
      <div class="meta" style="margin-top:8px">buyer_102 · purchased Sony WF-C710N ×1</div>
    </div>
  </div>
</div>''',
    "", "Product Details")

# ---------------- cart ----------------
PAGES["cart"] = page_wrap(
    f'''{shead("2")}
<div style="padding:24px">
  <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:24px">
    <h1 class="h1">Cart</h1><span class="meta">(2 items)</span>
  </div>
  <div style="display:flex;gap:32px">
    <div style="flex:1;min-width:0;border:1px solid var(--bs-200);border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:24px">
      <div style="display:flex;gap:16px">
        {prod_img("earbuds",84,84,grad="audio")}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--bs-950)">Sony WF-C710N <span class="muted" style="font-weight:400">— Rp 1.290.000</span></div>
          <div class="meta">Wireless Earbuds · Audio · Sony</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
            <div class="qty"><span class="on">−</span><span class="val">1</span><span>+</span></div>
            <span class="price">Rp 1.290.000</span>
            <button aria-label="Remove Sony WF-C710N from cart" style="margin-left:auto;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:none;background:none;cursor:pointer;color:var(--bs-500)">{ICONS["trash"]}</button>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid var(--bs-200)"></div>
      <div style="display:flex;gap:16px">
        {prod_img("powerbank",84,84,grad="acc")}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--bs-950)">Anker 735 Power Bank <span class="muted" style="font-weight:400">— Rp 380.000</span></div>
          <div class="meta">20 000 mAh · USB-C PD 140 W</div>
          <div class="meta" style="color:var(--co-600)">Low · 5 left</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
            <div class="qty"><span class="on">−</span><span class="val">1</span><span>+</span></div>
            <span class="price">Rp 380.000</span>
            <button aria-label="Remove Anker 735 Power Bank from cart" style="margin-left:auto;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:none;background:none;cursor:pointer;color:var(--bs-500)">{ICONS["trash"]}</button>
          </div>
        </div>
      </div>
    </div>
    <div style="width:320px;flex:none;background:var(--bs-50);border:1px solid var(--bs-200);border-radius:12px;padding:24px;height:fit-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="meta">Subtotal</span><span style="font-size:20px;line-height:28px;font-weight:600;color:var(--bs-950)">Rp 1.670.000</span></div>
      <div class="meta" style="margin-bottom:16px">Payment model TBD (v1: no payment step)</div>
      <button class="btn-p full">Proceed to checkout →</button>
      <div style="text-align:center;margin-top:16px"><a class="link" href="#">Continue shopping</a></div>
    </div>
  </div>
</div>''',
    "", "Cart")

# ---------------- checkout ----------------
def co_input(label, val, ph="", area=False):
    if area:
        return f'''<div style="margin-bottom:16px"><label class="label">{label}</label>
        <div style="margin-top:8px"><div class="input wfull" style="min-height:66px">{val}</div></div></div>'''
    return f'''<div style="margin-bottom:16px"><label class="label">{label}</label>
        <div style="margin-top:8px"><input class="input wfull" value="{val}" placeholder="{ph}"></div></div>'''

PAGES["checkout"] = page_wrap(
    f'''{shead("2")}
<div style="padding:24px">
  <h1 class="h1" style="margin-bottom:24px">Checkout</h1>
  <div style="display:flex;gap:32px">
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:24px">
      <div style="border:1px solid var(--bs-200);border-radius:12px;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><span class="step-num">1</span><span style="font-size:16px;line-height:24px;font-weight:600;color:var(--bs-950)">Shipping address</span></div>
        {co_input("Name","Jordan Wijaya")}
        {co_input("Phone","+62 812-3456-7890")}
        {co_input("Address","Jl. Kemang Selatan 12, RT 4 / RW 9, Jakarta Selatan, DKI Jakarta 12730",area=True)}
      </div>
      <div style="border:1px solid var(--bs-200);border-radius:12px;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><span class="step-num">2</span><span style="font-size:16px;line-height:24px;font-weight:600;color:var(--bs-950)">Review your order</span></div>
        <div style="font-size:14px;font-weight:400;color:var(--bs-700)">Sony WF-C710N Wireless Earbuds ×1 · Anker 735 Power Bank ×1 — read-only; edit in Cart.</div>
      </div>
    </div>
    <div style="width:340px;flex:none;background:var(--bs-50);border:1px solid var(--bs-200);border-radius:12px;padding:24px;height:fit-content">
      <div style="font-size:16px;line-height:24px;font-weight:600;color:var(--bs-950);margin-bottom:16px">Order review</div>
      <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bs-200)">
        <div class="pimg" style="width:44px;height:44px;background:{TILE_GRADS['audio']}">{glyph("earbuds",20)}</div>
        <div style="flex:1;font-size:14px;color:var(--bs-950);font-weight:500">Sony WF-C710N ×1</div>
        <div class="price">Rp 1.290.000</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bs-200)">
        <div class="pimg" style="width:44px;height:44px;background:{TILE_GRADS['acc']}">{glyph("powerbank",20)}</div>
        <div style="flex:1;font-size:14px;color:var(--bs-950);font-weight:500">Anker 735 PB ×1</div>
        <div class="price">Rp 380.000</div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:14px;color:var(--bs-700);font-weight:400"><span>Subtotal</span><span style="color:var(--bs-950);font-weight:600">Rp 1.670.000</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0 0"><span style="font-size:14px;color:var(--bs-700);font-weight:400">Total (to be settled)*</span><span style="font-size:20px;line-height:28px;font-weight:600;color:var(--bs-950)">Rp 1.670.000</span></div>
      <div class="meta" style="margin-top:8px">*payment TBD — no payment step in v1</div>
      <button class="btn-p full" style="margin-top:16px">Place order</button>
      <div style="text-align:center;margin-top:16px"><button class="btn-sec" style="width:100%">Edit cart</button></div>
    </div>
  </div>
</div>''',
    "", "Checkout")

# ---------------- orders placed ----------------
# timeline steps per state: pending → first step current; delivered → all done
def tl_row(state):
    steps = ["pending","processing","shipped","delivered"]
    idx = steps.index(state)
    out = []
    for i, s in enumerate(steps):
        cls = "done" if i < idx else ("cur" if i == idx else "up")
        out.append(f'<div class="tl-step {cls}"><span class="tl-dot"></span>{s}</div>')
        if i < len(steps)-1:
            out.append(f'<div class="tl-line{" done" if i < idx else ""}"></div>')
    return "".join(out)

def order_html(oid, date, chipcls, chipicon, chiptext, expanded, state, lines, total, review):
    rev = ""
    if review:
        rev = f'''<div style="margin-top:16px;background:var(--bs-50);border:1px solid var(--bs-200);border-radius:10px;padding:16px">
        <div class="meta" style="margin-bottom:12px;font-weight:600;color:var(--bs-950)">Rate this purchase — Sony WF-C710N</div>
        <div style="display:flex;align-items:center;gap:12px">
          {stars(4)}
          <input class="input wfull" style="max-width:340px;padding:9px 12px" placeholder="comment (optional)">
          <button class="btn-p btn-c">Send</button>
        </div></div>'''
    exp = ""
    if expanded:
        exp = f'''<div style="border-top:1px solid var(--bs-200);padding:16px 20px">
        <div class="timeline" style="margin-bottom:16px">{tl_row(state)}</div>
        <div style="display:flex;gap:12px;align-items:center">{lines}<div style="margin-left:auto;font-size:14px;color:var(--bs-700);font-weight:400">Total <span style="color:var(--bs-950);font-weight:600">{total}</span></div></div>
        {rev}</div>'''
    return f'''<div class="card" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;min-height:44px">
        <span style="font-weight:600;color:var(--bs-950)">{oid}</span>
        <span class="meta">{date}</span>
        {pill(chipcls, f"{chipicon} {chiptext}")}
        <a class="link" style="margin-left:auto;font-size:14px;font-weight:500">{"Details ▴" if expanded else "Details ▾"}</a>
      </div>{exp}</div>'''

PAGES["orders-placed"] = page_wrap(
    f'''{shead("0")}
<div style="padding:24px">
  <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:24px">
    <h1 class="h1">My orders</h1>
  </div>
  {order_html("#WB-1042","19 Sep 2026","pill-pending","●","pending",True,"pending",
     f'''<div style="display:flex;gap:12px;align-items:center">{prod_img("earbuds",40,40,grad="audio")}<span style="font-size:14px;color:var(--bs-950);font-weight:500">Sony WF-C710N ×1</span><span class="price" style="font-size:13px;line-height:20px">Rp 1.290.000</span>
     {prod_img("powerbank",40,40,grad="acc")}<span style="font-size:14px;color:var(--bs-950);font-weight:500">Anker 735 PB ×1</span><span class="price" style="font-size:13px;line-height:20px">Rp 380.000</span></div>''',
     "Rp 1.670.000", False)}
  {order_html("#WB-0987","12 Sep 2026","pill-delivered","✓","delivered",True,"delivered",
     f'''<div style="display:flex;gap:12px;align-items:center">{prod_img("earbuds",40,40,grad="audio")}<span style="font-size:14px;color:var(--bs-950);font-weight:500">Sony WF-C710N ×1</span><span class="price" style="font-size:13px;line-height:20px">Rp 1.290.000</span></div>''',
     "Rp 1.290.000", True)}
</div>''',
    "", "Orders Placed")
