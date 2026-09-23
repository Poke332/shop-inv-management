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
/* round-11: .crow = two 44px buttons side by side (equal flex split, 8px gap) —
   "Buy now" primary filled (btn-p style) + "Add to cart" outline (btn-sec style,
   plus glyph kept before the label so it stays recognizable). Mobile (<768px):
   labels shrink to 13px and "Add to cart" folds to a 44px icon-only button. */
.crow{display:flex;gap:8px;margin-top:auto}
.crow .cbuy,.crow .ccart{flex:1 1 0;min-width:0;height:44px;border-radius:8px;cursor:pointer;
display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 8px;
font-family:var(--font-sans);font-size:14px;line-height:20px;font-weight:500;white-space:nowrap}
.cbuy{border:0;background:var(--at-600);color:#fff;transition:background-color 150ms ease}
.cbuy:hover{background:var(--at-700)} .cbuy:active{background:var(--at-800)}
.ccart{background:#fff;border:1px solid var(--bs-200);color:var(--bs-950);transition:background-color 150ms ease}
.ccart:hover{background:var(--bs-100)}
.ccart svg{width:16px;height:16px;flex:none}
.cbuy[aria-disabled=true]{background:var(--bs-100);color:var(--bs-400);cursor:not-allowed}
.ccart[aria-disabled=true]{background:var(--bs-100);color:var(--bs-400);cursor:not-allowed}
"""

# v4 main-store: hero banner + category rail (docs/main-store/design.md)
MAINSTORE_CSS = """
.mstore{max-width:var(--content-max);margin:0 auto;padding:0 48px}
.hero{position:relative;aspect-ratio:16/9;width:100%;overflow:hidden;margin-bottom:var(--section-rhythm)}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center right}
.hero-copy{position:absolute;right:48px;top:50%;transform:translateY(-50%);max-width:380px;text-align:left}
.hero-copy>*+*{margin-top:12px}
.hero-eyebrow{font-size:13px;line-height:20px;font-weight:600;letter-spacing:.05em;color:var(--ts-300)}
.hero-h2{font-size:32px;line-height:40px;font-weight:600;color:#fff}
.hero-sub{font-size:14px;line-height:20px;font-weight:400;color:var(--bs-100)}
#shop-all{scroll-margin-top:80px}
/* round-11: category section = 6 clickable IMAGES (cat-<slug>.png, 1200x300, no
   baked text) in a 3x2 grid on desktop (larger tiles than round-10's 6-across
   row); the title sits on the white bar below the image; the product count
   line is dropped */
.cats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--card-gutter);margin-bottom:var(--section-rhythm)}
.cat-strip{display:block;background:#fff;border:1px solid var(--bs-200);border-radius:8px;overflow:hidden;transition:border-color 150ms ease}
.cat-strip:hover{border-color:var(--at-400);text-decoration:none}
.cat-cimg{position:relative}
.cat-cimg>img{width:100%;aspect-ratio:4/1;object-fit:cover;display:block}
/* round-11: title moved OFF the image onto the white bar below it;
   the .cat-count product-count line is dropped */
.cat-lab{padding:12px 16px;font-size:15px;line-height:24px;font-weight:600;color:var(--bs-950)}
/* heading row: "Our Products" left, "See more" right (round-10 — button moved off its centered-bottom position) */
.shop-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--section-label-gap)}
/* round-11: mobile (<768px) — the category row becomes a horizontal-scroll rail
   (min-width 320px tiles — larger than round-10's 240px); the heading row stacks
   so the full-width "See more" (lib .btn-loadmore → 100% on <768px) sits under
   the "Our Products" label */
