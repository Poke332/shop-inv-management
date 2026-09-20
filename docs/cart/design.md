# Page: Cart — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Order flow: **Cart → Checkout → Orders Placed** (locked by the sheet's checkout use case).

## FEATURES

- Buyer-only cart (matrix: "add product to cart" buyer T, all others F).
- Cart contents: image, name, unit price, quantity stepper, line total; order
  subtotal + "Proceed to checkout" (the sheet's "Buy/Checkout" CTA).
- **Cart persistence (open decision #3): TBD.** Most likely interpretation:
  **session-based** (survives navigation/refresh, cleared or kept on logout
  undecided; not synced across devices). The UI is persistence-agnostic — item
  counts come from the client state layer (`CartStore`), which the team will
  back with either session storage or `POST /cart` (high-level API assumption,
  undecided). If it later becomes user-persisted, nothing on this page changes
  except the store implementation.
- Quantity change re-validates stock (stock may have dropped since add):
  line clamps to available stock with a `strawberryRed` note "Only N available —
  quantity reduced".
- Remove item: trash icon per line; no undo in v1 (flagged assumption).
- Preconditions for checkout (from Sheet2): logged in (route guard) and
  **≥1 item** (route guard / CTA enable logic).

## LINKS / NAVIGATION

- Arrivals: Add-to-Cart toast "View cart", header cart badge.
- "Proceed to checkout" → Checkout (order-flow step 2).
- "Continue shopping" / card links → Product Details / Main Store.
- Empty cart: primary CTA → Main Store.

## VISUALIZATION

`TODO: request image generation —` "shopping cart page, white background, list of cart lines
with square thumbnails, quantity steppers and line totals, right-aligned summary panel with
subtotal and large warm orange 'Proceed to checkout' button, sharp borders, desktop 1440px"
— save to `docs/cart/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| LOGO  [ search bar................. ]   (cart:3)  (account)      |
+------------------------------------------------------------------+
| CART (3)                                                         |
| +--------------------------------------------------------+ ------|
| | [img]  Widget A — Rp 45.000   [ - 2 + ]  Rp 90.000  [x] |      |
| | [img]  Widget B — Rp 30.000   [ - 1 + ]  Rp 30.000  [x] |      |
| +--------------------------------------------------------+ ------|
| Summary panel (right col ≥768px):                              |
|   Subtotal   Rp 120.000                                       |
|   (payment/total TBD — see §FEATURES)                          |
|   [ Proceed to checkout → ]  (primary, full width)            |
|   Continue shopping                                             |
+------------------------------------------------------------------+
```

Mobile (<768px): summary collapses to a sticky bottom bar: "Subtotal · [Checkout]" —
the primary CTA must be reachable without scrolling on 390px.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / line border | `#FFFFFF` / `blueSlate-200` |
| Product name / line total | `blueSlate-950` |
| Unit price | `blueSlate-700` |
| Quantity stepper | `blueSlate-200` border; disabled side `blueSlate-100`/`blueSlate-500` |
| Remove (×) icon | `blueSlate-500` → hover `strawberryRed-600` |
| Stock-clamp note | `strawberryRed-600` |
| Summary panel bg / border | `blueSlate-50` / `blueSlate-200` |
| Subtotal label / value | `blueSlate-700` / `blueSlate-950` (value 20px) |
| "Proceed to checkout" | `atomicTangerine-500` → `atomicTangerine-600` hover, white label |
| "Continue shopping" link | `atomicTangerine-600` |
| Empty-cart icon + heading | `blueSlate-300` icon, `blueSlate-950` heading, helper `blueSlate-700` |

## INTERACTIONS

(React: `CartPage`, `CartLine`, `QuantityStepper` (shared with Product Details),
`CartSummary`.)

- **Idle:** lines render in insertion order (assumption — most natural).
- **Quantity:** `POST /cart/items/:id/qty` (assumption); stepper max = current stock
  (fetched per line); at 1 the "−" disables.
- **Remove:** line animates out; subtotal updates; header badge updates.
- **Stock clamp:** if server returns reduced qty → line shows `strawberryRed` note;
  stepper max lowered.
- **Empty state:** "Your cart is empty" + `blueSlate-300` outline cart icon +
  "Start shopping" button (`atomicTangerine-500`).
- **Checkout CTA enabling:** enabled only when ≥1 line AND no unresolved stock
  conflict; empty → CTA removed (see empty state).
- **Loading:** line skeletons; summary values show "…" placeholders.
- **Error:** per-line retry link (`strawberryRed-600`) on quantity/remove failure;
  page-level `strawberryRed` panel on cart load 5xx.
- **Role-based visibility:** staff/manager/admin have no route to this page
  (matrix F). If mis-routed → redirect to their dashboard.
- **a11y:** each line a list item with name + total exposed; stepper buttons
  labeled "Decrease/increase quantity for X"; badge count via `aria-label`.
