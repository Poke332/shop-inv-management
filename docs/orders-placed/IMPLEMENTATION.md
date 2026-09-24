# Orders Placed — Implementation

Phase P4 (order flow lands here after checkout; buyer's order history + status
tracking, and — per the sheet's implementation notes — **home of the review form**,
open decision #9 as resolved in the round-6 docs). Visual source:
`docs/orders-placed/design.md` + mockup.

## Route

- Path: `/orders` — roles: **buyer, logged in**. Arrival: post-checkout redirect
  (the just-placed order sits at top, `pending`, auto-expanded — post-checkout
  context), header account menu "My orders". Buyer is **read-only** on everything
  here ("update purchase status" F in the matrix — zero status-edit affordances;
  staff/manager/admin never see this page → redirected to their ops home).

## Components

| Component | Responsibility |
|---|---|
| `OrdersPlaced` | Page: "My orders" h1; order list newest first; first/just-confirmed order auto-expanded; poll/refetch on focus + 60s (assumption, TBD-light — mirrors ongoing-orders) so the timeline advances live |
| `OrderCard` | Collapsed row: order id (`blueSlate-950` 14/600, e.g. "#WB-1042"), date (`blueSlate-700` 13/400), status chip, line summary (40×40 gradient thumbs + names + line prices + "Total"), "Details ▾/▴" toggle (`atomicTangerine-600` 14/500, underline hover); expanded: full lines + `StatusTimeline` + `ReviewForm` blocks when delivered; mobile: cards full-width, timeline → horizontal 4-dot strip, review block full-width (no bottom sheet) |
| `StatusTimeline` | 4 steps pending → processing → shipped → delivered: 14px dots (current `atomicTangerine-500`, completed `willowGreen-500`, upcoming `blueSlate-200`) + 44px connectors (`willowGreen-500` where done); step labels 13/500 `blueSlate-700`, current 600 `blueSlate-950`; semantic `list` with `aria-current="step"`; status announced `aria-live="polite"` ("Order WB-1042 is now processing") |
| `ReviewForm` | Per delivered order, per purchased product: "Rate this purchase — <product>" block in a `blueSlate-50` inset card (1px `blueSlate-200` border, radius 10px): `StarRating` (scale-agnostic, v1 1–5; filled `tuscanSun-500` / empty `tuscanSun-200` — TBD marker per design doc) + optional comment (44px min input, placeholder `blueSlate-500`) + "Send" filled 44px primary. Appears **only when status = delivered AND not yet rated** (server flag `reviewed`); 0 stars on submit → inline `strawberryRed-600` "Please pick a rating"; success → block replaced by a confirmation line **"Thanks — you rated <product> [stars]"** where `[stars]` is the **rating the user actually chose** (dynamic `★★★★★` built from the chosen value, e.g. 3 chosen → `★★★☆☆`), rendered `willowGreen-600` on `willowGreen-100`, non-re-openable for that item. **The success line must NOT be a fixed "★★★★☆" example — it mirrors the chosen rating.** Absent for pending/processing/shipped |

## Links

- Line (product) → `/products/:id` (re-shop / inspect). No exit link to checkout —
  the order flow is one-directional. Empty state: "No orders yet" + "Start shopping"
  filled primary → `/`.

## Data

- `mockApi.getMyOrders()` (future: `GET /orders/mine`) → the buyer's orders from
  ARCHITECTURE §4.2: #WB-0987 delivered (P-231 ×1 @ 1.290.000, reviewed) and
  #WB-1042 pending (2 lines, total 1.670.000 — the just-placed mock order); the
  mock flags the delivered, unrated line of the fixture with
  `reviewed: []` so the `ReviewForm` renders.
- `mockApi.submitReview(orderId, productId, rating, comment)` (future:
  `POST /orders/:id/reviews`) — purchase-gated (only purchased items can be rated,
  locked); round-6 auto-approve: the submitted review is **public on arrival**
  (visible immediately on Product Details; counted in its total).
- Status chips use the locked machine + color-tokens §3 mapping: pending
  `tuscanSun-100`, processing `seagrass-100`, shipped `blueSlate-100`, delivered
  `willowGreen-100`; text `blueSlate-900` 12/600 with ● / ✓ glyph — state never
  color-only.
- States: static row skeletons (no shimmer); 5xx = `strawberryRed-100` panel +
  "Try again" filled `strawberryRed-600`.

## Surviving state

- Nothing page-specific survives navigation — order data refetches on mount/focus
  (the 60s poll keeps it fresh without user action). The just-confirmed order's
  auto-expanded state is a one-shot on arrival (detect "came from checkout" via
  the redirect context, not the URL).

## Page-specific notes

- Stock-decrement semantics (open decision #5) have no UI consequence here: if
  decrement later becomes manual, nothing on this page changes (buyer stays
  read-only).
- a11y: status chip = label + icon inside the pill; focus ring 2px
  `atomicTangerine-500` offset 2; all tap targets ≥ 44px.
- Verification: match mockup at 1312px (pending order row + delivered order
  expanded with timeline + review block on the delivered item); 390px =
  full-width cards, 4-dot strip timeline.