@media (max-width:767px){
  .mstore{padding:32px 16px 0}
  .hero-copy{right:16px;left:16px;top:auto;bottom:16px;transform:none;max-width:100%}
  .hero-h2{font-size:26px;line-height:36px}
  .hero-copy .btn-p{width:100%}
  .cats{display:flex;overflow-x:auto;gap:24px}
  .cat-strip{min-width:320px;flex:none}
  .shop-head{flex-direction:column;align-items:stretch;gap:12px}
}
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
    """§3.4 card: clamped 1-line title, 13px metadata, 14px/600 at-600 price.
    round-11: .crow row = 'Buy now' (btn-p filled) + 'Add to cart' (btn-sec outline,
    plus glyph) side by side; OOS → both aria-disabled. §3.3 tile: 4:3 aspect-ratio
    gradient swatch, blueSlate-900 glyph. Badge pills (§3.1): sale/out-of-stock
    top-left, featured top-right, low-stock bottom-left."""
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
    if oos:
        buy = '<button class="cbuy" aria-disabled="true" aria-label="Buy now (out of stock)">Buy now</button>'
        cadd = (f'<button class="ccart" aria-disabled="true" aria-label="Add to cart (out of stock)">'
                f'{ICONS["plus"]}<span class="clbl">Add to cart</span></button>')
    else:
        buy = f'<button class="cbuy" aria-label="Buy {name} now">Buy now</button>'
        cadd = (f'<button class="ccart" aria-label="Add {name} to cart">'
                f'{ICONS["plus"]}<span class="clbl">Add to cart</span></button>')
    wstyle = "" if w == "auto" else f"max-width:{w}px;"
    return f'''<a class="pcard" style="{wstyle}" href="#product-details" aria-label="{name}">
  <div style="position:relative;opacity:{op}">{tiles}{btl}{btr}{bbl}</div>
  <div class="cbody">
    <div class="ttl"><div class="cname">{name}</div><div class="csub">{sub}</div></div>
    <div class="cprice"><span class="price">Rp {price}</span></div>
    <div class="crow">
      {buy}
      {cadd}
    </div>
  </div></a>'''

CAT = ["All", "Audio", "Smart Home", "Gaming", "Laptops", "Accessories", "Wearables"]

# v4 category rail: label, glyph (round-3 §3.3), gradient key, count (illustrative mockup data),
# deep link per docs/main-store/design.md URL contract.
CATS = [
    ("Audio", "earbuds", "audio", 12),
    ("Smart Home", "router", "smart", 8),
    ("Gaming", "gamepad", "gaming", 10),
    ("Laptops & PC", "laptop", "laptops", 9),
    ("Accessories", "powerbank", "acc", 7),
    ("Wearables", "watch", "wear", 5),
]

def cat_strips():
    """Round-11: category section = 6 clickable IMAGES in a 3x2 desktop grid
    (docs/main-store/cat-<slug>.png, 1200x300, no baked-in text) — the title
    sits on the white bar below the image; the round-10 image overlay label
    and the product-count line are both dropped (the CATS array is kept as-is:
    search-browse/filter docs still reference it). Same deep-link contract as
    the old cat_tiles()."""
    out = []
    for label, icon, key, _n in CATS:
        slug = {"Audio": "audio", "Smart Home": "smart-home", "Gaming": "gaming",
                "Laptops & PC": "laptops", "Accessories": "accessories",
                "Wearables": "wearables"}[label]
        out.append(
            f'<a class="cat-strip" href="/search?category={slug}">'
            f'<div class="cat-cimg">'
            f'<img src="../../docs/main-store/cat-{slug}.png" alt="{label}">'
            f'</div>'
            f'<div class="cat-lab">{label}</div></a>')
    return "\n".join(out)


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
<div class="hero">
  <img src="../../docs/main-store/hero-banner.png" alt="Sunset Glow: headphones, smartwatches, laptop, phone, speaker and game controller on a dark reflective surface" loading="eager" fetchpriority="high">
  <div class="hero-copy">
    <div class="hero-eyebrow">NEW SEASON GEAR</div>
    <h2 class="hero-h2">Power everything.</h2>
    <div class="hero-sub">Audio to wearables — new drops this week.</div>
    <a class="btn-p" href="#shop-all">Shop the drop</a>
  </div>
</div>
<div class="mstore">
  <div style="margin-bottom:var(--section-label-gap)">
    <div class="sec-label">Browse by category</div>
  </div>
  <div class="cats">
    {cat_strips()}
  </div>
  <div class="shop-head" id="shop-all">
    <div class="sec-label">Our Products</div>
    <button class="btn-p btn-loadmore">See more</button>
  </div>
  <div class="grid4">
    <!-- round-10: exactly the first 8 items (4 FEATURED tile-marked + first 4 of SHOP_ALL)
         so the grid4 shows 2 rows on desktop; the data arrays stay intact — the
         "See more" affordance implies the rest exist. -->
    {''.join(card(n, s, p, i, **kw) for n, s, p, i, kw in FEATURED + SHOP_ALL[:4])}
  </div>
</div>''',
    MAINSTORE_CSS + CARD_CSS, "Main Store")

PAGES["search-browse"] = page_wrap(
    f'''{shead("2","sony audio")}
