# Page: Search / Browse — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Filtered catalog view — same `ProductCard`/`ProductGrid` as Main Store, plus a filter rail.
Shared shell: `StorefrontHeader` (search bar pre-filled on arrival from header search).
Typography & spacing per `docs/design-tokens-round3.md` (Roboto 400/500/600, 8pt grid,
unified pill badges, filled CTA stack).

## FEATURES

- Search + filter the catalog (buyer). Locked axes from the sheet: **category, price, brand +
  free-text**. No other axes (do not invent sort-by-rating etc. without a sheet basis —
  a plain "Sort: Featured / Price ↑ / Price ↓" is a reasonable assumption and flagged).
- **Domain example set (electronics/gadgets, user directive):** category filter options
  render as the store's categories — e.g. Audio, Smart Home, Gaming, Laptops,
  Accessories, Wearables; brand filter options as electronics brands — e.g. Sony,
  Anker, Logitech, Samsung. These are illustrative data, not a hard-coded list: the
  filter rail reflects whatever categories/brands exist in the catalog (the category
  set is admin/manager-manageable — category CRUD is out of sheet scope, flagged in
  the Per Product Dashboard doc).
- Results are a paginated `See more` grid consistent with Main Store (this page uses its
  own 3-column grid; see §VISUALIZATION).
- **Filter rail is a desktop affordance (round 3):** on mobile (<768px) the rail is
  simply hidden — the page shows the catalog grid only. The round-2 mobile
  "Filters (N)" bottom sheet / off-canvas drawer is **not part of round 3** (note kept
  here only as the removed behavior).
