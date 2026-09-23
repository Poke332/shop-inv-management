# Control Panel (Ops App Shell) — Implementation

Phase P1 (the shell is built before any ops page). Layout-only spec source:
`docs/control-panel/design.md` (v4 gutter). This is **not** a routed page — it is the
shared `OpsShell` that all 5 ops pages (ongoing-orders, inventory-dashboard,
per-product-dashboard, per-product-review-panel, user-dashboard) render inside.

## Route / mounting

- No own route. Mounted as the layout wrapper for every `/ops/*` route
  (`src/router` nests the ops routes under `<OpsShell>`). Roles: **staff / manager /
  admin** (each ops page adds its own tighter guard).

## Components

| Component | Responsibility |
|---|---|
| `OpsShell` | The v4 layout: `<div class="ops-shell">` flex row, `min-height:100dvh`; `<aside class="ops-sidebar">` 230px `blueSlate-900` (width via `var(--ops-sidebar-w)` token, `flex:none`, internal `overflow-y:auto`) + `<main class="ops-content">` (`flex:1`, `min-width:0`, `overflow:auto`, **`padding: var(--ops-page-pad)` = 32px desktop / 24px mobile = the gutter**) containing the routed page |
| `OpsSidebar` (`.onav`) | Role-gated nav items + `nbadge` counts + active bar. Items: Ongoing Orders, Inventory, Products, Reviews, Users (Users = admin-only item). Active item = `blueSlate-800` bg + 3px `atomicTangerine-500` left bar, weight 600; `nbadge` = `strawberryRed-600` white 12/600 pill. Role gating is **visibility**, not just disabled: staff see Ongoing Orders + Inventory (read-only) + Products (read-only); manager adds Reviews; admin adds Users. Sidebar title 12/600, 0.1em tracking |
| `MobileOpsTopbar` | <768px: sidebar collapses to an off-canvas drawer (same 230px width, `translateX(-100%)` when closed) opened by a 56px top bar with a 44×44 menu button (`aria-expanded`, `aria-controls`); reduced-motion → instant show/hide. The shell guarantees the 24px gutter on mobile only; per-page mobile table→card transforms are owned by the page docs |

## The v4 gutter rule (the whole point of this doc)

The sidebar→content gutter is **an explicit class padding on `.ops-content`**
(`--ops-page-pad`, 32 desktop / 24 mobile), declared as a named-class rule
(specificity 0,1,0) so the universal `*{padding:0}` reset and any Tailwind
preflight cannot zero it. Do **not** re-add root/body padding and hope the reset
order stays lucky; do **not** position any element `absolute` against the shell to
re-close the gap. Sidebar = `flex:none`, content = `flex:1`, so the two never
overlap. The round-3 24px inner flex `gap` between `.ops-page` and its inner
columns is **removed** — the content padding is the single source of
sidebar-to-content spacing (per-page multi-column gaps stay *inside* `.ops-page`).

## Links / nav

- Each sidebar item routes to its page (`/ops/orders`, `/ops/inventory`,
  `/ops/products`, `/ops/reviews`, `/ops/users`). Active item follows the current
  route (React Router `NavLink`).

## Data

- Nav `nbadge` counts come from the same `mockApi` feeds the pages use: Inventory
  count = items with stock ≤ 5 (out-of-stock first); Ongoing Orders count = open
  orders (pending + processing); Reviews count = total for the selected product.
  In v1 the shell can read these lazily per active page; a shared "counts" fetch is
  a P7 polish, not required for the shell to render.

## Surviving state

- None at the shell level — active nav item derives from the route. Drawer open/closed
  is in-page (mobile only, resets on navigation).

## Page-specific notes

- A11y: `<main class="ops-content">` is the main landmark; `<aside>` has
  `aria-label="Ops navigation"`; every nav item ≥ 44px; focus ring 2px
  `atomicTangerine-500` offset 2 (visible on the dark `blueSlate-900`); keyboard
  order = DOM (sidebar before content).
- **QA / acceptance (the round's pass/fail line):** measured gap between the
  sidebar's right edge and the first content column's left edge = **32px at
  1280/1312px desktop and 24px at 390px** (not 0); holds **after** a Tailwind
  preflight / global reset is present; sidebar reads 230px (token), not
  auto/shrunk; no horizontal scroll at 1312px or 390px; sidebar visuals
  (`blueSlate-900`, active bar, nbadges) unchanged from round 3.
- The 60:30:10 warm-ground change is **out of scope** for the ops shell — the dark
  chrome stays exactly as specified; only the 8 named content-surface groups (see
  design-tokens-round3 §12) get white fills, and those live in the pages, not here.
- Verification: render one panel page (any ops page) and run the QA checks above at
  both breakpoints on the live dev server.
