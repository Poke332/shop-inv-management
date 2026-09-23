# Ongoing Orders — Implementation

Phase P5 (inside the ops app shell). Visual/interaction source:
`docs/ongoing-orders/design.md` + mockup; shell gutter per
`docs/control-panel/design.md` (v4). This is the **fulfillment console** — the ops
mirror of Orders Placed.

## Route

- Path: `/ops/orders` (+ `/ops/orders/:id` = same page, that order's receipt detail
  expanded and linked) — roles: **staff / manager / admin** (matrix "update purchase
  status" F/T/T/T). **Post-login routing: staff land here** (their core duty —
  flagged assumption from the Login doc). Buyer hitting the URL → redirected to `/`.
- Buyer names in the UI are plain text — **no links to User Dashboard** (admin-only
  scope; do not link).

## Components

| Component | Responsibility |
|---|---|
| `OngoingOrders` | Page inside `OpsShell`: h1 "Ongoing orders" + filter tabs + queue |
| `OrderQueue` | Open-order queue, default filter = `pending` + `processing` ("ongoing"); tabs All / Pending / Processing / Shipped / Delivered (the last two = recent, read-only audit) with counts (mock: All(42) · Pending(9) · Processing(5) · Shipped(3) · Delivered); **sorted by age, oldest pending first** (fulfillment priority — flagged assumption vs newest-first); refetch on focus + 30s poll (assumption, TBD-light) |
| `OrderRow` | White order card: header row (order id `blueSlate-950` 14/600, date + "N lines" `opsub` 13/400 `blueSlate-700`, total `atomicTangerine-600`, status chip `●/◐ pending/processing/shipped/delivered` per color-tokens §3, "Details ▾/▴" toggle `atomicTangerine-600` link) + **receipt-table detail expand** (the round-9 anatomy below); delivered = no advance button (terminal state — read-only audit row); mobile: cards stack, tabs scroll horizontally, receipt cells tighten to 8px so Item/Unit price/Qty/Amount stay on one row at 390px, header rows wrap (flex-wrap) |
| Receipt table (inside `OrderRow`) | `.receipt` anatomy: itemized rows (Item · Unit price · Qty · Amount, amount columns right-aligned; header row `blueSlate-50` bg + 12/600 `blueSlate-700` labels, 1px `blueSlate-200` dividers; rows 14/20 w400, item name w500) → Subtotal / Shipping / Total rows (w500 `blueSlate-950`; Total in `atomicTangerine-600`; shipping 0 renders "Free") → Ship-to block below the table (uppercase "SHIP TO" 12/600 `blueSlate-700` label, address 14/20 `blueSlate-950`, buyer line 14/20 `blueSlate-700` with name w500, 1px top divider) — all inside the existing white order card. **#WB-1042 is expanded by default in the fixture** (its receipt = Sony WF-C710N 1.290.000 ×1 + Anker 735 Power Bank 280.000 ×1, subtotal 1.570.000, shipping 100.000, total 1.670.000, ship to Jl. Kemang Selatan 12 Jakarta Selatan, buyer jordan.wjy) |
| `StatusAdvanceButton` | The page's core action: one advance button per order, labels "Start processing" / "Mark shipped" / "Mark delivered" (forward-only machine, locked); filled `atomicTangerine-600` idle → `-700` hover → `-800` active, white 14/500, 44px min, 8px radius, disabled = `blueSlate-100`/`blueSlate-400`. Optimistic: chip + button move forward + `willowGreen-100` row tint / `willowGreen-600` success flash; 409/5xx → `strawberryRed` toast "Status update failed — retry", button stays, state reverts; double-advance guarded (disabled mid-flight) |

## Links

- Ops nav "Ongoing Orders" (staff home). Order id deep-link → `/ops/orders/:id`.
- Staff capability boundary: this page exposes **only** status advancement + alerts —
  no product CRUD, no review moderation, no user management (their matrix scope).

## Data

- `mockApi.getOrders(statusTab?)` (future: `GET /ops/orders?status=`) → the ARCHITECTURE
  §4.2 queue: #WB-1042 pending (2 lines, 1.670.000, expanded default), #WB-1039
  processing (Razer V3 line, 240.000, "Mark shipped"), #WB-1036 pending (3 lines,
  2.030.000), #WB-1031 pending (549.000); counts All 42 / Pending 9 / Processing 5 /
  Shipped 3.
- `mockApi.advanceOrderStatus(id, next)` (future: `PATCH /orders/:id/status`) —
  forward-only v1; regression ("Revert" secondary) is a flagged TBD, not designed in.
- **Alerts (open decision #1, TBD):** in-app — the "Orders need attention" `nbadge`
  count on the ops nav (pending > N hours) + a 30s poll; no email infra in v1.

## Surviving state

- Expand/collapse + active tab are in-page (the `:id` variant encodes the expanded
  order in the URL; tab state is not URL-encoded — it resets on navigation). No
  cross-page state survives; the queue refetches on focus.

## Page-specific notes

- Role visibility: staff/manager/admin all see the status buttons ("update purchase
  status" T for all three) — nothing on this page is admin-exclusive; manager
  additionally reaches the Products/Reviews nav items (separate pages).
- a11y: status always chip text + icon (never color-only); advance buttons
  text-labelled; queue changes announced `aria-live="polite"`; focus ring 2px
  `atomicTangerine-500` offset 2.
- Shell QA line (control-panel doc): content sits 32px off the sidebar (24px mobile)
  — the gutter is the `.ops-content` padding, verified at 1280/1312px and 390px,
  holds under Tailwind preflight.
- Verification: match mockup at 1312px (WB-1042 expanded receipt + tabs with
  counts); 390px = receipt 4 columns on one row, tabs horizontal scroll.