- **Role-gating (TBD — open decision #8):** buyer-only per the page list, which
  contradicts the matrix granting browse/view-detail to staff+ (also flagged in
  the Inventory Dashboard role note). Most likely interpretation used here:
  buyer-only. If the team resolves it to "staff can also browse", route guard
  widens to `buyer | staff` — layout unchanged
  (staff read-only, no Add-to-Cart / no cart badge, same as Main Store).
- Filter state lives in URL query params (shareable/refreshable — most likely
  interpretation; sheet is silent).

## LINKS / NAVIGATION

- Arrivals: header search submit (all roles landing on storefront), "Browse" link in header
  (if included — most likely: header is Search + cart + account only; Browse reached via
  search). Direct deep-link: `/search?query=&category=&brand=&priceMin=&priceMax=&sort=`.
- Card → Product Details.
- "Clear all" → returns to `/search` with empty params (results = full catalog, rendered
  in this page's 3-up grid).
- In-flow: filters never navigate — they refetch in place.

## VISUALIZATION

![Search & browse results page mockup](mockup.png)

> mockup.png rendered from _mockup-build/out/search-browse.html via headless Chromium @ 2026-09-22


ASCII wireframe (desktop, ≥768px):

```
+------------------------------------------------------------------+
| Sunset Electronics [ sony audio........ ]   (cart:2)  (account)  |
+------------------------------------------------------------------+
| FILTERS |  [Sony ×] [Audio ×]   Clear all      128 results [Sort:|
| Category|  Featured ▾]  (active chips + count + sort row)        |
|  ✓ All   |                                                        |
|  ✓ Audio |  +--------+ +--------+ +--------+                      |
|  Smart Hm|  | card   | | card   | | card   |   grid-search:      |
|  Gaming  |  | Sony C7| | Anker  | | Razer  |   3 cols, 24px gutter|
|  Laptops |  | Rp1.29 | | Rp380k | | Rp240k |   (+cadd 44px each)|
|  Access. |  +--------+ +--------+ +--------+                      |
|  Wearable|  +--------+ +--------+ +--------+                      |
| Brand    |  | card   | | card   | | card   |                      |
|  [✓] Sony|  | ...    | | ...    | | ...    |                      |
|  [ ] Anker| +--------+ +--------+ +--------+                      |
|  [ ] Logi |                                                        |
|  [ ] Samsung|                                                     |
|  [ ] ASUS |  [ See more ]  (filled 44px, 320px wide, centered)   |
| Price    |                                                        |
| [---o-----] Rp 50k – Rp 5.000.000                                |
+------------------------------------------------------------------+
(rail 220px, right border blueSlate-200; 20px top padding in results col)
```

Mobile (<768px): **filter rail hidden** — catalog-only view (filters are a desktop
affordance; the round-2 bottom sheet / off-canvas drawer is not part of round 3). Header
wraps: logo left, cart + account right, search row on its own line. Grid 3-up becomes
2-up at ≥390px (16px gutter), 1-up <390px; "See more" full-width.

(Card copy follows the Main Store card spec; typical results: "Sony WF-C710N
Wireless Earbuds", "Anker 735 Power Bank 20 000 mAh", "Razer BlackWidow V3",
"Logitech MX Keys S", "ASUS RT-AX58 Wi-Fi 6 router", "Samsung Galaxy Watch6".)

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / cards | `#FFFFFF`, card border `blueSlate-200` |
| Result count, helper text | `blueSlate-700` 13/400 |
| Rail section titles ("Filters", "Category", "Brand", "Price") | `blueSlate-950` 16/24 w600, .05em tracking, sentence case |
| Filter option idle / active-selected | `blueSlate-950` / selected row `atomicTangerine-50` bg with `atomicTangerine-600` text (category rows); brand checkboxes `accent-color` `atomicTangerine-500` |
| Price range input | native `accent-color` `atomicTangerine-500`; range labels `blueSlate-700` 13/400 |
| Active filter chips | pill `blueSlate-100` bg, `blueSlate-900` label; removable × glyph `strawberryRed-600` |
| "Clear all" link | `atomicTangerine-600` 13px, underline on hover |
| Sort control | secondary button: white fill, 1px `blueSlate-200` border, `blueSlate-950` label, hover fill `blueSlate-100`, 44px min |
| Price / add-to-cart on result cards | per Main Store card spec: price `atomicTangerine-600` 14/600, filled circular 44px add-to-cart |
| Empty-results panel | `blueSlate-50` bg, heading `blueSlate-950`, helper `blueSlate-700` |
| Sale badge on result cards | `strawberryRed-600` fill, white label (color-tokens §3; same card spec as Main Store) |
| API error panel | `strawberryRed-100` bg, `strawberryRed-700` text + "Try again" (`strawberryRed-600` fill, white) |

## INTERACTIONS

(React: `SearchResults`, `FilterRail`, `PriceRange`, `ProductGrid`.)

- **Idle:** rail sections (Category, Brand, Price) render open in the 220px rail
  (round-3 rail shows all sections — no accordion collapse; if the team wants
  progressive disclosure later, it is a rail-only change).
- **Applying filters:** debounced free-text (300ms) + immediate for category/brand
  toggles; loading state = static skeletons in the grid (no shimmer;
  `prefers-reduced-motion` honored), filters stay enabled except
  the control being re-queried.
- **Hover:** filter options get `blueSlate-50` bg; card hover matches Main Store.
- **Active (applied):** applied chip row above the grid when any filter active —
  each chip removable (× glyph `strawberryRed-600`), plus "Clear all".
- **Disabled:** slider thumbs disabled while request in flight.
- **Load more:** filled 44px primary button (320px desktop / full-width mobile) shows a
  spinner and disables while the request is in flight; when the list is exhausted it is
  replaced by a centered 13/400 `blueSlate-700` "All N products shown" line.
- **Empty:** no results → "No matches for …" + suggested action (remove one filter at a
  time — offer "Clear all" prominently). Not an error: `blueSlate-50` panel.
- **Error:** `strawberryRed` panel with retry; last good results stay on screen behind
  the panel (never white-screen the user on a failed refetch).
- **Role-based visibility:** staff variant read-only (see §FEATURES).
- **Keyboard/a11y:** slider uses native range inputs with visible values; results grid
  is a semantic list; filter changes announced via `aria-live="polite"` result count;
  focus ring 2px `atomicTangerine-500` offset 2; all tap targets ≥ 44px.