<div style="display:flex;gap:0;height:calc(736px - 56px)">
  <aside class="sfilters" style="width:220px;background:#fff;border-right:1px solid var(--bs-200);padding:20px 16px;overflow:hidden">
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
<div class="pd-flex">
  <div class="pd-media">
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
    <div class="pd-info">
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
        <div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px">
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
        <div style="background:#fff;border:1px solid var(--bs-200);border-radius:10px;padding:16px">
          <div style="font-size:14px;line-height:22px;font-weight:400;color:var(--bs-700)">Active noise cancellation with ambient sound mode, Bluetooth 5.3 multipoint and up to 13 hours of battery with the charging case. IPX4 water resistance for everyday use. <a class="link" href="#">Read more</a></div>
        </div>
      </div>
    </div>
  </div>
  <!-- round 6 (docs/product-details/design.md): count = public + hidden; list shows public
       reviews only (no approve/deny affordance anywhere); hidden reviews never render here.
       Seller comment block beneath a review — absent when the seller hasn't commented. -->
  <div style="margin-top:40px">
    <div class="sec-label" style="margin-bottom:16px">Reviews (128)</div>
    <div style="border:1px solid var(--bs-200);border-radius:10px;padding:16px">
      <div style="display:flex;align-items:center;gap:10px">
        {stars(4)}
        <span style="font-weight:500;color:var(--bs-950)">“Solid build, ANC keeps up on the train”</span>
        <span class="meta" style="margin-left:auto">12 Sep 2026</span>
      </div>
      <div class="meta" style="margin-top:8px">buyer_102 · purchased Sony WF-C710N ×1</div>
      <div class="scomment">
        <div class="lbl">Seller</div>
        <div class="body">Thanks — firmware 2.1 improved ANC.</div>
        <div class="dt">14 Sep</div>
      </div>
    </div>
  </div>
</div>''',
    '''/* round 6: seller comment — indented 16px beneath the review, 2px blueSlate-200 left border
   (spec §COMPONENTS: label bs-950 13/600 · body bs-700 14/22 w400 · date bs-500 13/400) */
.scomment{margin:12px 0 0 16px;padding:4px 0 4px 16px;border-left:2px solid var(--bs-200)}
.scomment .lbl{font-size:13px;line-height:20px;font-weight:600;color:var(--bs-950)}
.scomment .body{font-size:14px;line-height:22px;font-weight:400;color:var(--bs-700);margin-top:2px}
.scomment .dt{font-size:13px;line-height:20px;font-weight:400;color:var(--bs-500);margin-top:4px}
/* mobile (<768px): image stacks on top (4:3 crop), info column below; grid gap 32px → 24px
   (spec §COMPONENTS, mobile line). The desktop row keeps the 440px media column. */
.pd-flex{display:flex;gap:32px}
.pd-media{width:440px;flex:none;min-width:0}
.pd-info{flex:1;min-width:0}
@media (max-width:767px){
  .pd-flex{flex-direction:column;gap:24px}
  .pd-media{width:100%}
}
''', "Product Details")

# ---------------- cart ----------------
PAGES["cart"] = page_wrap(
    f'''{shead("2")}
