# Page: Checkout — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Order flow: **Cart → Checkout → Orders Placed**. This page implements the sheet's
checkout use case (Sheet2) in full.

## FEATURES

- Buyer-only (matrix: purchase/add-to-cart F for staff+). Preconditions: logged in
  + cart ≥1 item (route guard; otherwise redirect to Cart / Main Store).
- Step layout (single-page stepper, no multi-page wizard — most likely v1):
  1. **Shipping address** (name, phone, address — assumed minimum set; flagged).
  2. **Order review** (line list, read-only, from cart).
  3. **Place order** (primary CTA).
- **Payment model (open decision #4): TBD.** The sheet defines **no payment at all** —
  no gateway, no currency even; orders just sit "pending". Most likely interpretation
  for v1 UI: **no payment step**; CTA label is "Place order" not "Pay now", and the
  summary shows "Total (to be settled)" — i.e. payment-agnostic. Design keeps a
  clearly marked `PaymentSlot` placeholder component so a gateway can slot in
  later without re-laying the page. **Do not add payment UI in v1.**
- **Stock check + decrement (locked + open decision #5):** on submit the system
  checks availability & stock first (Sheet2 basic flow). Decrement semantics
  (automatic vs manager-manual) are **TBD** — the UI shows only the consequences:
  success = order created `pending`; stock-out = alt-flow 3a (below).
- **Order created with status `pending`** (locked), stock validated; on success
  stock decremented (sheet postcondition). Buyer is read-only afterwards
  (PATCH is staff+ only).
- Alt flow 3a — out of stock on submit: error message, checkout cancelled,
  **no state change**; the conflicting line is highlighted, quantity clamped,
  user can edit (go back to Cart) or retry.
- Alt flow 5a — connection failure: failure notification, **retry** affordance;
  idempotency concern flagged (do not create a duplicate order on retry —
  high-level API assumption: client-generated order id).

## LINKS / NAVIGATION

- Arrival: Cart "Proceed to checkout". No other entry (deep-linking not allowed —
  guarded route; state comes from Cart).
- "Edit cart" → Cart (preserves state).
- Success → **Orders Placed** (confirmation; the sheet's redirect target).
- Failure states stay on Checkout (no navigation).

## VISUALIZATION

`TODO: request image generation —` "checkout page, white background, two-column layout: left
shipping address form with sharp 1px border inputs, right order summary panel listing
items and total with large warm orange 'Place order' button, subtle pending-status
note, clean sans-serif, desktop 1440px" — save to `docs/checkout/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| LOGO  [ search bar................. ]   (cart:2)  (account)      |
+------------------------------------------------------------------+
| CHECKOUT                                                         |
| +-----------------------------------+---------------------------+|
| | 1. Shipping address              | Order review              ||
| | Name   [____________________]     | [img] Widget A x2 90.000 ||
| | Phone  [____________________]     | [img] Widget B x1 30.000 ||
| | Address[____________________]     | Subtotal    120.000      ||
| |      (textarea, 3 lines)          | Total (to settle)* 120.000||
| +-----------------------------------+  *payment TBD            ||
| +-----------------------------------+  [ Place order ]  (primary)||
| | 2. Review your order             |  Edit cart                ||
| | (line list, read-only)           |---------------------------+|
| +-----------------------------------+                            |
+------------------------------------------------------------------+
```

Mobile: single column, order summary first (collapsible, default open on first
load), sticky bottom bar with "Place order" + total on 390px.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / form border | `#FFFFFF` / `blueSlate-200` |
| Section step numbers | `atomicTangerine-500` circles, white text |
| Labels / input text | `blueSlate-950` / placeholder `blueSlate-500` |
| Input focus ring | `atomicTangerine-500` |
| Order review line borders | `blueSlate-200` |
| Total row | `blueSlate-950` 20px; "to be settled" hint `blueSlate-700` |
| "Place order" CTA | `atomicTangerine-500` → `atomicTangerine-600` hover; loading keeps 500 with spinner |
| Alt-flow 3a conflicting line | `strawberryRed-100` bg tint, border `strawberryRed-300`, note `strawberryRed-600` |
| Alt-flow 5a banner | `strawberryRed-100` bg, `strawberryRed-600` text, retry link `strawberryRed-600` underlined |
| Success (redirects anyway) | `willowGreen-100` bg + `willowGreen-600` text if a brief flash needed |

## INTERACTIONS

(React: `CheckoutPage`, `ShippingForm`, `OrderReview`, `PlaceOrderButton`, `PaymentSlot`.)

- **Form validation (Shipping):** name required; phone required + loose format
  check (digits/`+`, min 8 — assumption); address required, min ~20 chars.
  Inline `strawberryRed-600` under field on blur; CTA blocked until valid.
- **CTA enabling:** valid address AND ≥1 cart line AND no unresolved stock
  conflict. **Loading:** spinner + "Placing order…", inputs + CTA locked.
- **Alt flow 3a (out of stock, `POST /orders` returns stock conflict):**
  page stays; conflicting lines get the `strawberryRed-100` tint + a note
  "Only N left" or "Out of stock"; CTA label → "Update quantities & retry";
  no state changed (no order row, no stock moved).
- **Alt flow 5a (5xx / network):** full-width banner, "Something went wrong —
  your order was not placed." + Retry (resubmits with the same client order id
  — idempotency assumption, flagged to backend-dev).
- **Success:** redirect to Orders Placed; the new order appears at top,
  `pending` chip (`tuscanSun-100` bg per color-tokens §3). Cart clears
  (assumption — most likely: order placed = items consumed; flagged).
- **Role-based visibility:** any non-buyer → redirect to their dashboard
  before content renders (guard at route level).
- **a11y:** errors `aria-describedby`; stock-conflict note `aria-live="assertive"`;
  sticky CTA focusable on mobile.
