# Implementation Plan — Sunset Electronics (React build of the committed design)

This document is the **overall** build plan. Each of the 14 page folders carries its own
`docs/<page>/IMPLEMENTATION.md` with the page-level detail (components, route, links, data
shape, surviving state, page-specific notes). This file owns the sequencing, the shared
contracts, and what "done" means per phase.

Inputs it argues from: `docs/PRD.md` (scope + locked behaviors), `docs/ARCHITECTURE.md`
(stack, folder tree, token mapping, dummy data), each `docs/<page>/design.md` (visual +
interaction spec), `docs/control-panel/design.md` (ops shell gutter v4), `docs/RENDER.md`
(mockup provenance — the React build must match these renders).

## Phases, sequencing, dependencies

```
P0 scaffold → P1 router + layouts → P2 data layer (mock) → P3 storefront pages
        → P4 cart + checkout wizard → P5 ops console pages → P6 review panel
        → P7 polish + gates
```

A phase may start when its dependencies are merged; P3/P4 can overlap once P2 exists.
P6 (review panel) is separated from P5 so the round-6 moderation model gets one focused
pass. Nothing here is done before the token system exists (P0) — the conformance gate is
a first-class check from P0 onward.

### Phase status (updated 2026-09-24, branch `docs/implementation-plan`)

