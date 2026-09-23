# Inventory Dashboard — Implementation

Phase P5 (inside the ops app shell). Visual/interaction source:
`docs/inventory-dashboard/design.md` + mockup; shell gutter per
`docs/control-panel/design.md`. Ops panel page.

## Route

- Path: `/ops/inventory` — roles: **staff / manager / admin** (page-list column),
  with matrix-driven **feature gating inside** (not page-level):

  | Feature | staff | manager | admin |
  |---|---|---|---|
  | Stock overview (read) | T | T | T |
  | Replenishment alerts | T | T | T |
  | Edit stock quantity | F | T | T |
  | Open product editor / review panel | F | T | T |

  **Post-login routing: manager/admin land here** (their home). Staff arrive via
  ops nav (read-only).

## Components

| Component | Responsibility |
|---|---|
| `InventoryDashboard` | Page inside `OpsShell`: header "INVENTORY · 48 products · 3 need attention" + `AlertBanner` + `ProductTable`; content sits 32px off the sidebar (v4 gutter) |
| `AlertBanner` | "NEEDS ATTENTION [N]" section — `carrotOrange-100` bg + `carrotOrange-300` border, `blueSlate-950` text, count in a `carrotOrange-600` badge (low-stock warning role per color-tokens §3). Lists items with stock ≤ threshold (5, documented assumption — consistent with Product Details): out-of-stock first, then low, by stock asc (mock: ASUS RT-AX58 stock 0 OUT, Logi MX Keys S stock 3 LOW, Anker 735 PB stock 5 LOW). Clicking a row scrolls to / expands its table row. **This in-app surface + the nav badge IS the v1 alert channel** (open decision #1: in-app assumed; email out of UI scope) |
| `ProductTable` | All products (48): name, category, price, current stock, status pill (in / low / out — `willowGreen-100` / `carrotOrange-100` / `strawberryRed-100` tints, text `blueSlate-900`, 12/600, 4×10 pad, **always carries a text label** — never color-only); zebra rows `blueSlate-50`, 1px `blueSlate-200` borders; in-table search (name/category, debounced 300ms, reuses the `SearchInput` pattern); row actions right-aligned: "Set stock" (filled `atomicTangerine-600` 44px 8px radius) + "Open editor" link (`atomicTangerine-600`) |
| `StockStepper` | The inline quick-adjust (open decision #2: **inline quick-set for the number only**, full edit lives in Per Product Dashboard): 44px cells, `blueSlate-200` border, `blueSlate-950` value, disabled side `blueSlate-100`/`blueSlate-500`; min 0; commits on blur / Enter → success row tint `willowGreen-100` ~1s, failure inline `strawberryRed-600` "Save failed — retry". Copy is parameterized for the open decision #5 semantics: if decrements are automatic (the v1 assumption), the helper reads "stock is auto-decremented on each order — set actual count" |

## Links

- Ops nav (shared `OpsSidebar`): Inventory (this), Ongoing Orders, Products, Reviews,
  Users (admin-only). "Open editor" → `/ops/products/:id/edit` (pre-filled product
  editor — the sheet's "pre-filled edit form"). No storefront links (ops users don't
  shop).

## Data

- `mockApi.getStockOverview()` (future: `GET /ops/products`) → the ARCHITECTURE §4.2
  stock rows: P-231 Sony WF-C710N / Audio / 1.290.000 / **34** / In stock · P-198 Anker
  735 PB / Accessories / 380.000 / **5** / Low · P-087 Razer V3 / Gaming / 240.000 /
  **2** / Low · P-173 Samsung Galaxy Watch6 / Wearables / 1.650.000 / **18** / In
  stock · P-064 ASUS RT-AX58 / Smart Home / 549.000 / **0** / Out of stock · "… 43
  more products · stock ≤ 5 flagged LOW".
- `mockApi.setStock(id, qty)` (future: `PATCH /products/:id/stock`) — absolute value.

## Surviving state

- None cross-page: search text, expanded row, and stepper draft are in-page (reset on
  navigation). The stock value itself lives in the data layer — the page renders it.

## Page-specific notes

- **Role gating is visibility, not disabled styling** — staff render no steppers and no
  "Open editor" link (route + render gating, matrix F). Manager/admin render both.
- User Dashboard nav item = admin-only (separate page).
- Mobile (<768px): table → card list (one product per card, stepper inside); alert
  banner collapses to a badge on the page title. Desktop-first (staff workstation) —
  mobile is the supported-but-degraded path.
- Loading: static table skeleton rows (no shimmer loops; still under
  `prefers-reduced-motion`). Error: `strawberryRed` panel + retry.
- a11y: rows are `<tr>` with header scope; steppers have `aria-valuenow`; alert banner
  `role="alert"` on count change; focus ring 2px `atomicTangerine-500` offset 2.
- Verification: match mockup at 1312px (alert banner + 5 visible stock rows + "43
  more" footer); 390px = card list.
