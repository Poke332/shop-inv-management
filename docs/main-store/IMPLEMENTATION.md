# Main Store — Implementation

Phase P3. Visual/interaction source: `docs/main-store/design.md` (round-11 grid) + mockups.
Storefront layout: `StorefrontHeader` on `tuscanSun-50` warm ground.

## Route

- Path: `/` — roles: **buyer** (decision #8 carried as buyer-only; if staff-browse is
  adopted later, guard widens to `buyer | staff` and the page renders the read-only
  variant — no card actions, no cart badge). Authenticated non-buyers → redirected to
  their ops home; anonymous → redirected to `/login` (the home page is post-login per the
  sheet).
- In-page target: `#shop-all` (hero CTA "Shop the drop" smooth-scrolls;
  `scroll-margin-top: 80px` under the sticky 56px header; `prefers-reduced-motion` →
  instant jump).

## Components

| Component | Responsibility |
|---|---|
| `HeroBanner` | Full-bleed 16:9 band (`hero-banner.png`, `object-position: center right`, `loading="eager"`/`fetchpriority="high"`), HTML copy overlay in the right third (eyebrow 13/600 `tuscanSun-300`, H2 32/40 w600 white, sub 14/400 `blueSlate-100`, primary CTA → `#shop-all`); image-failure collapses to a 160px `atomicTangerine-50` band with the same copy; mobile: copy drops to bottom-left static flow, H2 → 26/36, CTA full-width |
| `CategoryGrid` | Round-11 3×2 grid of 6 clickable category **images** (`cat-<slug>.png` 4:1, `object-fit: cover`, no baked-in text, alt = category label) with the title on the white bar below (`card-title` 15/24 w600 `blueSlate-950`, `padding: 12px 16px`), **no product counts**; hover border → `atomicTangerine-400`; mobile <768: horizontal-scroll row, tile min-width 320px, 24px gutter |
| `ProductGrid` + `ProductCard` | Defined here, reused by search-browse and product-details list contexts. Card: 4:3 gradient tile (category-keyed, §3.3 table) with badges (sale top-left, featured top-right, low-stock bottom-left, 8px inset), 1-line-clamped title, subline, price (600 `atomicTangerine-600` + strike 400 `blueSlate-600`), round-11 CTA row: **Buy now** (primary filled 44px) + **Add to cart** (secondary outline, plus glyph) side by side, 8px gap, equal split; both disabled (`blueSlate-100`/`blueSlate-400`, `aria-disabled`) when out of stock; tile `opacity .4` + "Out of stock" pill at stock 0 |
| `ProductGrid` (load-more) | Renders exactly 8 items = 4 FEATURED + first 4 of SHOP_ALL (2 desktop rows); "See more" is a filled 44px 320px button **on the "Our Products" heading row** (right side, `space-between`; full-width on <768 where the row stacks); exhaustion → centered 13/400 `blueSlate-700` "All N products shown" line |
| `CartIcon` | Header badge = cart line count (`atomicTangerine-500` white 12/600 number — TBD open decision #3 marker per design doc) |

## Links

- Logo → `/` (home). Search submit → `/search?query=<q>`. Cart icon → `/cart` (badge =
  count). Account menu (buyer) → "My orders" `/orders`, Logout.
- **Deep-link contract (the contract other pages link to):** each category tile →
  `/search?category=<slug>` (audio / smart-home / gaming / laptops / accessories /
  wearables) — the arriving Search/Browse renders the category chip active like any other
  filter chip (removable, refetches in place); no new route.
- Card / "Buy now" → `/products/:id` ("Buy now" adds to cart first, then navigates);
  "Add to cart" stays on the page (optimistic badge increment, ~600ms `willowGreen-500`
  check flash; API failure → `strawberryRed` toast "Couldn't add to cart — stock
  changed. Reload." + card flips to out-of-stock state).
- No order flow starts here.

## Data

- `mockApi.getProducts()` → the ARCHITECTURE §4.2 product set: FEATURED = P-231 Sony
  WF-C710N (sale, featured), P-198 Anker 735 PB, P-140 Logitech MX Keys S, P-087 Razer
  BlackWidow V3 (stock 2 → "Only 2 left"); SHOP_ALL first-4 = P-052 MacBook Air M3,
  P-111 JBL Charge 5 (sale), P-064 ASUS RT-AX58 (out of stock), P-208 Anker 65 W GaN;
  remaining 40 synthesized to 48 total. Categories = the 6 `Category` records; category
  counts stay out of the round-11 UI.
- Future Express: `GET /products` + `GET /categories` (the ARCHITECTURE §4.3 placeholder
  rows); sale/featured flags ride on the product record (manager-set).
- States: static grid skeletons while in flight; empty = "No products yet" + helper +
  "Refresh" CTA; 5xx = `strawberryRed` panel + "Try again".

## Surviving state

- Cart (via `CartStore`): the header badge count and the "Add to cart" optimistic update
  must survive navigation to any storefront route and across refresh (session storage).
- Nothing else: the 8-item slice + See-more offset is derived state, reset per mount.

## Page-specific notes

- Section order (round-11): header → hero (full-bleed, outside the centered container) →
  "Browse by category" (3×2 image grid) → "Our Products" heading row + See more → 8-item
  grid. The "Shop" H1 was removed in round 8 — the hero leads the page.
- Card grid: `repeat(4, minmax(0,1fr))` at ≥1024, 3-up 768–1023, 2-up 390–767 (24px
  gutter), 1-up <390; `min-width:0` on grid items; equal row heights; CTA row pinned to
  the card bottom (`margin-top:auto`), 12px internal rhythm, card min-height 300px.
- Mobile header wrap: logo left, cart + account right, search on its own 44px line below.
- Role visibility (mis-routed staff+): read-only cards — no Buy now / Add to cart, no
  cart badge.
- Verification: match `mockup.png` (top viewport, header + full-bleed hero) and
  `mockup-bottom.png` (category grid + Our Products + See-more) at 1312px; 390px no
  horizontal scroll.
