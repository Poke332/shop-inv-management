# Cart — Implementation

Phase P4. Visual/interaction source: `docs/cart/design.md` + mockup. Order-flow step 2:
**Cart → Checkout → Orders Placed** (locked by Sheet2).

## Route

- Path: `/cart` — roles: **buyer, logged in** (preconditions from Sheet2: logged in +
  ≥1 item; route guard redirects anonymous → `/login`, non-buyer → their ops home,
  empty cart → the in-page empty state, not a redirect).

## Components

| Component | Responsibility |
|---|---|
| `CartPage` | Page: "Cart (N items)" h1 + `(meta)`, lines card (left, flex:1) + summary panel (right, 320px, `blueSlate-50` fill per mockup / `#FFFFFF` 30% surface per round-8 §12 — the cart item rows are the governed surface group #1) |
| `CartLine` | 84×84 gradient tile + name (15/24 w600 `blueSlate-950`) + muted unit price (`blueSlate-700` 13/400) + subline ("Wireless Earbuds · Audio · Sony" / "20 000 mAh · USB-C PD 140 W") + quantity stepper + line total (`atomicTangerine-600` 14/20 w600) + trash icon button (44×44, `blueSlate-500` glyph → hover `strawberryRed-600`, `aria-label="Remove <name> from cart"`); low-stock line hint "Low · 5 left" (`carrotOrange-600` 13/400); lines in insertion order, row rhythm 24px, 1px `blueSlate-200` dividers |
| `QuantityStepper` | Shared with Product Details: max = current stock (fetched per line); at 1 the "−" disables (`blueSlate-100`/`blueSlate-500`); a server-reduced qty shows the clamp note "Only N available — quantity reduced" in `strawberryRed-600` and lowers the max |
| `CartSummary` | "Subtotal" 13/400 `blueSlate-700` + value 20/28 w600 `blueSlate-950` (mock: **Rp 1.670.000** = P-231 ×1 @ 1.290.000 + P-198 ×1 @ 380.000); payment meta line (corrected copy, round-9): **"Payment is chosen at checkout — your order settles as pending, 'to be settled'."** 13/400 `blueSlate-700` (payment method is captured in checkout step 3 and recorded on the order; v1 moves no funds, so orders land `pending` "Total (to be settled)" — no gateway, a human settles the order later; see `docs/checkout/IMPLEMENTATION.md` + PRD Non-goals); "Proceed to checkout →" filled 44px primary (enabled only when ≥1 line AND no unresolved stock conflict; disabled = `blueSlate-100` bg + `blueSlate-400` label; empty → CTA removed, see empty state); "Continue shopping" link → `/` |

## Links

- Arrival: Add-to-Cart toast "View cart" (from Product Details), header cart badge.
- "Proceed to checkout" → `/checkout` (state comes from Cart — deep-linking `/checkout`
  directly is not allowed; the guard bounces to `/cart`). "Continue shopping" / card
  links → `/` (Product Details by card). Empty state CTA "Start shopping" → `/`.

## Data

- Cart lines come from `CartStore` (client state, session-based per open decision #3's
  documented assumption — persistence-agnostic UI; swapping to `POST /cart` later
  changes nothing on this page). Mock session: P-231 Sony WF-C710N ×1 @ Rp 1.290.000
  + P-198 Anker 735 Power Bank ×1 @ Rp 380.000 ("Low · 5 left").
- Per-line stock re-validation: `mockApi` returns available stock; line clamps to it.
- Future Express placeholders (ARCHITECTURE §4.3): `POST /cart/items`,
  `POST /cart/items/:id/qty`, `DELETE /cart/items/:id`.

## Surviving state

- **The cart is the surviving state of the whole order flow** — `CartStore` lives in
  Context + session storage: survives navigation across every storefront route, refresh,
  and logout (undecided keep/clear-on-logout — session storage keeps it; nothing on the
  page changes if the team later backs it with a server cart).
- Subtotal, line counts, and the header badge are all derived from it — single source.

## Page-specific notes

- **Mobile (<768px): the summary collapses to a sticky bottom bar** — "Subtotal ·
  [Checkout]"; the primary CTA must be reachable without scrolling at 390px.
- Remove: line animates out (color-only when `prefers-reduced-motion`); subtotal +
  badge update in the same render.
- Loading: static line skeletons (`blueSlate-100`, no shimmer); summary values "…"
  placeholders. Error: per-line retry link (`strawberryRed-600`) on qty/remove
  failure; page-load 5xx = `strawberryRed-100`/`-700` panel.
- a11y: each line is a list item exposing name + total; stepper buttons
  "Decrease/increase quantity for <name>"; badge count via `aria-label`; focus ring
  2px `atomicTangerine-500` offset 2.
- Verification: match mockup at 1312px (2-line card + 320px blueSlate-50 panel,
  Rp 1.670.000); 390px = sticky bottom bar visible without scroll.
