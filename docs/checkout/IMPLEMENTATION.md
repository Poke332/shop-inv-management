# Checkout — Implementation

Phase P4. Visual/interaction source: `docs/checkout/design.md` + the 4-state mockup set
(`mockup.png` step1 / `mockup-step2-shipping.png` / `mockup-step3-payment.png` /
`mockup-receipt.png`). This page implements Sheet2's checkout use case in full — the
round-9 3-step wizard + receipt view is the locked design.

## Route

- Path: `/checkout` — roles: **buyer, logged in, cart ≥ 1 item** (route guard;
  otherwise → `/cart` (empty) or `/login` (anonymous)). Non-buyer → their ops home
  before content renders. **No deep-link entry** — arrival only via Cart "Proceed to
  checkout"; wizard state comes from Cart, so a fresh arrival with no wizard context
  bounces to `/cart`.

## Components

| Component | Responsibility |
|---|---|
| `CheckoutWizard` | The 3-step builder + receipt view (step 4): Personal info → Shipping address → Payment; owns step index, per-step form state, CTA enabling (active step valid AND ≥1 line AND no unresolved stock conflict), and the navigation stack (Continue 1→2→3, Back). Mobile ≤767px: single column, order panel dropped, fixed bottom CTA bar on step 3; progress labels hide ≤389px |
| `ProgressBar` | 3-segment indicator pinned above the form: 32px numbered circles + labels + 2px connecting track; active/done = `atomicTangerine-600` fill + white 14/600 digit, pending = `blueSlate-200` border + `blueSlate-500` digit; labels `blueSlate-700` 13/500 (active → `blueSlate-950` 13/600); `role="group"`, active step `aria-current="step"`; **receipt view shows all 3 segments done** |
| `PersonalInfoForm` | Step 1: name (required), phone (required, loose: digits/`+`, min 8 — assumption), email (required, loose format), note (optional); "Continue" only. Inline `strawberryRed-600` under-field errors on blur, `aria-describedby` |
| `ShippingForm` | Step 2: address (required, min ~20 chars), district / city / province (2-col grid) / postal code; "Back" + "Continue" |
| `PaymentMethod` | Step 3: radio-cards Card / Bank transfer / QRIS — 44px rows, border `blueSlate-200`, selected = `blueSlate-100` tint + radio dot `atomicTangerine-600` + 1px `blueSlate-200` border; method title `blueSlate-950` 14/500, subtitle `blueSlate-700` 13/400, icon `atomicTangerine-600`; per-method conditional inputs in a dashed `blueSlate-200` block on `blueSlate-50` (masked card number, bank VA number, QRIS placeholder); compact receipt block |
| `Receipt` | Step 4 (success): white 30% surface card (border `blueSlate-200`, radius 12px) — success check 26px circle `willowGreen-500` white tick, order number (#WB-####), item/qty/amount line-item table (header `blueSlate-50` bg + `blueSlate-700` 13/600; body rows name 14/500 `blueSlate-950` + amount 14/600 `atomicTangerine-600`), payment-method summary line, `pending` chip (`tuscanSun-100` bg / `blueSlate-900` 12/16 w600), "View my orders" CTA → `/orders`. **No "Place order" CTA on this view** |
| `OrderReview` | **Persistent** right panel (320px) at every step: 44×44 thumbs, names, qty × price lines, Subtotal + "Total (to be settled)*" (value 20/28 w600; "*payment TBD" hint 13/400 `blueSlate-700` — round-9 keeps the "to be settled" copy even though payment is designed; orders land `pending`), "Edit cart" secondary button (white fill, 1px `blueSlate-200` border, `blueSlate-950` label, hover `blueSlate-100`, 44px min) → `/cart` preserving state |
| `PlaceOrderButton` | Step-3-only CTA (desktop in the payment card + right panel; mobile in the fixed bottom bar): filled 44px `atomicTangerine-600/700/800` stack; loading keeps the 600 fill + spinner + "Placing order…" (`aria-busy`); disabled = `blueSlate-100`/`blueSlate-400` |

## Links

- Arrival: Cart "Proceed to checkout". "Edit cart" → `/cart` at every step (state
  preserved). Success → receipt view → "View my orders" → `/orders` (the sheet's
  redirect target; the new order appears at top with a `pending` chip).
- Failure states (alt-flows 3a/5a) **stay on Checkout — no navigation**.

## Data

- Lines/prices from `CartStore` (mock: P-231 ×1 @ 1.290.000 + P-198 ×1 @ 380.000 →
  subtotal 1.670.000). On submit: `mockApi.createOrder({ …, id: clientOrderId })` —
  client-generated id for idempotent retry (alt-flow 5a flag to backend-dev).
- **Alt-flow 3a (stock conflict):** page stays; conflicting lines get
  `strawberryRed-100` tint + `strawberryRed-300` border + note ("Only N left" / "Out of
  stock", `strawberryRed-600`, `aria-live="assertive"`), quantity clamped, CTA label →
  "Update quantities & retry". **No state change** — no order row, no stock moved.
- **Success:** order created `pending`, stock decremented (postcondition), **cart clears**
  (documented assumption: order placed = items consumed), receipt view renders.
- Future Express placeholders: `POST /orders` (validation first, 409 = stock conflict).

## Surviving state

- **Wizard step + all three form states must survive navigation within the flow**
  ("Edit cart" back-and-forth at any step returns to the same step with fields intact).
  They live in the wizard's component state (in-memory, above the routes) — not in the
  URL (deep-linking disallowed per the design doc) and not in the cart store (cart holds
  lines only). Leaving `/checkout` entirely drops the wizard (next arrival rebuilds
  from the cart, back at step 1).
- Cart survives as always (CartStore) until the successful order clears it.

## Page-specific notes

- Stock check on submit is the availability gate (Sheet2 basic flow); the UI shows only
  consequences (success = receipt; conflict = 3a; 5xx = 5a banner: full-width
  `strawberryRed-100` bg / `strawberryRed-700` text, "Something went wrong — your order
  was not placed." + Retry resubmits the same client order id).
- Inputs: 44px min height, 8px radius, 1px `blueSlate-200` border, placeholder
  `blueSlate-500`; labels 13/600 `blueSlate-950`; focus ring 2px `atomicTangerine-500`
  offset 2.
- a11y: progress `aria-current="step"`; stock-conflict note assertive; sticky mobile CTA
  focusable; all tap targets ≥ 44px.
- Verification: all 4 states must match their committed mockups (`mockup.png` = step 1
  with progress segment 1 active; step2 = segment 1 done + 2 active; step3 = 1-2 done +
  radio-cards + "Place order"; receipt = all done + no Place-order CTA + #WB-#### table
  + pending chip), at 1312px and 390px (bottom CTA bar on step 3).
