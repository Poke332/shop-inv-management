# Page: Main Store — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Storefront page (buyer home). Shared shell: `StorefrontHeader` + `ProductCard` (defined here,
reused on Search/Browse and Product Details list contexts).

## FEATURES

- Logged-in **buyer** home: catalog grid + featured items strip.
- **Role-gating note (sheet inconsistency, open decision #8):** the matrix grants
  "browse product" to buyer only, but "view product details" T for all roles and the
  implementation notes say the catalog page is "buyer & staff only". **TBD.** Most likely
  interpretation used here: storefront is buyer-only; staff/manager/admin never land on it —
  they post-login-route to ops pages. If the team decides staff may browse, the only change
  is the route guard (`buyer | staff`); layout is unchanged.
- Featured items: up to 4 "featured" products pinned in a strip above the grid (assumption —
  sheet says "catalog + featured items" without mechanics; most likely a flag on the product
  record set by manager/admin via Per Product Dashboard).
- Every card links to Product Details; "Add to Cart" is a card action (matrix: buyer-only).
- Infinite scroll or pagination — **TBD** (assume a "Load more" button for v1, simplest).
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

`TODO: request image generation —` "clean e-commerce homepage, white background, top nav bar with
search, featured strip of 4 product cards, product grid of cards with warm sunset accent tags,
sharp borders, generous whitespace, desktop 1440px" — save to `docs/main-store/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| LOGO  [ search bar................. ]   (cart:3)  (account)      |
+------------------------------------------------------------------+
| FEATURED                                                         |
| +--------+ +--------+ +--------+ +--------+                      |
| | card   | | card   | | card   | | card   |                      |
| +--------+ +--------+ +--------+ +--------+                      |
+------------------------------------------------------------------+
| SHOP ALL                                                         |
| +--------+ +--------+ +--------+ +--------+ +--------+            |
| | [img]  | | [img]  | | [img]  | | [img]  | | [img]  |  …        |
| | Name   | | Name   | | Name   | | Name   | | Name   |            |
| | Rp X   | | Rp X   | | Rp X   | | Rp X   | | Rp X   |            |
| | [+cart]| | [+cart]| | [+cart]| | [+cart]| | [+cart]|            |
| +--------+ +--------+ +--------+ +--------+ +--------+            |
| [ Load more ]                                                    |
+------------------------------------------------------------------+
```

Mobile (<768px): header collapses (hamburger + search row below), grid 2-up at ≥390px, 1-up
at <390px; featured strip horizontal-scroll snap.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas | `#FFFFFF` |
| Header bg / border | `#FFFFFF` / `blueSlate-200` |
| Section headings | `blueSlate-950` |
| Card bg / border / hover border | `#FFFFFF` / `blueSlate-200` / `atomicTangerine-400` |
| Card price text | `carrotOrange-600` |
| "Featured" tag | `tuscanSun-500` bg, `blueSlate-950` label |
| Add-to-cart icon button | `blueSlate-950` icon on `blueSlate-100` circle → hover `atomicTangerine-500` bg, white icon |
| Cart badge | `atomicTangerine-500` bg, white number |
| Out-of-stock card | image at 40% opacity, label `strawberryRed-600` |
| "Load more" button | ghost: `blueSlate-200` border, `blueSlate-950` text; hover bg `blueSlate-50` |

## INTERACTIONS

(React: `StorefrontHeader`, `ProductCard`, `FeaturedStrip`, `ProductGrid`, `CartIcon`.)

- **Idle:** cards static, 12px gap, equal height per row.
- **Hover (card):** border → `atomicTangerine-400`, subtle 2px lift; no layout shift.
- **Add to Cart:** optimistic — badge count increments, button flashes `willowGreen-500`
  check for ~600ms. On API failure (e.g. stock just ran out, high-level `POST /cart/items`)
  → toast `strawberryRed-600` "Couldn't add to cart — stock changed. Reload." Card flips to
  out-of-stock state.
- **Loading:** grid skeletons (`blueSlate-100` blocks) while `GET /products` in flight;
  featured strip skeletons the same.
- **Empty:** centered illustration-free state: "No products yet" + `blueSlate-700` helper line
  (buyer sees this only at launch).
- **Error (API 5xx):** inline panel `strawberryRed-100` bg with "Try again" button
  (`strawberryRed-600` label).
- **Stock state on cards:** `stock === 0` → card shows "Out of stock" (`strawberryRed-600`)
  and Add-to-Cart is disabled (`blueSlate-200` bg, `blueSlate-500` icon, `aria-disabled`).
  Stock 1–5 → "Only N left" hint in `strawberryRed-600` (urgency cue, assumes stock is
  exposed publicly — most likely interpretation).
- **Role-based visibility:** staff/manager/admin hitting this route (if allowed per TBD
  above) see read-only cards: no Add-to-Cart button, no cart badge in header.
- **Keyboard/a11y:** cards focusable (focus ring `atomicTangerine-500`); add-to-cart is a
  real `<button aria-label="Add <name> to cart">`; featured strip scroll buttons are
  keyboard-reachable.
