# Page: Checkout — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Order flow: **Cart → Checkout → Orders Placed**. This page implements the sheet's
checkout use case (Sheet2) in full.
Typography & spacing per `docs/design-tokens-round3.md` (Roboto 400/500/600, 8pt grid,
unified pill badges, filled CTA stack).

## FEATURES

- Buyer-only (matrix: purchase/add-to-cart F for staff+). Preconditions: logged in
  + cart ≥1 item (route guard; otherwise redirect to Cart / Main Store).
- Step layout: **3-step wizard** (Personal info → Shipping address → Payment) with a
  final **receipt confirmation view** (step 4) shown on success; the persistent
  **Order review** panel stays on the right at every step. A 3-segment **progress bar**
  (numbered circles + labels + connecting track) is pinned above the form, active
  segment filled `atomicTangerine-600`.
  1. **Personal info** — name, phone, email, note (optional). CTA "Continue".
  2. **Shipping address** — address, district, city, province, postal code.
     CTAs "Back" + "Continue".
  3. **Payment** — method radio-cards (Card / Bank transfer / QRIS, 44px rows,
     selected = `blueSlate-200` border + `blueSlate-100` tint, radio dot
     `atomicTangerine-600`), per-method conditional inputs (masked card, bank-VA
     number, QRIS placeholder), compact receipt block. **"Place order" is the ONLY
     CTA on this step.**
  4. **Receipt** (success) — order number + receipt line-item table (item / qty /
     amount + total) + payment-method summary line + `pending` chip + a "View my
     orders" CTA → Orders Placed. Progress bar shows all 3 segments done; **no
     "Place order" CTA** on this view.
- **Domain examples (electronics):** order lines show model + category context,
  e.g. "Sony WF-C710N Wireless Earbuds ×1" / "Anker 735 Power Bank ×1"; shipping
  form copy can mention electronics (fragile-item / packaging note optional —
  assumption, not required by the sheet).
