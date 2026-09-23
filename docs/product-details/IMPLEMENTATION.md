# Product Details — Implementation

Phase P3. Visual/interaction source: `docs/product-details/design.md` + mockup. The one
storefront page all 4 roles open — buyer variant (default) and variant B (staff/manager/
admin, read-only).

## Route

- Path: `/products/:id` — roles: **all 4** ("view product details" T for every role).
  Non-buyers render variant B (no purchase CTA of any kind — "purchase product" F in the
  matrix; no cart badge in the header either).
- Arrival: main-store / search-browse card, direct deep-link, orders-placed line link,
  or the "Manage stock →" / "Review panel →" links from variant B.

## Components

| Component | Responsibility |
|---|---|
| `ProductDetail` | Page: back link (history-aware, falls back to `/`), hero-info split (media 440px column, gap 32 → 24 mobile, stacks <768), Specs / Description / Reviews blocks (section rhythm 40px, labels 16/24 w600 sentence case) |
| `ProductImageGallery` | Hero tile (4:3, category-keyed gradient with glyph, badges: "On sale" top-left `strawberryRed-600` white, "Featured" top-right `tuscanSun-500`/`blueSlate-950` + 1px `tuscanSun-600` border) + 84×64 thumbnails, active ring 2px `atomicTangerine-500`; swap announces via `aria-live` |
| `QuantityStepper` | Shared with Cart: 44px cells, 8px radius, `blueSlate-200` border; min 1, **max = stock** ("+" disabled at max: `blueSlate-100` bg + `blueSlate-500` glyph) |
| `AddToCartButton` | Filled 44px primary stack; out of stock → replaced by disabled "Out of stock" (`strawberryRed-700` on `strawberryRed-100`, `cursor-not-allowed`); optimistic add → `willowGreen` toast "Added — View cart" (action → `/cart`); failure → `strawberryRed` toast + stock line refetched (quantity clamped) |
| `SpecsTable` | The round-9 spec table: 2-col key/value grid, 1px `blueSlate-200` borders, 10px radius; P-231 = Model `WF-C710N` / Bluetooth `5.3, multipoint` / Battery `13 h w/ case` / ANC `yes` / IP rating `IPX4` / Weight `5.4 g per bud` (fields are product-record data — spec pairs, ordered) |
| `ReviewList` | **Public reviews only** (round-6 auto-approve): description + rating + optional seller-comment block (indented 16px, left border 2px `blueSlate-200`, "Seller" label 13/600, body 14/22 w400, date `blueSlate-500` 13/400; absent when no comment — no placeholder). **Hidden reviews never render** (no description, no stars) but the section count includes them: "Reviews (128)" = 122 public + 6 hidden. Average assumes hidden stars still count (TBD — built data-layer-first so flipping it is not a layout change) |
| `StarRating` | Scale-agnostic (`value`, `count`, `readOnly`, `onRate`); v1 = 1–5, half-star display, "4.3 / 5 (128)"; filled `tuscanSun-500` / empty `tuscanSun-200` (TBD marker per design doc) |

## Links

- In-page: back → last catalog page (history fallback `/`); "View cart" toast → `/cart`.
- Variant B extra links on the stock line: "Manage stock →" → `/ops/products/:id/edit`
  (manager/admin) or Ongoing Orders (staff); "Review panel →" →
  `/ops/reviews?product=<id>` (manager/admin only).
- No review submission here (the form lives on Orders Placed — open decision #9 as
  resolved in the round-6 docs; if flipped, only `ReviewList`'s placement moves).

## Data

- `mockApi.getProduct("P-231")` → P-231 Sony WF-C710N: Rp 1.290.000, strike
  Rp 1.518.000 (−15%), stock 34 ("In stock · 34 left"), 6 spec pairs, description text
  from the mockup ("Active noise cancellation … IPX4 …").
- `mockApi.getProductReviews("P-231")` → public-only list (122 rows; the mockup samples:
  buyer_102 4★ "Solid build, ANC keeps up on the train…" 12 Sep 2026, purchased
  P-231 ×1, seller comment "Thanks — firmware 2.1 improved ANC." 14 Sep) + the
  hidden-inclusive total 128 and average 4.3.
- Stock line states: in-stock `willowGreen-600`; 1–5 = "Only N left" (`willowGreen-600`
  text, urgency cue); 0 = `strawberryRed-700` on `strawberryRed-100` pill + tile
  `opacity .4` (exact number public for buyers — documented assumption, threshold 5).

## Surviving state

- Cart survives (CartStore) — the add-to-cart path. Page-local state (selected
  thumbnail, quantity) resets on navigation; the quantity chosen here seeds the cart
  line, not the reverse.

## Page-specific notes

- Sale marking: struck original price next to the current price + "−15%" chip
  (`strawberryRed-100` bg, `strawberryRed-700` label) — price 24/32 w600
  `atomicTangerine-600` in the hero-info column (display size on this page; card-level
  prices elsewhere stay 14/20).
- a11y: stock line `aria-live="polite"`; stars `aria-label="Rated 4.3 out of 5, 128
  reviews"`; focus ring 2px `atomicTangerine-500` offset 2; all tap targets ≥ 44px.
- Variant B removes: Add to Cart, quantity stepper, cart badge — everything else
  identical (public review list incl. count, no approve/deny affordance in any role).
- Verification: match mockup (hero + specs + description + one public review with seller
  comment) at 1312px; mobile stacks media on top, 24px gap, no horizontal scroll at 390px.