<div style="padding:24px">
  <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:24px">
    <h1 class="h1">Cart</h1><span class="meta">(2 items)</span>
  </div>
  <div style="display:flex;gap:32px">
    <div style="flex:1;min-width:0;background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:24px">
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
# 3-step wizard (round-9): Personal info → Shipping address → Payment.
# _STEP (module global) is the rendered step; the capture script overrides it for
# the step-2 / step-3 / progress-bar captures. default = 1.
# "Place order" is ONLY a step-3 CTA: desktop renders it inside the payment card,
# mobile (≤767px) hides the order panel and shows it in a fixed bottom CTA bar.
_STEP = 1
CO_CSS = """
/* 3-step progress indicator (pinned above the form): numbered circles + labels + track */
.co-progress{display:flex;align-items:flex-start;background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:24px}
.co-pstep{display:flex;flex-direction:column;align-items:center;gap:8px;flex:none;width:96px}
.co-pnum{width:32px;height:32px;border-radius:50%;border:2px solid var(--bs-200);background:#fff;
display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--bs-500)}
.co-pstep.active .co-pnum{background:var(--at-600);border-color:var(--at-600);color:#fff}
.co-pstep.done .co-pnum{background:var(--at-600);border-color:var(--at-600);color:#fff}
.co-plabel{font-size:13px;line-height:16px;font-weight:500;color:var(--bs-700)}
.co-pstep.active .co-plabel{color:var(--bs-950);font-weight:600}
.co-track{flex:1;height:2px;background:var(--bs-200);margin:16px 8px 0}
.co-track.done{background:var(--at-600)}
.co-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:24px}
.co-card{background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:24px}
.co-card-t{display:flex;align-items:center;gap:12px;margin-bottom:24px;font-size:16px;line-height:24px;font-weight:600;color:var(--bs-950)}
.co-actions{display:flex;justify-content:space-between;gap:24px;margin-top:24px}
/* payment radio-cards: 44px rows, selected = blueSlate-200 border + tint */
.co-pay{border:1px solid var(--bs-200);border-radius:8px;padding:10px 16px;min-height:44px;display:flex;align-items:center;gap:12px;margin-bottom:8px;cursor:pointer;background:#fff}
.co-pay.sel{border:1px solid var(--bs-200);background:var(--bs-100)}
.co-pay .dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--bs-300);background:#fff;flex:none;position:relative}
.co-pay.sel .dot{border-color:var(--at-600)}
.co-pay.sel .dot::after{content:'';position:absolute;inset:2px;border-radius:50%;background:var(--at-600)}
.co-pay-m{font-size:14px;line-height:20px;font-weight:500;color:var(--bs-950)}
.co-pay-s{font-size:13px;line-height:16px;font-weight:400;color:var(--bs-700);margin-top:4px}
.co-cond{margin:16px 0 0;padding:24px;border:1px dashed var(--bs-200);border-radius:8px;background:var(--bs-50)}
.co-qr{display:grid;place-items:center;margin:8px 0 16px;width:64px;height:64px;border:1px dashed var(--bs-300);border-radius:8px;background:#fff}
/* compact receipt block (step 3) */
.co-rhead{font-size:16px;line-height:24px;font-weight:600;color:var(--bs-950);margin-bottom:16px}
.co-rrow{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bs-200)}
.co-rrow .nm{flex:1;font-size:14px;line-height:20px;font-weight:500;color:var(--bs-950)}
.co-rtot{display:flex;justify-content:space-between;padding:16px 0 0;font-size:14px;line-height:20px;font-weight:400;color:var(--bs-700)}
.co-rtot .v{font-size:20px;line-height:28px;font-weight:600;color:var(--bs-950)}
/* mobile (≤767px): the order-review panel drops; a fixed bottom CTA bar takes over */
.co-sticky{display:none;position:fixed;bottom:0;left:0;right:0;z-index:40;background:#fff;
border-top:1px solid var(--bs-200);padding:16px 24px;gap:16px;align-items:center;justify-content:space-between}
.co-sticky .t{font-size:20px;line-height:28px;font-weight:600;color:var(--bs-950)}
.co-sticky .l{font-size:13px;line-height:20px;font-weight:400;color:var(--bs-700);margin-bottom:4px}
@media (max-width:767px){
  .co-order{display:none}
  .co-sticky{display:flex}
}
@media (max-width:389px){
  .co-plabel{display:none}
  .co-pstep{width:48px}
}
/* "Place order" (.co-place) is step-3-only: it is rendered structurally only for
   step 3 (payment-card CTA, mobile sticky bar, order-panel button) and is absent
   from the step-1 / step-2 / step-4 (receipt) DOM */
/* step-4 receipt confirmation view */
.co-check{width:26px;height:26px;border-radius:50%;background:var(--wg-500);display:flex;align-items:center;justify-content:center;flex:none}
.co-receipt{background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:24px}
.co-rtbl{border:1px solid var(--bs-200);border-radius:8px;overflow:hidden;margin:16px 0}
.co-rtr{display:flex;align-items:center;gap:12px;padding:8px 16px;background:#fff}
.co-rtr+.co-rtr{border-top:1px solid var(--bs-200)}
.co-rtr .nm{flex:1;min-width:0;font-size:14px;line-height:20px;font-weight:500;color:var(--bs-950)}
.co-rtr .q{width:40px;flex:none;text-align:center;font-size:14px;line-height:20px;font-weight:400;color:var(--bs-700)}
.co-rtr .am{width:96px;flex:none;text-align:right;font-size:14px;line-height:20px;font-weight:600;color:var(--bs-950)}
.co-rth{display:flex;align-items:center;gap:12px;padding:8px 16px;background:var(--bs-50);font-size:13px;line-height:16px;font-weight:600;color:var(--bs-700);border-bottom:1px solid var(--bs-200)}
.co-rth .q,.co-rth .am{font-weight:600}
.co-rtbl .co-rtot{display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--bs-200);background:var(--bs-50);
font-size:14px;line-height:20px;font-weight:600;color:var(--bs-700)}
.co-rtbl .co-rtot .v{font-size:20px;line-height:28px;color:var(--bs-950)}
.co-rpay{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--bs-200);
font-size:14px;line-height:20px;font-weight:500;color:var(--bs-950)}
"""

