# Page: Main Store — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Storefront page (buyer home). Shared shell: `StorefrontHeader` + `ProductCard` (defined here,
reused on Search/Browse and Product Details list contexts).
Typography & spacing per `docs/design-tokens-round3.md` (Inter 400/500/600, 8pt grid,
unified pill badges, filled CTA stack).

## FEATURES

- Logged-in **buyer** home: single catalog grid; featured items appear in the same
  "Shop All" grid, marked only by the top-right "Featured" pill on their tile —
  there is **no separate featured strip** in round 3.
- **Role-gating note (sheet inconsistency, open decision #8):** the matrix grants
  "browse product" to buyer only, but "view product details" T for all roles and the
  implementation notes say the catalog page is "buyer & staff only". **TBD.** Most likely
  interpretation used here: storefront is buyer-only; staff/manager/admin never land on it —
  they post-login-route to ops pages. If the team decides staff may browse, the only change
  is the route guard (`buyer | staff`); layout is unchanged.
- Featured items: the "featured" flag lives on the product record (assumption — sheet says
  "catalog + featured items" without mechanics; most likely a flag set by manager/admin via
  Per Product Dashboard). Round 3 renders no dedicated strip: featured products sit in the
  single "Shop All" grid and carry the top-right `Featured` pill (`tuscanSun-500` fill,
  `blueSlate-950` text, 1px `tuscanSun-600` border).
- Every card links to Product Details; "Add to Cart" is a card action (matrix: buyer-only).
  **Sale badge (color-tokens §3):** when a product carries an active discount, the card
  shows a "−X%" / "On sale" badge — `strawberryRed-600` fill, white label, top-left.
  Badge data (sale flag + discount) comes from the product record; sale-flag mechanics are
  **TBD** (no sheet basis — most likely a manager/admin flag, consistent with the
  featured-flag assumption above).
- Infinite scroll or pagination — **TBD** (assume a "See more" load-more button for v1,
  simplest: filled 44px primary button centered under the grid; when the list is
  exhausted it is replaced by a 13px/400 `blueSlate-700` centered line
  "All N products shown" — not a disabled-looking button).
- Empty catalog state: message + icon (relevant for early launch; also the "no products in
  this view" fallback).

## LINKS / NAVIGATION

- `StorefrontHeader`: logo → Main Store; search input → Search/Browse (pre-filled query);
  cart icon → Cart (badge = item count); account menu → (buyer) Orders Placed, Logout.
  Staff+ are not expected here (see role-gating above); if present via mis-route, they see
  the catalog read-only with no cart/Cart link.
- Card → Product Details.
- No order flow starts here; cart → Checkout → Orders Placed is documented in the Cart/Checkout docs.

## VISUALIZATION

![Main store homepage mockup](mockup.png)


ASCII wireframe (desktop, ≥1024px):

```
+------------------------------------------------------------------ +
| Sunset Electronics [ pill search 44px min.... ]   (cart:3) (acct) |
+------------------------------------------------------------------+
| Shop                                                            |
| Shop All                                                        |
| +--------+ +--------+ +--------+ +--------+                      |
| | [tile] | | [tile] | | [tile] | [tile] |  grid4, 32px gutter  |
| |Sony C710| |Anker PB| |Logi MX | |Razer V3|                    |
| |Rp1.29jt| |Rp380k  | |Rp415jt| |Rp240k |  15/24 1-line titles |
| | (+)   | | (+)    | | (+)   | | (+)    |  add-to-cart 44px    |
| +--------+ +--------+ +--------+ +--------+                      |
| ... (single grid; featured items inline, top-right pill only)    |
|                        [ See more ]  (filled, 320px, 44px min)   |
+------------------------------------------------------------------+
```

Mobile (<768px): header wraps — logo left, cart + account right, search drops to its own
line below (44px min); grid 3-up at 768–1023px, 2-up at 390–767px (24px gutter), 1-up at
<390px; "See more" becomes full-width. When exhausted: centered 13/400 `blueSlate-700`
"All N products shown" line replaces the button.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas | `#FFFFFF` |
| Header (56px) bg / border | `#FFFFFF` / `blueSlate-200` |
| Logo | `blueSlate-950` 17/600, "Electronics" accent span `atomicTangerine-500` |
| H1 "Shop" | `blueSlate-950` 26/36 w600 |
| Section label "Shop All" | `blueSlate-950` 16/24 w600, letter-spacing .05em, sentence case |
| Card: bg / border / hover border | `#FFFFFF` / `blueSlate-200` / `atomicTangerine-400` |
| Card title | `blueSlate-950` 15/24 w600, 1-line clamped + ellipsis |
| Card subline (feature · category · brand) | `blueSlate-700` 13/400 |
| Card price | `atomicTangerine-600` 14/20 w600 |
| Strike price (sale original) | `blueSlate-600` 13/400, line-through |
| "On sale" pill | `strawberryRed-600` fill, white label, top-left (color-tokens §3) |
| "Featured" pill | `tuscanSun-500` fill, `blueSlate-950` label, 1px `tuscanSun-600` border, top-right |
| "Only N left" pill | `carrotOrange-500` fill, `blueSlate-950` label, 1px `carrotOrange-600` border, bottom-left |
| "Out of stock" pill | `strawberryRed-100` bg, `strawberryRed-700` label; tile at opacity .4 |
| Product tile | 4:3, 135° category-keyed gradient (Audio `tuscanSun-50→400`, Smart Home `seagrass-50→400`, Gaming `atomicTangerine-50→400`, Laptops & PC `blueSlate-50→400`, Accessories `carrotOrange-50→400`, Wearables `strawberryRed-50→400`); single 40px stroke-1.5 `blueSlate-900` line glyph, decorative (`aria-hidden`) |
| Add-to-cart | 44×44 circular filled `atomicTangerine-600`, white plus glyph → hover `-700` → active `-800`; disabled = `blueSlate-100` bg + `blueSlate-400` glyph |
| Cart badge | `atomicTangerine-500` bg, white 12/600 number (**TBD: open decision #3**, cart color accents) |
| "See more" (load more) | filled 44px primary button, 320px wide desktop / full-width mobile; when exhausted → 13/400 `blueSlate-700` centered "All N products shown" line, not a disabled button |

## INTERACTIONS

(React: `StorefrontHeader`, `ProductCard`, `ProductGrid`, `CartIcon`.)

- **Idle:** cards static, 32px gutters desktop / 24px mobile (section rhythm 48px / 40px);
  equal card height per row (`min-height` 300px, CTA row pinned to the card bottom).
- **Hover (card):** border → `atomicTangerine-400`, subtle 2px lift; no layout shift.
- **Add to Cart:** optimistic — badge count increments, button flashes `willowGreen-500`
  check for ~600ms. On API failure (e.g. stock just ran out, high-level `POST /cart/items`)
  → toast `strawberryRed-600` "Couldn't add to cart — stock changed. Reload." Card flips to
  out-of-stock state.
- **Loading:** grid skeletons (`blueSlate-100` blocks matching tile/title/price/CTA shape,
  **static — no shimmer**) while `GET /products` in flight; `prefers-reduced-motion` kills
  all transitions.
- **Empty:** centered illustration-free state: "No products yet" + `blueSlate-700` helper
  line + one primary CTA (buyer sees this only at launch).
- **Error (API 5xx):** inline panel `strawberryRed-100` bg, `strawberryRed-700` text, with
  "Try again" filled button (`strawberryRed-600` fill, white label).
- **Stock state on cards:** `stock === 0` → tile at 40% opacity + "Out of stock" pill
  (`strawberryRed-100` bg, `strawberryRed-700` text) and add-to-cart disabled
  (`blueSlate-100` bg, `blueSlate-400` glyph, `aria-disabled`).
  Stock 1–5 → "Only N left" pill, bottom-left (`carrotOrange-500` fill, `blueSlate-950`
  text, 1px `carrotOrange-600` border) — urgency cue, assumes stock is exposed publicly —
  most likely interpretation.
- **Role-based visibility:** staff/manager/admin hitting this route (if allowed per TBD
  above) see read-only cards: no Add-to-Cart button, no cart badge in header.
- **Keyboard/a11y:** cards focusable (focus ring 2px `atomicTangerine-500`, offset 2);
  add-to-cart is a real `<button aria-label="Add <name> to cart">`; touch targets ≥ 44×44px.
