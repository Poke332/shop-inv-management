# Architecture — Sunset Electronics (storefront + ops console)

Pinned frontend stack: **React.js + React Router + Tailwind CSS + React Icons**. The repo today
holds the design/docs only; the Express + SQL backend is planned, not built. This architecture
describes the frontend app and the mock data layer it will run on until the backend lands.

Sources: `docs/design-tokens-round3.md` (typography, spacing, components, §11 60:30:10, §12
surface rule), `docs/color-tokens.md` (the 77-value Sunset Glow scale + semantic aliases),
`docs/control-panel/design.md` (ops app-shell gutter v4), `Sheets-report.md` (roles, permissions,
locked flow decisions), `docs/RENDER.md` (mockup provenance).

## 1. Frontend stack

| Concern | Choice |
|---|---|
| Language | Plain JavaScript — **no TypeScript anywhere** (entity shapes are documented as JSDoc-style comments / field lists, never `.ts` files) |
| Framework | React.js (function components + hooks) |
| Toolchain | **Vite** (dev-only toolchain — build/dev server, HMR; the app is a React Router SPA, not Next) |
| Routing | React Router — one route tree, RBAC guards on route level (see `docs/IMPLEMENTATION.md` §Routes) |
| Styling | Tailwind CSS — design tokens transcribed as a theme extension + a token CSS-variable layer (`frontend/src/styles`). No ad-hoc hex, ever |
| Icons | React Icons (line glyphs for category tiles, status chips, cart/trash/menu affordances) |
| Client state | React Context + `useReducer` only — `AuthContext` (user + role + session), `CartStore` (cart lines + quantities), the checkout wizard's step/form state. No additional state library |
| Data fetching | Native `fetch` against a mock API module (`frontend/src/data`) that mirrors the future Express contract; polling via a `usePoll` hook. No data-fetching library |
| Forms | Native controlled inputs + per-page validation state (pinned stack); no form library |
| Money | prices stored as integer rupiah (IDR); display via one shared `formatRp` helper (`Rp 1.290.000`, dot thousands) |

V1 decisions recorded from the design docs (not re-opened): cart persistence is session-based
(client `CartStore`, no cross-device sync — `docs/cart/design.md` open decision #3, session
assumption); stock decrement is automatic on successful order (Sheet2 postcondition,
`docs/checkout/design.md`); rating average includes hidden-review stars (average is data-layer,
UI built scale-agnostic).

**Stack policy (pinned, not re-opened):**

- **Language:** plain JavaScript. No TypeScript anywhere — entity shapes stay documented as
  JSDoc-style comments / plain field tables, never `.ts` files.
- **Bundler:** Vite (dev-only toolchain; the app is a React Router SPA, not Next).
- **Tests:** no automated test suite in v1 — no Vitest/Jest/RTL. "Done" = mockup conformance
  gate + manual 1312px/390px breakpoint checks on the live dev server (see
  `docs/IMPLEMENTATION.md` P7 + `docs/PRD.md` Success criteria).
- **Dependency rule:** runtime dependencies are **exactly** React / React Router / Tailwind
  CSS / React Icons — nothing else. Dev-only tooling allowed **without** approval: the Vite
  toolchain + a linter (ESLint/Prettier). **Everything else** — any other runtime library
  OR dev tool — is NOT decided here: it is parked on the off-stack sign-off card
  (`t_7480ddbe`, "Off-stack library suggestions — sign-off in review lane") and only lands
  in the plan after review sign-off. No such library is written into these docs as a
  decision.

## 2. Design-token system → Tailwind mapping

The committed token system is `docs/design-tokens-round3.md` + `docs/color-tokens.md`. The build
transcribes it — it does not invent new values.

### 2.1 Color (77-value scale + white surface)

`tailwind.config.js` `theme.extend.colors`: the full 7 families × 11 steps (50–950), keys
`strawberryRed … blueSlate` (values verbatim from `color-tokens.md` §1), plus the semantic
aliases of §2 (`primary` = atomicTangerine, `secondary` = carrotOrange-500, `accent` =
tuscanSun-500, `destructive` = strawberryRed-600, `success` = willowGreen-500, `info` =
blueSlate-500, `ink` / `inkMuted` / `surface` / `border`, and `canvas: #FFFFFF`).