def co_input(label, val, ph=""):
    return f'''<div style="margin-bottom:16px"><label class="label">{label}</label>
        <div style="margin-top:8px"><input class="input wfull" value="{val}" placeholder="{ph}"></div></div>'''

def co_note(val):
    return f'''<div style="margin-bottom:16px"><label class="label">Note (optional)</label>
        <div style="margin-top:8px"><div class="input wfull" style="min-height:66px">{val}</div></div></div>'''

def co_progress(n):
    labels = ["Personal info", "Shipping address", "Payment"]
    out = []
    for i, lab in enumerate(labels, 1):
        cls = "active" if i == n else ("done" if i < n else "up")
        out.append(f'<div class="co-pstep {cls}" aria-current={"step" if i == n else "false"}">'
                   f'<div class="co-pnum">{i}</div><div class="co-plabel">{lab}</div></div>')
        if i < 3:
            out.append(f'<div class="co-track{" done" if i < n else ""}" role="presentation"></div>')
    return ('<div class="co-progress" role="group" aria-label="Checkout progress">'
            + "".join(out) + "</div>")

def co_cardopt(label, sub, sel, icon):
    d = " sel" if sel else ""
    dot = f'<span class="dot" aria-hidden="true"></span>'
    return (f'<div class="co-pay{d}" data-method="{label}">{dot}'
            f'<div style="flex:1;min-width:0">{icon}<div class="co-pay-m">{label}</div>'
            f'<div class="co-pay-s">{sub}</div></div></div>')

def co_receipt():
    return f'''<div class="co-card">
      <div class="co-rhead">Receipt</div>
      <div class="co-rrow">
        <div class="pimg" style="width:24px;height:24px;background:{TILE_GRADS['audio']};border-radius:4px">{glyph("earbuds",12)}</div>
        <div class="nm">Sony WF-C710N ×1</div>
        <div class="price">Rp 1.290.000</div>
      </div>
      <div class="co-rrow">
        <div class="pimg" style="width:24px;height:24px;background:{TILE_GRADS['acc']};border-radius:4px">{glyph("powerbank",12)}</div>
        <div class="nm">Anker 735 PB ×1</div>
        <div class="price">Rp 380.000</div>
      </div>
      <div class="co-rtot"><span>Subtotal</span><span style="color:var(--bs-950);font-weight:600">Rp 1.670.000</span></div>
      <div class="co-rtot"><span>Total (to be settled)*</span><span class="v">Rp 1.670.000</span></div>
      <div class="meta" style="margin-top:8px">*payment TBD — order stays pending until settled</div>
    </div>'''

CARD_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--at-600)" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>'
BANK_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--at-600)" aria-hidden="true"><path d="M3 9l9-6 9 6M5 9v10M9 9v10M15 9v10M19 9v10M3 21h18"/></svg>'
QR_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--at-600)" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 21h3v-3M21 21h-3"/></svg>'

CHECK_IC = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L19 7"/></svg>'

def co_receipt_table():
    """Step-4 confirmation: receipt-style line-item table (item / qty / line amount
    + total) with the payment-method summary line."""
    return f'''<div class="co-rtbl">
      <div class="co-rtr co-rth"><div class="nm">Item</div><div class="q">Qty</div><div class="am">Amount</div></div>
      <div class="co-rtr"><div class="nm">Sony WF-C710N Wireless Earbuds</div><div class="q">1</div><div class="am">Rp 1.290.000</div></div>
      <div class="co-rtr"><div class="nm">Anker 735 Power Bank</div><div class="q">1</div><div class="am">Rp 380.000</div></div>
      <div class="co-rtot"><span>Total (to be settled)</span><span class="v">Rp 1.670.000</span></div>
      <div class="co-rpay">{CARD_IC}<div style="flex:1">Card ending in <b style="font-weight:600">•••• 9999</b> — charged on delivery</div></div>
    </div>'''

