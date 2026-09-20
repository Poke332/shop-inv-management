# Page: Inventory Dashboard — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Ops panel page. Access: **staff/manager/admin** (page-list column), with
matrix-driven feature gating inside:

| Feature | staff | manager | admin |
|---|---|---|---|
| Stock overview (read) | T | T | T |
| Replenishment alerts | T ("product update alerts") | T | T |
| Edit stock quantity | F | T | T ("update stock quantity") |
| Open product editor / review panel | F | T (links) | T (links) |

## FEATURES

- **Stock overview:** table of all products: name, category, price, current
  stock, status (in / low / out). "Low stock" threshold = 5 (assumption,
  consistent with Product Details; flagged).
- **Replenishment alerts:** items with stock ≤ threshold listed in a top
  "Needs attention" section. **Alert channel (open decision #1): TBD** — the
  sheet offers in-app badge/toast **or** email and defines no notification
  infra. Most likely v1: **in-app** — the dashboard IS the alert surface,
  plus a badge count on the ops nav ("Inventory (3)"). Email delivery is
  out of UI scope.
- **Stock editing UX (open decision #2): TBD** — inline edit on the table
  **or** via the edit-product form. Most likely v1: **inline quick-adjust on
  this page for the number only** (stepper) + "Open editor" link to Per
  Product Dashboard for anything else (name/price/image/description).
  Rationale: staff-level ops need fast number changes; full product CRUD is
  manager+ anyway. (UI builds both affordances cheaply; team decides the
  source of truth — no backend design here.)
- **Stock-decrement interaction (open decision #5): TBD** — if decrements are
  automatic on purchase (Sheet2 postcondition), manager edits set absolute
  values and the UI warns "stock is auto-decremented on each order — set
  actual count". If manual, same UI, different wording. Component
  `StockEditor` is copy-parameterized.
- **Route protection:** staff/manager/admin guard; staff additionally has
  write controls hidden (not just disabled — visibility gating, matrix F).

## LINKS / NAVIGATION

- Ops nav (shared `OpsSidebar`): Inventory Dashboard (this), Ongoing Orders,
  Per Product Dashboard, Per Product Review Panel, User Dashboard (admin
  item only — see that doc). Post-login routing: manager/admin land here.
- "Open editor" link → Per Product Dashboard (pre-filled product editor —
  the sheet's "pre-filled edit form").
- No storefront links (ops users don't shop).

## VISUALIZATION

`TODO: request image generation —` "internal inventory dashboard, white background, top
alert banner '3 products need restocking' in warm amber, dense data table with
status pills (green in-stock, red out-of-stock, amber low), quantity stepper
cells, warm orange primary actions, clean SaaS look, desktop 1440px" — save to
`docs/inventory-dashboard/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| OPS CONSOLE   [Ongoing Orders] [Inventory (3)] [Products] […]*  |
+------------------------------------------------------------------+
| INVENTORY                                                    + 5|
|  ! NEEDS ATTENTION (3)  (tuscanSun banner)                  0|
|  +----------------------------------------------------------+  |
|  | Widget C · Tech · stock 0 · OUT   [ + set ] [Open edit] |  |
|  | Widget D · Tech · stock 3 · LOW   [ + set ] [Open edit] |  |
|  +----------------------------------------------------------+  |
|  ALL PRODUCTS (48)                                             |
|  +----------------------------------------------------------+  |
|  | Widget A | Apparel | Rp 45.000 | [ - 34 + ] | In stock  |  |
|  | Widget B | Apparel | Rp 30.000 | [ -  5 + ] | Low       |  |
|  | …        |        |           |           |            |  |
|  +----------------------------------------------------------+  |
* ops nav items are role-gated: staff sees Ongoing Orders +          |
  Inventory(read-only) + Products(read-only); manager/admin all;     |
  User Dashboard = admin only.                                       |
+------------------------------------------------------------------+
```

Mobile (<768px): table → card list (one product per card, stepper inside);
alert banner collapses to a badge on the page title. Ops console is
desktop-first (staff workstation) — mobile is a supported-but-degraded view.

## COLOR USAGE

| Element | Token |
|---|---|
| Page canvas / table bg | `#FFFFFF` |
| Ops sidebar / active item | `blueSlate-900` sidebar bg, `blueSlate-50` text; active item `atomicTangerine-500` left bar |
| "Needs attention" banner | `tuscanSun-100` bg, `blueSlate-950` text, count in `tuscanSun-500` badge |
| Table row border / zebra | `blueSlate-200`; zebra `blueSlate-50` |
| Status pill: in / low / out | `willowGreen-100` / `tuscanSun-100` / `strawberryRed-100`, text `blueSlate-900` (no color-only conveyance: pill has label text — see below) |
| Stock stepper | `blueSlate-200` border, `blueSlate-950` value |
| "Open editor" link | `atomicTangerine-600` |
| "Set stock" quick action | `atomicTangerine-500` bg white text |
| Save confirmation flash | `willowGreen-600` text on `willowGreen-100` row tint |
| Alert badge (nav) | `strawberryRed-500` bg, white count |

Pills always carry text labels ("In stock", "Low", "Out of stock") — status is
never color-only (a11y rule from ui-ux-pro-max).

## INTERACTIONS

(React: `InventoryDashboard`, `ProductTable`, `StockStepper`, `AlertBanner`.)

- **Idle (manager/admin):** steppers enabled. **Staff: steppers and "Open
  editor" hidden** (route + render gating, not disabled styling).
- **Stepper:** change commits on blur / Enter (`PATCH /products/:id/stock`
  — high-level assumption); success row tint `willowGreen-100` for ~1s;
  failure inline `strawberryRed-600` "Save failed — retry" link. Min 0.
- **Alerts:** banner items sort out-of-stock first, then low, by stock asc;
  clicking a row scrolls to / expands its table row.
- **Search/filter inside table** (by name/category) — assumption, reuses
  `SearchInput` pattern from Search/Browse (debounced 300ms).
- **Loading:** table skeleton rows. **Error:** `strawberryRed` panel + retry.
- **Role-based visibility (summary):** staff = read-only + alerts;
  manager/admin = + steppers + editor links; User Dashboard nav item
  admin-only (separate doc).
- **a11y:** rows are `<tr>` with header scope; steppers have
  `aria-valuenow`; alert banner `role="alert"` on count change.
