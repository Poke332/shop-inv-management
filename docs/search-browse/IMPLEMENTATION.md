# Search / Browse — Implementation

Phase P3. Visual/interaction source: `docs/search-browse/design.md` + mockup. Reuses
`StorefrontHeader`, `ProductCard`, `ProductGrid` (main-store definitions).

## Route

- Path: `/search` — roles: **buyer** (staff read-only variant if decision #8 widens it —
  same as main-store: no card actions, no cart badge).
- **URL contract (the deep-link contract main-store tiles land on):**
  `/search?query=&category=&brand=&priceMin=&priceMax=&sort=` — all filter state lives in
  query params (shareable/refreshable); filters never navigate, they refetch in place
  (param updates, not route changes).
- Arrival: header search submit (pre-fills `query`), category tiles
  (`/search?category=<slug>`), direct deep-link. "Clear all" → `/search` empty params
  (= full catalog in this page's 3-up grid).

## Components

| Component | Responsibility |
|---|---|
| `FilterRail` | Desktop-only 220px rail (`#FFFFFF` surface per round-8 §12, right border `blueSlate-200`, 20px top padding in results col): sections Category (rows, selected = `atomicTangerine-50` bg + `atomicTangerine-600` text), Brand (checkboxes, `accent-color: atomicTangerine-500`), Price (native range pair, labels "Rp 50k – Rp 5.000.000"); **hidden on mobile <768** (catalog-only view — the round-2 bottom sheet is out of scope) |
| `FilterChips` | Active-filter chip row above the grid: pill `blueSlate-100` bg, `blueSlate-900` label, removable × glyph `strawberryRed-600`; "Clear all" link `atomicTangerine-600` 13px |
| `PriceRange` | Two native range inputs (min/max) with visible values; thumbs disabled while a request is in flight. **Dual-range constraint (decided):** min and max are two overlapping `<input type=range>` on one track — min is clamped so it can never exceed max (dragging min past max snaps min back to max; dragging max below min snaps max back to min), so the effective range is always `[min, max]` with `min ≤ max`. The two thumbs stay independently draggable across the full track; the values shown are the clamped ones. |
| `SearchResults` | Results header (count "128 results" 13/400 `blueSlate-700` + "Sort: Featured ▾" secondary 44px button — Sort options Featured / Price ↑ / Price ↓, flagged assumption) + 3-column grid (24px gutter; 2-up ≥390px mobile at 16px gutter, 1-up <390px) of the shared `ProductCard` (round-11 dual CTA) + centered "See more" filled 44px 320px button (full-width mobile; exhaustion → "All N products shown" 13/400 `blueSlate-700`) |

## Links

- Card → `/products/:id`. "Clear all" → `/search`. No exit to cart/checkout from this page.
- The arriving `category` chip renders like any other active chip (the main-store contract).

## Data

- `mockApi.getProducts({ query, category, brand, priceMin, priceMax, sort })` — the same
  ARCHITECTURE §4.2 product set; the search-browse mockup slice: P-231 Sony WF-C710N
  (sale + featured), P-198 Anker 735 PB, P-087 Razer BlackWidow V3 (stock 3 → "Only 3
  left"), P-140 Logitech MX Keys S, P-064 ASUS RT-AX58 router (out of stock),
  P-173 Samsung Galaxy Watch6; result count 128 (illustrative, per mockup).
- Category options = the 6 `Category` records (admin/manager-manageable — category CRUD
  is out of sheet scope, flagged); brand options reflect catalog brands (Sony, Anker,
  Logitech, Samsung, ASUS in the mockup; illustrative, not hard-coded).
- States: static grid skeletons while refetching (filters stay enabled except the
  control being re-queried); empty = "No matches for …" + "Clear all" prominently
  (`blueSlate-50` panel, not an error); 5xx = `strawberryRed` panel with retry — last
  good results stay on screen behind the panel.

## Surviving state

- Filter state = URL query params (survives refresh/share by construction).
- Load-more offset is derived state, reset when any param changes. **Not URL-encoded,
  deliberately (decided, not an omission):** the offset is component-local and is
  derived/reset on ANY change to the filter params (query, category, brand, price,
  sort) — putting it in the URL would create stale deep links into mid-scroll state,
  which is meaningless when the underlying result set changes. Refresh/share of a
  filtered view therefore always restarts the list at page 1.

## Page-specific notes

- Debounce: free-text 300ms; category/brand toggles immediate. Result count announced
  `aria-live="polite"`.
- Result grid is a semantic list; cards keep the main-store card spec (1-line-clamped
  titles, `minmax(0,1fr)` columns, pinned CTA row).
- Verification: match mockup at 1312px (rail + chips row + 3-col grid); 390px = rail
  hidden, 2-up grid, full-width "See more", no horizontal scroll.