Discipline (`color-tokens.md` §4/§7, gate-enforced):

- Components reference **token keys** (`text-blueSlate-950`, `bg-atomicTangerine-600`), never raw hex.
- The only permitted non-scale value is `#FFFFFF` (the demoted 30% surface, §12).
- **60 : 30 : 10 canvas (§11):** page background = `tuscanSun-50` `#FEF7E6` (60% dominant
  ground, set on `body` / page wrapper for the 8 buyer-facing storefront pages); content
  surfaces = `#FFFFFF` (30% layer); accents ~10% (`atomicTangerine-600` primary CTA/price,
  `strawberryRed-600` sale/error/destructive, `carrotOrange-500` low-stock, `tuscanSun-500`
  featured/star).
- **Surface rule (§12):** the 8 governed content-surface groups (cart line card, checkout
  shipping + review-order cards, inventory table panel, order cards, product card + editor
  form, specs + description cards, search filters sidebar, user table panel) are white on
  the warm ground. The 5 ops pages + the control-panel app shell keep their dark
  `blueSlate-900` sidebar chrome — out of scope for the ratio.

### 2.2 Typography (round3 §1)

Roboto 400/500/600 (no 700+), loaded via the Google Fonts `<link>` pair in the app entry
(`index.html`); fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

`theme.extend.fontFamily.sans` + `fontSize` (transcribed from §1's Tailwind block):

| token | size/line-height | weight | use |
|---|---|---|---|
| `h1` | 26/36 | 600 | page title, one per page |
| `section` | 16/24 | 600, 0.05em tracking, sentence case | section labels |
| `card` | 15/24 | 600 | card titles (1-line clamped) |
| `body` | 14/20 | 500 | default text, button labels |
| `price` | 14/20 | 600 | prices (weight + color do the emphasis, never size) |
| `meta` | 13/20 | 400 | SKU/stock hint/labels |
| `badge` | 12/16 | 600, 0.02em | pill badges, counts |

The hero H2 `32/40 w600` on Main Store is the one documented v4 display-size exception (inline,
not a new token). Sale-price pattern: current price 600 `atomicTangerine-600` + strike 400
`blueSlate-600` on one baseline row.

### 2.3 Spacing (round3 §2, 8pt grid)

`theme.extend.spacing`: `card-gutter` 32px (24px <768px), `card-padding` 24px,
`section-rhythm` 48px (40px mobile), `section-label-gap` 20px, `touch` 44px (a11y floor for
every tap target), `content-max` 1200px, `page-gutter` 48px (24px mobile). Values live as CSS
custom properties in `frontend/src/styles` so the media-query switches (`--card-gutter`,
`--ops-page-pad`, …) work; Tailwind classes reference the vars.

### 2.4 Component tokens (round3 §3–§4)

Built as `@layer components` classes (or Tailwind `@apply` tokens) — one implementation,
used everywhere:

- **Pill badges** — single pill (radius 999px, 4×10px pad, `badge` type, 14px icon + 4px gap,
  `nowrap`), three fills: on-sale `strawberryRed-600`/white; featured `tuscanSun-500`/
  `blueSlate-950` + 1px `tuscanSun-600` border; low-stock `carrotOrange-500`/`blueSlate-950` +
  1px `carrotOrange-600` border. Placement fixed (sale/out top-left, featured top-right,
  low-stock bottom-left, 8px inside the tile).
- **CTA buttons** — filled, min 44px, 8px radius, 150ms background-color transition only:
  idle `atomicTangerine-600` → hover `-700` → active `-800`, white 14/500 label; disabled
  `blueSlate-100` fill + `blueSlate-400` label; loading keeps the 600 fill, label → spinner,
  `aria-busy`. Secondary: white fill, 1px `blueSlate-200` border, `blueSlate-950` label,
  hover fill `blueSlate-100`. Destructive: `strawberryRed-600` stack. "Load more / See more"
  is a filled 44px button (320px desktop, full-width mobile); exhaustion replaces it with a
  13/400 `blueSlate-700` "All N products shown" line.
- **Product tiles** — 4:3, 8px radius, 135° two-stop gradient of the category-mapped family
  (Audio `tuscanSun-50→400`, Smart Home `seagrass-50→400`, Gaming `atomicTangerine-50→400`,
  Laptops & PC `blueSlate-50→400`, Accessories `carrotOrange-50→400`, Wearables
  `strawberryRed-50→400`, unmapped → `blueSlate`); 40px stroke-1.5 `blueSlate-900` React-Icon
  glyph, decorative (`aria-hidden`). Out of stock: tile `opacity .4` + `strawberryRed-100`/
  `-700` "Out of stock" pill.
- **Card grid** — `repeat(N, minmax(0,1fr))` + `min-width:0` on grid items (the measured fix:
  no 2075px scroll at 1280px viewport), equal row heights, CTA row pinned `margin-top:auto`,
  12px internal card rhythm.
- **States** — loading: static `blueSlate-100` skeletons (no shimmer; `prefers-reduced-motion`
  kills all transition); empty: centered 20/600 heading + 14/400 helper + one primary CTA;
  error: `strawberryRed-100` panel / `-700` text + "Try again" (`strawberryRed-600` fill).
- **Status chips (order machine, color-tokens §3)** — pending `tuscanSun-100`, processing
  `seagrass-100`, shipped `blueSlate-100`, delivered `willowGreen-100`; text
  `blueSlate-900` 12/600, glyph + label inside the pill (never color-only).
- **Role badges (color-tokens §5)** — buyer `atomicTangerine`, staff `carrotOrange`, manager
  `seagrass`, admin `strawberryRed`: `<accent>-100` fill + `<accent>-700` text + 1px
  `<accent>-300` border.
- **Ops shell (control-panel v4)** — `--ops-sidebar-w: 230px` (`.ops-sidebar`, `flex:none`,
  `blueSlate-900`, active item `blueSlate-800` + 3px `atomicTangerine-500` left bar, `nbadge`
  `strawberryRed-600` white 12/600 pill); **the gutter is `.ops-content` padding**
  `--ops-page-pad: 32px` desktop / 24px mobile, declared as a class rule (specificity 0,1,0)
  so no reset/preflight can zero it; shell `min-height:100dvh`; mobile sidebar = off-canvas
  drawer behind a 56px top bar.
- **A11y floor (round3 §7)** — focus ring 2px `atomicTangerine-500` offset 2 on every
  interactive element; 44×44px touch floor; keyboard order = DOM order; reduced-motion safe;
  no text below 12px.

The mockup conformance gate (`_mockup-build/verify_framework.sh`) is the QA reference for the
build: no out-of-scale hex, weight ≤ 600, 8pt spacing.

## 3. Folder structure

The app lives in **`frontend/` at the repo root, sibling of `docs/`** — `docs/` holds
the design + planning docs, `frontend/` is the Vite app. Every `src/...` path in the
planning docs is relative to `frontend/` (i.e. `frontend/src/data`, etc.).

```
repo/
├─ frontend/                 — the Vite app (package.json, vite.config, tailwind.config)
│  ├─ src/
│  │  ├─ components/   — shared UI primitives: buttons (primary/secondary/destructive
│  │  │                  stacks), pill badges, status chips, role badges, product tiles,
│  │  │                  quantity stepper, star rating, toasts, skeletons, confirm
│  │  │                  dialog, receipt table
│  │  ├─ layout/       — StorefrontHeader (logo / search / cart badge / account menu),
│  │  │                  OpsShell (v4 gutter spec: sidebar + content), AuthLayout
│  │  │                  (two-panel brand + form card, shared by Login/Register)
│  │  ├─ pages/        — one page component per route (14 routes incl. the ops pages)
│  │  ├─ router/       — the single route tree + RBAC route guards (role list per route,
│  │  │                  redirect rules, deep-link paths)
│  │  ├─ data/         — mock entities (products, orders, reviews, users, categories,
│  │  │                  stock) + the mock API module that mirrors the future Express
│  │  │                  endpoints
│  │  ├─ hooks/        — useAuth, useCart (CartStore context), usePoll (status
│  │  │                  refetch), useDebounce (search), useQueryParams (filter state)
│  │  └─ styles/       — Tailwind entry, token CSS variables (spacing/ops/ground),
│  │                     component-layer classes, Roboto font import
│  └─ public/          — static assets: hero-banner + 6 category images, font fallbacks,
│                        favicon
└─ docs/                  — the design + planning docs this tree is built from
```

## 4. Dummy data design

All sample records are exactly the data the committed mockups render (generator arrays in
`_mockup-build/pages_storefront.py` / `pages_ops.py`). Where two mockup views rendered
different values for the same field at different rounds, the data layer is the single
source of truth and the views derive from it (noted inline where relevant).

### 4.1 Entity shapes

Plain JavaScript (no TypeScript). The shapes below are documented as field lists; in
`frontend/src/data` they exist as JSDoc-style comments on the arrays/modules (e.g.
`/** @typedef {Object} Product */`) — never `.ts` files or `interface`/`type` blocks.

**Enumerations (allowed values):**

| name | values |
|---|---|
| `Role` | `"buyer"` · `"staff"` · `"manager"` · `"admin"` |
| `OrderStatus` | `"pending"` · `"processing"` · `"shipped"` · `"delivered"` (locked machine) |
| `ReviewState` | `"public"` · `"hidden"` (round-6: no pending/approved, no delete) |
| `CategorySlug` | `"audio"` · `"smart-home"` · `"gaming"` · `"laptops"` · `"accessories"` · `"wearables"` |

**Field lists (one block per entity):**

`Category` — `slug` (CategorySlug; "audio" … "wearables", main-store tile deep-link contract) ·
`label` ("Audio", "Smart Home", …).

`SpecPair` — `key` (string) · `value` (string); ordered, per product (round-9 specs editor).

`Product` — `id` ("P-231") · `name` · `brand` · `category` (CategorySlug) · `price`
(integer IDR; Rp 1.290.000 = 1290000) · `originalPrice` (optional; strike price when
`onSale`) · `onSale` (optional bool; renders "−X%" / "On sale" pill, X derived from
`originalPrice`) · `featured` (optional bool; top-right Featured pill, single SHOP-ALL
grid, no strip) · `stock` (current quantity, single source of truth) ·
`lowStockThreshold` (5 — "Only N left" pill when 1..5, "Out of stock" at 0) ·
`description` · `image` (gradient tile key or asset ref — tiles are CSS, not photos) ·
`specs` (SpecPair[], e.g. P-231: 6 pairs, Model … Weight) · `createdAt`.

`OrderLine` — `productId` · `name` (denormalized display name at order time) · `unitPrice`
(IDR at order time; may differ from current catalog price) · `qty` · `amount`
(unitPrice × qty).

`Order` — `id` ("WB-1042"; client-generated on create for idempotency) · `buyer`
(anonymized handle, e.g. "jordan.wjy") · `buyerContact` `{ name, email?, phone?, note? }` ·
`shippingAddress` `{ address, district, city, province, postalCode }` · `paymentMethod`
("card" | "bank-transfer" | "qris"; round-9 checkout step 3) · `createdAt` ("19 Sep
12:04") · `status` (OrderStatus) · `lines` (OrderLine[]) · `subtotal` · `shipping`
(0 renders "Free") · `total` (subtotal + shipping) · `reviewed` (productIds already
rated; gates the review form).

`SellerComment` — `text` · `at`.

`Review` — `id` · `productId` ("P-231") · `buyer` (anonymized, "buyer_102") · `orderId`
(provenance, "#WB-0987") · `rating` (1–5, v1 assumption, open decision #10) · `body` ·
`state` (ReviewState; public on submission (auto-approve); hidden = not publicly
visible) · `sellerComment` (optional SellerComment; renders beneath the review on
Product Details while public) · `createdAt`.

Note: hidden reviews keep counting in the "N reviews" total (total = public + hidden)
and, per the v1 data-layer decision, in the rating average.

`User` — `username` ("buyer_102", "ops_marta", "admin_ria" …) · `email` · `role`
(Role) · `active` (false → login shows "Account not available") · `lastActiveAt`
("2h" style relative display).

`StockSnapshot` — `productId` · `quantity` · `source` ("order-decrement" | "manual-set"
| "init") · `updatedAt` (audit view of stock changes, entity "stock").

`CartLine` — `productId` · `qty` (client-side, CartStore).

### 4.2 Sample records (mockup-consistent)

**Categories (6):** `audio/Audio`, `smart-home/Smart Home`, `gaming/Gaming`,
`laptops/Laptops & PC`, `accessories/Accessories`, `wearables/Wearables`.

**Products (48 total; the 12 named below are the mockup set, the rest synthesized to reach 48):**

| id | name | brand | category | price (IDR) | stock | flags |
|---|---|---|---|---|---|---|
| P-231 | Sony WF-C710N Wireless Earbuds | Sony | audio | 1 290 000 (was 1 518 000, −15%) | 34 | onSale, featured |
| P-198 | Anker 735 Power Bank 20 000 mAh | Anker | accessories | 380 000 | 5 | featured, low |
| P-140 | Logitech MX Keys S | Logitech | accessories | 415 000 | 3 | featured, low |
| P-087 | Razer BlackWidow V3 | Razer | gaming | 240 000 | 2 | featured, low |
| P-052 | Apple MacBook Air M3 13″ | Apple | laptops | 17 499 000 | 7 | — |
| P-111 | JBL Charge 5 Speaker | JBL | audio | 1 899 000 | 12 | onSale |
| P-064 | ASUS RT-AX58 Wi-Fi 6 Router | ASUS | smart-home | 549 000 | 0 | out of stock |
| P-208 | Anker 65 W GaN Charger | Anker | accessories | 259 000 | 21 | — |
| P-173 | Samsung Galaxy Watch6 | Samsung | wearables | 1 650 000 | 18 | — |
| P-088 | Razer BlackShark V2 Pro | Razer | gaming | 450 000 | 9 | — |
| P-071 | Xiaomi Mi Smart Bulb 2 | Xiaomi | smart-home | 120 000 | 40 | — |
| P-089 | Logitech G Pro X Superlight | Logitech | gaming | 999 000 | 6 | — |

`P-231.specs` (the round-9 editor pre-fill, same 6 pairs as the product-details table):
Model `WF-C710N` · Bluetooth `5.3, multipoint` · Battery `13 h w/ case` · ANC `yes` ·
IP rating `IPX4` · Weight `5.4 g per bud`.

**Orders (queue + history; counts per the ongoing-orders tabs: All 42 / Pending 9 /
Processing 5 / Shipped 3 / Delivered):**

| id | created | status | lines | subtotal | shipping | total | buyer |
|---|---|---|---|---|---|---|---|
| WB-1042 | 19 Sep 12:04 | pending | P-231 ×1 @ 1 290 000 · P-198 ×1 @ 280 000 | 1 570 000 | 100 000 | **1 670 000** | jordan.wjy |
| WB-1039 | 18 Sep 09:11 | processing | P-087 ×1 @ 240 000 | 240 000 | 0 (Free) | 240 000 | — |
| WB-1036 | 18 Sep 07:42 | pending | 3 lines | — | — | 2 030 000 | — |
| WB-1031 | 17 Sep 16:20 | pending | P-064 ×1 @ 549 000 | 549 000 | 0 | 549 000 | — |
| WB-0987 | 12 Sep 2026 | delivered | P-231 ×1 @ 1 290 000 | 1 290 000 | 0 | 1 290 000 | buyer_102 |

`WB-1042.shippingAddress` = Jl. Kemang Selatan 12, Jakarta Selatan. Order line unit prices are
snapshots at order time — `WB-1042`'s Anker line @ 280 000 is the mockup value even though the
current catalog price is 380 000.

**Reviews on P-231 (128 total = 122 public + 6 hidden; average 4.3):**

| sample | rating | body | buyer · order | state | seller comment |
|---|---|---|---|---|---|
| R-…01 | 4★ | "Solid build, ANC keeps up on the train…" | buyer_102 · #WB-0987 · 12 Sep 2026 | public | "Thanks — firmware 2.1 improved ANC." (14 Sep) |
| R-…02 | 5★ | "Fast charge, great for travel" | buyer_207 · Anker 735 PB ×1 · #WB-0951 | public | "We ship the 20 000 mAh variant — 36 h max." |
| R-…03 | 3★ | "OK sound, case is bulkier than expected" | buyer_348 · #WB-0922 | public | — |
| R-…04 | 2★ | "Arrived cracked in the mail" | buyer_311 · #WB-0890 | **hidden** | "Replacement shipped — order #WB-0901." |

**Users (128 total · 3 staff · 2 managers · 1 admin; the 5 named below are the mockup set):**

| username | role | active | last active |
|---|---|---|---|
| buyer_102 | buyer | active | 2d |
| ops_marta | staff | active | 1h |
| ops_dan | manager | **disabled** | 40d |
| rian_w | buyer | active | 6d |
| admin_ria | admin | active | 2h |

**Mock credentials (the `mockApi.login(email, password)` table — one row per role, plus the
two edge cases; `frontend/src/data` seeds this verbatim so login is buildable):**

| case | username | role | email | password | result |
|---|---|---|---|---|---|
| buyer | buyer_102 | buyer | buyer_102@mock.local | sunset123 | 200 → Main Store |
| staff | ops_marta | staff | marta@mock.local | sunset123 | 200 → Ongoing Orders |
| manager | ops_rina | manager | rina@mock.local | sunset123 | 200 → Inventory Dashboard |
| admin | admin_ria | admin | ria@mock.local | sunset123 | 200 → Inventory Dashboard |
| disabled account | ops_dan | manager | dan@mock.local | sunset123 | 403 "Account not available — contact an administrator" |
| duplicate email (register 409) | rian_w | buyer | rian@mock.local | sunset123 | `register` with any existing email (e.g. rian@mock.local) → 409 duplicate |
| bad credentials | — | — | anyone / wrong pw | — | 401 "Email or password is incorrect." |

All v1 mock passwords are `sunset123` (≥8 chars, satisfying the login form's min-length
validation). The register page's 409 duplicate-email state exercises against any of these.

**Cart (mock session):** P-231 ×1 @ 1 290 000 + P-198 ×1 @ 380 000 ("Low · 5 left" hint) →
subtotal **Rp 1.670.000**.

### 4.3 Mock API module shape + API contract placeholders

`frontend/src/data` exports the arrays above plus a `mockApi` object of
Promise-returning functions (with simulated latency) shaped exactly like the future
Express endpoints, so swapping to the real backend touches one module:

**Mock mutation semantics (decided):** there is **ONE shared mock store** — the
arrays above, held as module-level singletons in `frontend/src/data`. Every reading
and writing `mockApi` function operates on that store, so mutation actions **mutate it in place and
other `mockApi` reads reflect the mutation**: `createOrder` adds an order row + decrements
`product.stock` per line; `advanceOrderStatus` moves the order's status forward; `setStock`
sets the product's stock (and appends a `StockSnapshot` audit row); `setReviewHidden` /
`setSellerComment` / `submitReview` update the review records (totals recompute from the
store, hidden reviews keep counting in the total + average); `setUserRole` / `setUserActive`
update the user record; `createProduct` / `updateProduct` upsert the product. `CartStore`
is the one exception — client-side session state, not part of the shared store, and
excluded from persistence (it refreshes empty; P4's concern, see `api/cart.js`).

**Durability ruling (P2b, §4.5):** the 5 mutable slices (products, orders, reviews,
users, stock) **retain across reloads** — the store hydrates from the versioned
localStorage key `sunset-mock-data-v1` (`persistence.js`) at module load and every
writing `mockApi` function commits the slices to that key after its mutation
(synchronous, small payload). A corrupt or version-mismatched snapshot falls back to
the pristine `seed/` arrays and the stale key is cleared. Categories are static seed
content (no CRUD in v1) and are **not** persisted. `mockApi.resetData()` is the
escape hatch: it removes the key, re-clones the seeds, and re-emits the pristine
snapshot.

| mockApi function | future Express endpoint | used by |
|---|---|---|
| `getProducts(filter?)` | `GET /products?query&category&brand&priceMin&priceMax&sort` | main-store, search-browse |
| `getProduct(id)` | `GET /products/:id` | product-details |
| `getProductReviews(id)` | `GET /products/:id/reviews` (public only; count/average include hidden) | product-details |
| `addToCart(line)` / `setQty(lineId, qty)` / `removeLine(lineId)` | `POST /cart/items`, `POST /cart/items/:id/qty`, `DELETE /cart/items/:id` | cart, product-details, main-store card CTA |
| `createOrder(payload)` — client-generated `id` for idempotent retry | `POST /orders` (stock validated first; 409 stock-conflict = alt-flow 3a) | checkout |
| `getMyOrders()` | `GET /orders/mine` | orders-placed |
| `submitReview(orderId, productId, rating, comment)` | `POST /orders/:id/reviews` | orders-placed |
| `getOrders(statusTab?)` | `GET /ops/orders?status=` | ongoing-orders |
| `advanceOrderStatus(id, status)` | `PATCH /orders/:id/status` (forward-only v1) | ongoing-orders |
| `getStockOverview()` | `GET /ops/products` | inventory-dashboard |
| `setStock(id, qty)` | `PATCH /products/:id/stock` | inventory-dashboard |
| `createProduct(form)` / `updateProduct(id, form)` — form includes specs pairs + stock | `POST /products`, `PATCH /products/:id` | per-product-dashboard |
| `getProductReviewsAll(productId)` (public + hidden) | `GET /ops/reviews?product=P-231` | review panel |
| `setReviewHidden(reviewId, hidden)` | `PATCH /reviews/:id/hidden` | review panel |
| `setSellerComment(reviewId, text)` | `PUT /reviews/:id/seller-comment` | review panel |
| `getUsers()` | `GET /ops/users` | user-dashboard |
| `setUserRole(id, role)` / `setUserActive(id, active)` | `PATCH /users/:id/role`, `PATCH /users/:id/active` | user-dashboard |
| `login(email, pw)` / `register(payload)` | `POST /auth/login` (returns role → routing), `POST /users` (409 duplicate) | login, register |

Guard note: RBAC is enforced client-side at route level for the mock build; the backend will
enforce the same matrix server-side (Sheets-report "Implications" — the permission matrix is
the RBAC spec).

### 4.4 Data file split (`frontend/src/data`)

The mock data layer is split into one `.js` per future API section, inside
`frontend/src/data/`. Every section module reads/writes the single shared in-memory
store (`store.js`) and exposes its `mockApi` function group; the facade (`mockApi.js`)
re-exports one object whose full function list equals the §4.3 "mockApi function"
column — **this facade is the ONE module the future Express backend replaces**, so the
swap touches a single import. Plain JavaScript only (no `.ts`), no new runtime
dependencies (the pinned stack + Vite/linter dev tooling only).

```
frontend/src/data/
├─ index.js            — public re-export surface for the app: `import { mockApi } from '@/data'`
├─ mockApi.js          — the facade: one `mockApi` object = the §4.3 function list
│                        + `resetData()` (the P2b escape hatch, §4.5), assembled
│                        from the section modules below (single-swap target)
├─ store.js            — THE single shared mock store: the mutable seed arrays as
│                        module-level singletons + the §4.3 mutation helpers
│                        (createOrder / advanceOrderStatus / setStock / submitReview /
│                        setReviewHidden / setSellerComment / setUserRole /
│                        setUserActive / createProduct / updateProduct / register) +
│                        P2b durability: hydrate from the versioned localStorage key
│                        at load (seed fallback on corrupt/stale), commitStore() after
│                        every write, resetStore() re-seed (§4.5)
├─ persistence.js      — P2b hydrate + commit helpers over localStorage under the
│                        versioned key `sunset-mock-data-v1` (§4.5): readSnapshot /
│                        clearSnapshot / writeSnapshot
├─ seed/               — the §4.2 sample records, one file per entity (the pristine source
│                        the store clones at load):
│  ├─ categories.js    — 6 Category records (audio / smart-home / gaming / laptops /
│  │                      accessories / wearables)
│  ├─ products.js       — 48 products: the 12 named from §4.2 verbatim (P-231, P-198,
│  │                       P-140, P-087, P-052, P-111, P-064, P-208, P-173, P-088, P-071,
│  │                       P-089) + 36 synthesized; P-231 carries the 6 round-9 spec pairs
│  ├─ orders.js         — WB-1042 (2 lines, 1 570 000 + 100 000 = 1 670 000, pending,
│  │                       jordan.wjy, Jl. Kemang Selatan 12), WB-1039, WB-1036, WB-1031,
│  │                       WB-0987 (delivered, buyer_102)
│  ├─ reviews.js        — P-231: 128 total = 122 public + 6 hidden, avg 4.3; the §4.2
│  │                       four samples (buyer_102 4★ + seller comment; buyer_311 2★
│  │                       hidden + replacement comment) + synthesized to 128
│  ├─ users.js          — 128 users (3 staff · 2 managers · 1 admin; the §4.2 named 5
│  │                       incl. ops_dan disabled) + the §4.2 mock LOGIN CREDENTIALS
│  │                       table (role → email → password + disabled + duplicate-email
│  │                       case) so login/register are buildable
│  └─ stock.js          — StockSnapshot audit rows (order-decrement / manual-set / init)
│                         for the §4.2 stock rows
└─ api/                — one section module per API area; each exports its `mockApi`
                         function group wired to store.js, shaped EXACTLY like the §4.3
                         endpoint column (same names/params), with simulated latency +
                         per-section optional failure injection (`failure` flag):
   ├─ categories.js     — getCategories (the one static extra; §4.3 has no endpoint row)
   ├─ products.js       — getProducts, getProduct, createProduct, updateProduct
   ├─ orders.js         — createOrder, getMyOrders, submitReview, getOrders,
   │                       advanceOrderStatus
   ├─ reviews.js        — getProductReviews, getProductReviewsAll, setReviewHidden,
   │                       setSellerComment
   ├─ users.js          — getUsers, setUserRole, setUserActive, login, register
   ├─ stock.js          — getStockOverview, setStock
   └─ cart.js           — addToCart, setQty, removeLine (+ getCart/clearCart helpers)
                           = the CartStore exception: client session state, NOT part of
                           the shared store
```

Contract notes baked into the modules:

- **Counts are derived, not hard-coded.** `getProducts`/`getOrders`/`getProductReviews`
  report the real count the store holds; a no-filter search renders "48 results"
  (the 48-product catalog) and the review panel "128 total". The §4.2 "128 results" /
  "All 42 / Pending 9" figures are the mockups' *illustrative* queue-search counts, and
  — per §4's "data layer is the single source of truth, views derive from it" rule —
  the live view renders whatever the store holds, not those literals.
- **Order-time price snapshots.** `createOrder` snapshots each line's unit price from
  the current catalog at order time (WB-1042's Anker line @ 280 000 even though the
  catalog price is 380 000). Stock is validated first → 409 `STOCK_CONFLICT` drives
  checkout alt-flow 3a; the client-generated order id makes retry idempotent (alt-flow
  5a) — a repeated id returns the existing order, it is not duplicated.
- **Refresh = retained state (P2b, §4.5).** The store hydrates the 5 mutable slices
  from the versioned localStorage key `sunset-mock-data-v1` at module load when a valid
  snapshot exists (version match + shape check + JSON.parse OK); otherwise it falls back
  to a deep-clone of the `seed/` arrays and clears the stale/corrupt key. A cross-page
  mutation (advance WB-1042, set P-087 stock, hide a review, change a role) now **retains
  across a reload** instead of resetting to the pristine sample records.

### 4.5 Persistence (P2b durable mock store)

`persistence.js` (browser built-ins only — localStorage + JSON, no new dependencies)
owns the versioned key **`sunset-mock-data-v1`**, storing
`{ version: 1, savedAt, slices: { products, orders, reviews, users, stock } }`:

- **Hydrate** (`readSnapshot`): at `store.js` module load, a valid snapshot
  (version match + every slice an array of object rows + JSON.parse OK) wins over the
  seeds; a missing, corrupt, or version-mismatched value falls back to the pristine
  `seed/` clones and `clearSnapshot()` removes the stale key.
- **Commit** (`commitStore` → `writeSnapshot`): every writing `mockApi` function
  (`createOrder`, `advanceOrderStatus`, `setStock`, `createProduct`, `updateProduct`,
  `setReviewHidden` / `setSellerComment` / `submitReview`, `setUserRole`, `setUserActive`,
  `register`) commits the 5 slices synchronously after its in-memory mutation — the
  payload is small, no debounce. The key always mirrors the live store.
- **Reset** (`mockApi.resetData()` → `resetStore`): the API-only escape hatch —
  removes the key, re-clones the seeds in place, and re-emits the pristine snapshot.
  No UI affordance this phase (a P7 dev-only reset button may hook it later).
- **Not persisted (v1):** categories (static seed content, no CRUD) and the cart
  (CartStore session semantics, P4's concern — see `api/cart.js`).