def co_steps(n):
    """The active step's card; 'Place order' is rendered ONLY for step 3."""
    if n == 1:
        card = f'''<div class="co-card">
        <div class="co-card-t"><span class="step-num">1</span>Personal information</div>
        {co_input("Name","Jordan Wijaya")}
        {co_input("Phone","+62 812-3456-7890")}
        {co_input("Email","jordan.w@example.com")}
        {co_note("Please deliver after 5 PM — fragile item, extra packaging")}
        <div class="co-actions"><div></div><button class="btn-p">Continue</button></div>
      </div>'''
        return card
    if n == 2:
        card = f'''<div class="co-card">
        <div class="co-card-t"><span class="step-num">2</span>Shipping address</div>
        {co_input("Address","Jl. Kemang Selatan 12, RT 4 / RW 9, Jakarta Selatan")}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          {co_input("District","Kemang")}
          {co_input("City","Jakarta Selatan")}
          {co_input("Province","DKI Jakarta")}
          {co_input("Postal code","12730")}
        </div>
        <div class="co-actions"><button class="btn-sec">Back</button><button class="btn-p">Continue</button></div>
      </div>'''
        return card
    if n == 4:
        card = f'''<div class="co-receipt">
        <div class="co-card-t" style="margin-bottom:8px"><span class="co-check">{CHECK_IC}</span><span>Order placed<span style="font-weight:400;color:var(--bs-700)"> · Order <b style="font-weight:600;color:var(--bs-950)">#WB-1043</b></span></span><span class="pill pill-pending" style="margin-left:auto">pending</span></div>
        {co_receipt_table()}
        <div class="meta" style="margin-bottom:24px">Ships from Sunset Electronics — estimated delivery 24 Sep 2026, 10:00–14:00. Payment settles after the order is confirmed.</div>
        <div class="co-actions"><div></div><a class="btn-p" href="#orders-placed" style="text-decoration:none;color:#fff">View my orders</a></div>
      </div>'''
        return card
    pay = "".join([
        co_cardopt("Card", "Visa · Mastercard · JCB — charge on delivery", True, CARD_IC),
        co_cardopt("Bank transfer", "VA number generated after the order is placed", False, BANK_IC),
        co_cardopt("QRIS", "Scan &amp; pay from any e-wallet app", False, QR_IC),
    ])
    cond = f'''<div class="co-cond">
        {co_input("Card number","4444 2222 1111 9999")}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          {co_input("Expiry","MM/YY")}
          {co_input("CVV","•••")}
        </div>
      </div>'''
    receipt = co_receipt()
    card = f'''<div class="co-card">
      <div class="co-card-t"><span class="step-num">3</span>Payment</div>
      <fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Payment method</legend>{pay}</fieldset>
      {cond}
      {receipt}
      <div class="co-actions"><button class="btn-sec">Back</button><button class="btn-p co-place">Place order</button></div>
      <div style="margin-top:24px;text-align:center"><a class="link" href="#">Edit cart</a></div>
    </div>'''
    return card

def _co_page(step):
    """Full checkout page for the given wizard step (module global _STEP drives the capture set)."""
    # "Place order" is step-3-only: the order-review panel renders its CTA button
    # structurally only on step 3 (panel_cta), matching the sticky bar + payment card.
    panel_cta = ('<button class="btn-p full co-place" style="margin-top:16px">Place order</button>'
                 if step == 3 else '')
    head = f'''{shead("2")}
<div style="padding:24px">
  <h1 class="h1" style="margin-bottom:24px">Checkout</h1>
  <div style="display:flex;gap:32px;align-items:flex-start">
    <div class="co-body">
      {co_progress(step)}
      {co_steps(step)}
    </div>
    <div class="co-order" style="width:340px;flex:none;background:var(--bs-50);border:1px solid var(--bs-200);border-radius:12px;padding:24px;height:fit-content">
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
      <div class="meta" style="margin-top:8px">*payment TBD — order stays pending until settled</div>
      <div style="text-align:center;margin-top:16px"><button class="btn-sec" style="width:100%">Edit cart</button></div>
      {panel_cta}
    </div>
  </div>
</div>'''
    sticky = ('<div class="co-sticky" style="margin-top:24px">'
              '<div><div class="l">Total (to be settled)</div>'
              '<div class="t">Rp 1.670.000</div></div>'
              '<button class="btn-p co-place">Place order</button></div>')
    if step == 3:
        # step 3: mobile keeps the page scrollable to the bottom CTA bar (body overflow fix)
        head = head.replace('style="padding:24px"', 'style="padding:24px;margin-bottom:88px"', 1)
        return head + sticky
    return head

PAGES["checkout"] = page_wrap(
    _co_page(_STEP),
    CO_CSS, "Checkout")

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
