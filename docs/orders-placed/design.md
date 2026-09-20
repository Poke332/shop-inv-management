# Page: Orders Placed — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Order-flow step 3 (Cart → Checkout → **Orders Placed**). Also the buyer's order
history + status tracking page, and — per the sheet's implementation notes —
**home of the review form** (open decision #9 noted in Product Details).

## FEATURES

- Buyer-only for order data ("check purchase status" T for buyer; "update purchase
  status" F for buyer → **read-only** on everything here).
- Order list (newest first): order id, date, line summary, **status chip** using
  the locked machine `pending → processing → shipped → delivered` (chip colors
  per color-tokens §3).
- Order detail expand: lines, address, status **timeline** (4 steps, current
  step highlighted `atomicTangerine-500`, completed `willowGreen-500`, upcoming
  `blueSlate-200`).
- **Review form (sheet: "review form lives here"; open decision #9):** for each
  order in `delivered` status, a "Rate your purchase" affordance per purchased
  product: star rating + optional text (matrix: "review products bought"
  buyer-only; reviews only for purchased items — locked). Rating scale
  **TBD (open decision #10)** — assume 1–5 stars, component `ReviewForm`
  scale-agnostic.
  - **Stock-decrement note (open decision #5):** no UI consequence here; if
    decrement is later manual, nothing on this page changes (buyer still
    read-only).
- Buyer cannot PATCH status (matrix: update purchase status F for buyer).
  UI: zero status-edit affordances; staff/manager/admin never see this page.

## LINKS / NAVIGATION

- Arrival: post-checkout redirect (confirmation landing — the just-placed order
  is at top, `pending`). Header account menu → "My orders".
- Line → Product Details (re-shop / inspect).
- No exit-link to checkout; the order flow is one-directional.

## VISUALIZATION

`TODO: request image generation —` "order history page, white background, list of order cards
each with status pill (amber pending, teal processing, gray shipped, green delivered),
expandable detail with 4-step progress timeline, star rating form for delivered orders,
warm orange accents, sharp borders, desktop 1440px" — save to `docs/orders-placed/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| LOGO  [ search bar................. ]   (cart:0)  (account)      |
+------------------------------------------------------------------+
| MY ORDERS                                                        |
| +--------------------------------------------------------------+|
| | #WB-1042  19 Sep 2026   [● pending  ]          [ Details ▾ ]||
| | +--------------------------------------------------------------||
| | | pending → processing → shipped → delivered  (timeline)     ||
| | | [img] Widget A x2   Rp 90.000                              ||
| | | [img] Widget B x1   Rp 30.000     Total Rp 120.000        ||
| | +--------------------------------------------------------------||
| | #WB-0987  12 Sep 2026   [✓ delivered]          [ Details ▾ ]||
| | |   … timeline (all complete, willowGreen)                   ||
| | | RATE THIS PURCHASE  Widget A: [★ ★ ★ ★ ☆] [ comment…] [Send]||
| | +--------------------------------------------------------------||
+------------------------------------------------------------------+
```

Mobile: cards full-width, timeline compresses to a horizontal 4-dot strip with
labels below; "Rate" expands into a bottom sheet.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / card border | `#FFFFFF` / `blueSlate-200` |
| Order id / date | `blueSlate-950` / `blueSlate-700` |
| Status chips (pending/processing/shipped/delivered) | per color-tokens §3: `tuscanSun-100` / `seagrass-100` / `blueSlate-100` / `willowGreen-100`, text `blueSlate-900` |
| Timeline: done / current / upcoming | `willowGreen-500` / `atomicTangerine-500` / `blueSlate-200` |
| "Details" toggle | `atomicTangerine-600` |
| Rate link / Send button | `atomicTangerine-500` (btn), `tuscanSun-500` stars, `tuscanSun-200` empty stars |
| Review-sent confirmation | `willowGreen-600` text on `willowGreen-100` tint |
| Line product link | `blueSlate-950` underlined-on-hover |

## INTERACTIONS

(React: `OrdersPlaced`, `OrderCard`, `StatusTimeline`, `ReviewForm`, `StarRating`.)

- **Idle:** list loads; each order card collapsed to a single row until expanded
  (first / just-confirmed order auto-expanded — post-checkout context).
- **Status change:** when the server advances an order, the page polls or
  refetches (assumption: refetch on focus + 60s poll — TBD, lightweight);
  timeline + chip animate forward; `aria-live="polite"` announcement "Order
  WB-1042 is now processing".
- **Review form:** appears only when status = delivered AND not yet rated
  (server flag `reviewed`). Stars: hover fills to cursor, click sets;
  submitting with 0 stars → inline `strawberryRed-600` "Please pick a rating".
  Success → form replaced by "Thanks — you rated Widget A ★★★★☆"
  (`willowGreen-600`), non-re-openable for that item.
- **Disabled states:** review CTA absent for pending/processing/shipped
  (purchase not complete — most likely interpretation; can be flipped to
  "after delivery", that IS delivered here).
- **Loading:** row skeletons. **Error:** `strawberryRed` panel + retry.
- **Empty:** "No orders yet" + "Start shopping" → Main Store.
- **Role-based visibility:** any non-buyer → redirect; guards at route level.
- **a11y:** status chip text never conveys state by color alone (label +
  icon: ● / ◐ / → / ✓); timeline is a `list` with `aria-current="step"`.