- **intended-redesign: round-9 user decision — the 3-step wizard (Personal info /
  Shipping / Payment) + receipt confirmation view replaces the single-page two-panel
  layout, and the payment step (Card / Bank transfer / QRIS) replaces the
  payment-agnostic v1 placeholder (resolves open decision #4).** Payment is now
  designed: a method picker (radio-cards) with per-method conditional inputs and a
  compact receipt block; on success the receipt view confirms the order. Orders still
  land `pending` with "Total (to be settled)" copy kept; the "Place order" CTA
  appears only on the Payment step (desktop in the payment card + right order panel,
  mobile in a fixed bottom CTA bar that drops the order panel). The old `PaymentSlot`
  placeholder is now the step-3 payment card (gating, not a blank slot).
- **Stock check + decrement (locked + open decision #5):** on submit the system
  checks availability & stock first (Sheet2 basic flow). Decrement semantics
  (automatic vs manager-manual) are **TBD** — the UI shows only the consequences:
  success = order created `pending` (receipt view); stock-out = alt-flow 3a (below).
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
- "Edit cart" → Cart (preserves state), reachable at every wizard step.
- Wizard navigation: "Continue" advances (1→2→3), "Back" returns; each step is
  independent (the progress bar reflects the current step; on the receipt view all
  segments read done).
- Success → **receipt confirmation view** (step 4, same builder) with a "View my
  orders" CTA → **Orders Placed** (confirmation; the sheet's redirect target).
- Failure states stay on Checkout (no navigation).

## VISUALIZATION

![Checkout step 1 — Personal info](mockup.png)

Capture set (rendered from the committed generator by `_mockup-build/capture_checkout.py`,
headless Chromium @ 1312×736 — card t_a43ae60e):

| file | state |
|---|---|
| `mockup.png` | step 1 — Personal info (progress segment 1 active) |
| `mockup-step2-shipping.png` | step 2 — Shipping address (segment 1 done, 2 active) |
| `mockup-step3-payment.png` | step 3 — Payment (segments 1-2 done, radio-cards + "Place order") |
| `mockup-receipt.png` | step 4 — receipt confirmation (all segments done; no "Place order" CTA) |

> `mockup.png` is the step-1 render, from `_mockup-build/out/checkout.html` via headless
> Chromium. `mockup-receipt.png` is the only one with the receipt view (order number,
> line-item table, payment-method line, `pending` chip, "View my orders").

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| Sunset Electronics [ search........ ]  (cart:2)  (account)       |
+------------------------------------------------------------------+
| Checkout                                                         |
| (1) Personal info --- (2) Shipping address --- (3) Payment      |
|   progress bar: 32px numbered circles + labels + 2px track,     |
|   active/done = atomicTangerine-600 fill, pending = blueSlate   |
| +-----------------------------------------+ +-----------------+ |
| | 1 Personal information                | | Order review    | |
| | Name    [__________________________]   | | [44px] Sony C710| |
| | Phone   [__________________________]   | |         x1 Rp1.29| |
| | Email   [__________________________]   | | [44px] Anker PB | |
| | Note    [__________________________]   | | Subtotal  Rp1.67| |
| |                    [ Continue ]        | | Total*    Rp1.67| |
| +-----------------------------------------+ | [ Edit cart ]   | |
| step 2: Address + 2-col grid (District/     |                  | |
|   City / Province / Postal code) +          |                  | |
|   Back + Continue.                          |                  | |
| step 3: Payment method radio-cards          |                  | |
|   (Card / Bank transfer / QRIS, 44px rows, |                  | |
|   selected = blueSlate-200 border +         |                  | |
|   blueSlate-100 tint, dot atomicTangerine)  |                  | |
|   + per-method inputs + compact receipt +   |                  | |
|   Back + "Place order" (ONLY here).         |                  | |
| step 4: receipt view — green check +       |                  | |
|   order number (#WB-####) + Item/Qty/       |                  | |
|   Amount table + payment-method line +      |                  | |
|   "pending" chip + "View my orders".        |                  | |
+------------------------------------------------------------------+
```

Mobile: single column; the order-review panel drops (≤767px) and a fixed bottom
CTA bar ("Place order" + total) takes over on step 3. Progress labels hide ≤389px.

## COLOR USAGE

> **60 : 30 : 10 mapping (round 7 · `design-tokens-round3.md` §11):** 60% dominant ground = `tuscanSun-50` #FEF7E6 (the warm page background, replacing the `#FFFFFF` canvas) · 30% secondary surface = `#FFFFFF` card/panel/form-field fill (now reads as depth on the warm ground; `blueSlate-50` stays the alternate soft surface) · 10% accent = `atomicTangerine-600` (primary CTA / price) · `strawberryRed-600` (sale / error / destructive) · `carrotOrange-500` (low-stock / secondary) · `tuscanSun-500` (featured / star) — used sparingly, ~10% of the surface.
> **intended-redesign: round-7 60:30:10 storefront color ratio** — the `#FFFFFF` canvas is demoted to the 30% surface layer and the `tuscanSun-50` warm ground becomes the 60% dominant page background (`design-tokens-round3.md` §11). Control-panel / ops pages are **out of scope**: their dark `blueSlate-900` sidebar + content gutter chrome is unchanged.

| Element | Token |
|---|---|
| **Canvas / page background (60% ground)** | `tuscanSun-50` #FEF7E6 (warm ground, round 7 §11) — the step cards, payment card, receipt card and the order-review panel sit on it as `#FFFFFF` 30% surface (border `blueSlate-200`, card padding 24px, radius 12px) |
| Progress bar (3-step indicator) | 32px numbered circles: active/done fill `atomicTangerine-600` + white 14/600 digit, pending = `blueSlate-200` border + `blueSlate-500` digit; labels `blueSlate-700` 13/500 (active → `blueSlate-950` 13/600); connecting track 2px, done = `atomicTangerine-600`, pending = `blueSlate-200` |
| Section step numbers (in-card "1/2/3" badge) | 26px circles, `atomicTangerine-600` fill, white 13/600 digit |
| Section titles ("Personal information", "Shipping address", "Payment") | `blueSlate-950` 16/24 w600 |
| Labels | `blueSlate-950` 13/600; input text 14px, placeholder `blueSlate-500` |
| Inputs | 44px min height, radius 8px, 1px `blueSlate-200` border; focus ring 2px `atomicTangerine-500` offset 2 |
| Payment method radio-cards (step 3) | 44px min rows: border `blueSlate-200`, selected bg `blueSlate-100` + radio dot `atomicTangerine-600`; method title `blueSlate-950` 14/500, subtitle `blueSlate-700` 13/400; method icon `atomicTangerine-600`; conditional-input block 1px dashed `blueSlate-200` border on `blueSlate-50` |
| Review / receipt line thumbs + names | 44×44 (review) / 24×24 (compact receipt) category-keyed gradient tiles; `blueSlate-950` 14/500 name, `atomicTangerine-600` price |
| Subtotal label / value | `blueSlate-700` 14/400 / `blueSlate-950` 14/600 |
| Total row | `blueSlate-700` label ("Total (to be settled)*") + `blueSlate-950` 20/28 w600 value; "*payment TBD" hint `blueSlate-700` 13/400 |
| Receipt confirmation (step 4) | `#FFFFFF` 30% surface card, border `blueSlate-200`, radius 12px; success check 26px circle `willowGreen-500` (white tick); receipt table header row `blueSlate-50` bg + `blueSlate-700` 13/600, body rows `blueSlate-950` 14/500 name + 14/600 amount; "pending" chip = `pill-pending` `tuscanSun-100` bg / `blueSlate-900` 12/16 w600 |
| "Place order" CTA (step 3 only) | filled 44px: `atomicTangerine-600` idle → `-700` hover → `-800` active, white 14/500 label; loading keeps `-600` fill with spinner; disabled = `blueSlate-100` bg + `blueSlate-400` text. Mobile: fixed bottom CTA bar (white fill, 1px `blueSlate-200` top border) with total `blueSlate-950` 20/28 w600 |
| "View my orders" CTA (step 4) | filled `atomicTangerine-600`, white label → Orders Placed |
| "Edit cart" button | secondary: white fill, 1px `blueSlate-200` border, `blueSlate-950` label, hover fill `blueSlate-100`, 44px min |
| Alt-flow 3a conflicting line | `strawberryRed-100` bg tint, border `strawberryRed-300`, note `strawberryRed-600` |
| Alt-flow 5a banner | `strawberryRed-100` bg, `strawberryRed-700` text, retry link `strawberryRed-600` underlined |
| Success (receipt view) | `willowGreen-500` check circle + `tuscanSun-100` `pending` chip; the order redirects via "View my orders" |

## INTERACTIONS

(React: `CheckoutWizard` (3 steps + receipt), `PersonalInfoForm`, `ShippingForm`,
`PaymentMethod` (radio-cards + per-method conditional inputs), `Receipt`
(confirmation view), `OrderReview` (persistent panel), `PlaceOrderButton`
(step-3 only), `ProgressBar`.)

- **Form validation:** step 1 — name required, phone required + loose format check
  (digits/`+`, min 8 — assumption), email required (loose format), note optional;
  step 2 — address required (min ~20 chars), district / city / province / postal
  code. Inline `strawberryRed-600` under field on blur; "Continue" blocked until the
  active step is valid.
- **CTA enabling:** active step valid AND ≥1 cart line AND no unresolved stock
  conflict; disabled = `blueSlate-100` bg + `blueSlate-400` label.
  **Loading:** spinner + "Placing order…" (idle fill kept), inputs + CTA locked;
  static/`prefers-reduced-motion` safe — no scale or shadow bloom.
- **Alt flow 3a (out of stock, `POST /orders` returns stock conflict):**
  page stays; conflicting lines get the `strawberryRed-100` tint + a note
  "Only N left" or "Out of stock"; CTA label → "Update quantities & retry";
  no state changed (no order row, no stock moved).
- **Alt flow 5a (5xx / network):** full-width banner, "Something went wrong —
  your order was not placed." + Retry (resubmits with the same client order id
  — idempotency assumption, flagged to backend-dev).
- **Success:** the receipt confirmation view (step 4) renders with the order
  number, line-item table, payment-method line and the `pending` chip; "View my
  orders" → Orders Placed, where the new order appears at top with a `pending`
  chip (`tuscanSun-100` bg per color-tokens §3). Cart clears
  (assumption — most likely: order placed = items consumed; flagged).
- **Role-based visibility:** any non-buyer → redirect to their dashboard
  before content renders (guard at route level).
- **a11y:** errors `aria-describedby`; stock-conflict note `aria-live="assertive"`;
  progress bar `role="group"` with the active step `aria-current="step"`; sticky
  CTA focusable on mobile; focus ring 2px `atomicTangerine-500` offset 2; all
  tap targets ≥ 44px.