| Phase | Status | Evidence / what's left |
|---|---|---|
| P0 scaffold | **DONE** | commit `15957c0`: `frontend/` Vite app (sibling of `docs/`), full Sunset Glow token theme, static assets + 12 product photos, linter, .gitignore; verified by review + pushed (draft PR #8) |
| P1 router + layouts | **DONE** | commit `b9a505b` (code) + `docs` flip: full 14-route tree in `frontend/src/router.jsx` + RBAC guards (redirects, never 403), `StorefrontHeader` (56px bar) / `OpsShell` (v4 32/24px gutter, role-gated NavLink nav, mobile drawer) / `AuthLayout` layouts, `AuthContext` + P1 `CartStore` seam, placeholder route slots; verified live at 1280/1312/390 |
| P2 data layer | **DONE** (pulled ahead of P1, by user ruling) | commit `617f4f2`: `frontend/src/data/` split one `.js` per API section (`store.js`, `seed/*`, `api/*`, `mockApi.js` facade) + ARCHITECTURE §4.4; verified by review + pushed |
| P3 storefront pages | NOT STARTED | 5 pages (main-store, search-browse, product-details, login, register) |
| P4 cart + checkout | NOT STARTED | 2 pages + `CartStore` wiring + 4-state wizard |
| P5 ops console | NOT STARTED | 4 pages inside `OpsShell` |
| P6 review panel | NOT STARTED | 1 page (round-6 moderation model) |
| P7 polish + gates | NOT STARTED | cross-page pass: toasts, a11y floor, 390px audit, conformance gate re-run |

Note: P2 was executed out of the P0→P1→P2 order on user instruction so the data layer
exists before P1; this does not change any phase content, only the sequence.

### P0 — Project scaffold  ✅ DONE (`15957c0`)

Scaffold the Vite app **inside `frontend/` at the repo root (sibling of `docs/`)** —
`frontend/` holds `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`,
plus `src/` and `public/` (dev-only toolchain: `vite` dev server + build; React Router
SPA, not Next). **No new runtime dependency of any kind** (pinned stack only: React,
React Router, Tailwind CSS, React Icons; dev-only without approval: the Vite toolchain
+ an ESLint/Prettier lint setup — anything else goes to the off-stack sign-off card
`t_7480ddbe`). The entity shapes in `docs/ARCHITECTURE.md` §4.1 are transcribed into
the app's plain-JavaScript data modules at `frontend/src/data` exactly as documented
(JSDoc-style shape comments / field tables — no TypeScript, no `.ts` files;
documentation of the data layer, no language/build dependency change). Install Tailwind
with the full token theme extension (colors 7 families × 11 steps + semantic
aliases; font scale; spacing/gutter tokens; component-layer classes: button stacks,
pill badges, status chips, role badges, product tiles, stepper, skeletons, receipt
table, ops-shell classes). Load Roboto 400/500/600 in the app entry
(`frontend/index.html`). Copy static assets (`hero-banner.png`, 6 `cat-<slug>.png`)
into `frontend/public/`.

**Done:** the dev server renders a tokenized blank page; a Tailwind class using
`bg-tuscanSun-50` / `bg-blueSlate-900` / `font-h1` compiles; the mockup conformance gate
(`_mockup-build/verify_framework.sh`) still passes against the docs.

### P1 — Router + shared layouts  ✅ DONE (`b9a505b`)

The route tree (all 14 routes + guards) from `docs/ARCHITECTURE.md` §route table and each
page's `IMPLEMENTATION.md` route section. Build the three layouts:
`StorefrontHeader` (56px bar: logo → Main Store; pill search → Search/Browse pre-filled;
cart icon with count badge; account menu per role), `OpsShell` (v4 gutter spec: 230px
`blueSlate-900` sidebar, `.ops-content` 32/24px gutter via `--ops-page-pad` class padding,
`100dvh`, mobile off-canvas drawer + 56px top bar), `AuthLayout` (two-panel brand + form
card shared by Login/Register). RBAC guards: role list per route; non-actors redirect
(buyer routes → Main Store; ops routes → the role's ops home; **never** a 403 page).

**Done:** every route resolves with the right shell for the right role; sidebar nav items
are role-gated (staff: Ongoing Orders + Inventory + Products read-only; manager: + Reviews;
admin: + Users); the 32px/24px gutter measures under a real Tailwind preflight (the v4
reset-proof requirement from `docs/control-panel/design.md` QA §2).

### P2 — Data layer (mock)  ✅ DONE (`617f4f2`) (P2b durable store: 9616793+ pending — persistence via localStorage, see ARCHITECTURE §4.5)

`frontend/src/data`: the §4.2 sample records (48 products incl. the 12 named, orders WB-1042/1039/
1036/1031/0987, 128 reviews on P-231 = 122 public + 6 hidden, 128 users incl. admin_ria /
ops_marta / ops_dan / rian_w / buyer_102, 6 categories) **seeded from the mock
credentials table** (ARCHITECTURE §4.2 "Mock credentials" — one active login per role,
`ops_dan` disabled, plus the duplicate-email case for register-409) and the `mockApi`
module whose functions mirror the future Express endpoints (`docs/ARCHITECTURE.md` §4.3
table). **One shared in-memory mock store**: all `mockApi` reads and writes operate on
the same module-level records, so mutations (`createOrder`, `advanceOrderStatus`,
`setStock`, review/user actions, product upserts) are immediately visible to every other
`mockApi` read; the store **resets on refresh** (in-memory only, no localStorage) — a
reload restores the pristine sample records. Simulated latency + failure injection so
every page's loading/empty/error states are exercisable. `CartStore` context (session
persistence — client-side, not part of the shared mock store) + `AuthContext` (mock
users: one per role + a disabled account for the login-denied state).

**Done:** every `mockApi` function returns data consistent with the mockups
(WB-1042 = 2 lines, subtotal 1.570.000 + shipping 100.000 = total 1.670.000; Anker 735 PB
stock 5 → LOW; ASUS RT-AX58 stock 0 → OUT; search-browse "128 results" count); a mutation
from one page (e.g. staff advancing WB-1042) is reflected by the next `mockApi` read on
another page; all 4 role logins + `ops_dan` denied work off the credentials table.

### P3 — Storefront pages  ⬜ NOT STARTED

`main-store`, `search-browse`, `product-details`, `login`, `register` (per each page's
`IMPLEMENTATION.md`). Shared `ProductCard`/`ProductGrid` first (main-store defines, others
reuse), then the category tiles + hero, then search-browse's FilterRail + URL param state,
then product-details (gallery, specs table, quantity stepper, Add to Cart, ReviewList with
hidden states + seller-comment block), then the auth pair on `AuthLayout`.

**Done:** buyer can log in / register, reach the home page (hero → 3×2 category grid →
"Our Products" 8-item grid + See-more), deep-link from category tiles to
`/search?category=<slug>`, filter in place with removable chips, open P-231 and see
"Rp 1.290.000 / Rp 1.518.000 −15% / In stock · 34 left / 4.3 (128 reviews)" with public
reviews only — matching the committed mockups at 1312px and 390px.

### P4 — Cart + checkout wizard  ⬜ NOT STARTED

`cart`, `checkout`. `CartStore` is live (line, quantity, subtotal from P2's mock cart:
P-231 ×1 + P-198 ×1 = Rp 1.670.000, "Low · 5 left" hint on the Anker line). The checkout
wizard is the 3-step flow + receipt view of `docs/checkout/design.md`: Personal info →
Shipping address → Payment (Card / Bank transfer / QRIS radio-cards) → receipt
(order number #WB-10xx, line table, payment line, `pending` chip, "View my orders").
Wizard step + form state survive navigation (in-memory, not URL — deep-linking is not
allowed per the page doc; arrival only via Cart CTA). Alt-flows 3a (stock conflict:
tinted conflicting line, "Update quantities & retry", no state change) and 5a (retry with
the same client order id). On success: cart clears, receipt shown, new order on top of
Orders Placed (the just-placed order auto-expands there).

**Done:** full purchase on the mock data lands a `pending` WB order; the 4 mockup states
(step1/step2/step3/receipt) each render per `docs/checkout/mockup*.png`; mobile 390px
drops the order panel into the fixed bottom CTA bar on step 3.

### P5 — Ops console pages  ⬜ NOT STARTED

`ongoing-orders`, `inventory-dashboard`, `per-product-dashboard`, `user-dashboard`
(all inside `OpsShell`). Ongoing-orders: queue + status tabs + receipt-table detail expand
(WB-1042 expanded by default in the fixture) + forward-only `StatusAdvanceButton`.
Inventory: "Needs attention" banner (stock ≤ 5, out-of-stock first) + product table with
`StockStepper` (manager+/admin only; staff read-only via visibility gating, not
disabled styling). Per-product-dashboard: 330px list + pre-filled editor (incl. the round-9
repeatable name/value Specs card), "Open editor" deep link from Inventory
(`/ops/products/:id/edit`). User-dashboard: user table, role select + disable toggle,
ConfirmDialogs, self-protection (own-row controls absent), admin-only nav item.

**Done:** a staff session can advance WB-1042 `pending → processing` (optimistic + success
flash, reverts on failure); a manager session edits P-231 stock and specs; an admin session
changes ops_marta's role (confirm dialog, success flash "Role updated to manager ·
ops_marta") and sees ops_dan's disabled row (3px `strawberryRed-500` left bar).

### P6 — Review panel  ⬜ NOT STARTED

`per-product-review-panel` inside `OpsShell` (manager/admin only): product selector
(deep-link `/ops/reviews?product=P-231` pre-selects), meta line "122 public / 6 hidden ·
128 total", Public section (newest first, accent bar `willowGreen-500`) + collapsed Hidden
section, per-row `Hide`/`Unhide` toggle + Add/Edit `SellerCommentComposer`. Optimistic
moves with roll-back; no approve, no delete, no confirm dialog (round-6 model). The panel's
actions are visible immediately on Product Details (public list) and Inventory nav badge.

**Done:** hiding R-…04's sibling public row moves it to Hidden with a success flash; the
seller comment "Thanks — firmware 2.1 improved ANC." renders beneath buyer_102's review on
Product Details while public; unhiding a commented review publishes the comment with it;
totals stay 128.

### P7 — Polish + gates  ⬜ NOT STARTED

Cross-page pass: header cart badge consistency, toast system, static-skeleton + reduced-
motion audit on every page, 390px clipping audit (the standing verification rule: desktop
1280/1312px gutter balance + mobile 390px no-horizontal-scroll, on the live dev server —
code reading does not count), a11y floor (44px targets, focus rings, `aria-live` regions,
no color-only state), and the mockup conformance gate re-run against the rendered pages.
**No automated test suite in v1** (pinned stack ruling — no Vitest/Jest/RTL): "done" =
mockup conformance gate + the manual 1312px/390px breakpoint checks on the live dev server
above.

**Done:** every page passes its `design.md` visual spec at both breakpoints on the live
dev server; zero out-of-scale hex; zero font-weight > 600; the board's render pipeline
still proves `docs/` mockups == generator output (no drift introduced by the docs).

## Route table (single source of truth for P1)

| Path | Page | Roles allowed | Ops shell? |
|---|---|---|---|
| `/` | main-store | buyer (staff+ redirected to their ops home) | storefront header |
| `/search` | search-browse | buyer (staff read-only variant if decision #8 widens it) | storefront header |
| `/products/:id` | product-details | all 4 (variant B read-only for staff+) | storefront header |
| `/cart` | cart | buyer (logged in) | storefront header |
| `/checkout` | checkout | buyer (logged in, cart ≥ 1) | storefront header |
| `/orders` | orders-placed | buyer (logged in) | storefront header |
| `/login` · `/register` | login · register | anonymous (authenticated users redirect to their home) | AuthLayout |
| `/ops/orders` | ongoing-orders | staff, manager, admin | OpsShell |
| `/ops/orders/:id` | ongoing-orders (expanded) | staff, manager, admin | OpsShell |
| `/ops/inventory` | inventory-dashboard | staff (read), manager, admin | OpsShell |
| `/ops/products` · `/ops/products/:id/edit` | per-product-dashboard | manager, admin | OpsShell |
| `/ops/reviews?product=<id>` | per-product-review-panel | manager, admin | OpsShell |
| `/ops/users` | user-dashboard | admin only | OpsShell |

Ops post-login homes: staff → `/ops/orders`, manager/admin → `/ops/inventory`.

## How the 14 per-page plans connect

Each `docs/<page>/IMPLEMENTATION.md` is written for a worker implementing that one page in
its phase (P3/P4/P5/P6). Every page doc states: components to build (name + responsibility),
the route + guard from the table above, links in/out (including the main-store deep-link
contract `/search?category=<slug>` and the product-id deep-links), the mock data module
slice + API contract placeholder it consumes, the state that must survive navigation
(cart across all storefront routes; checkout wizard step state; ops expand/select state is
in-page only), and the page-specific design.md notes (e.g. checkout = 4-state wizard +
progress bar + persistent order-review card; ongoing-orders = receipt-table detail expand;
product-details = specs table + hidden-state reviews; control-panel = the v4 gutter spec).
A page is "done" when it matches its mockups at both breakpoints and its data flows
through the phase's P2 module — not when it merely renders.
