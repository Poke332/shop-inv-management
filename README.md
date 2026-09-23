# shop-inv-management

**Online store + integrated stock-management panel** — a web application (and, at Final, a client mobile app) built by our team for the *Web & Mobile Application Development* course.

At the **Midterm (UTS)** we deliver the web application built on **hardcoded (fake) data** — no backend, no database, no real authentication. This repo currently contains the full **design layer** of that system: requirements analysis, per-page design specs, the color/typography token system, and the mockup build + verification pipeline. The hardcoded web app is the next build step on top of these designs, deployed to GitHub Pages.

> One continuous project in two stages: Midterm = web app on hardcoded data; Final = the same web app reconnected to a real backend (Express + SQLite), plus a Client-only mobile app and one AI-powered feature.

---

## Course context — what the Midterm requires

From the project description & requirements (`web_midterm_project_description_and_requirements`):

- Build **3–4 related web pages**: **Login**, **Menu/navigation**, **Dashboard**, and **one form page** (an "add"/"edit" form relevant to the topic — e.g. register a buyer account or add a product).
- Data source: **hardcoded** in the frontend (a JS array/object). No backend, no API calls, no database.
- Two roles: **Administrator** (provider side — in our system: the store operator) and **Client** (the buyer). At Midterm there is no mobile app, so **both roles are represented inside the web app**: the same Menu/Dashboard pages **conditionally render** different content depending on the logged-in role.
- Login is a **simulation only**: a hardcoded user list with `username`, `password`, and `role`; on submit, match and store the role in state, then navigate. No JWT, no third-party auth, no encryption.
- Graded on: the core flow working for **both roles** (login → menu/dashboard → form), handling of **loading / empty / error states**, a **genuine incremental commit history**, and being able to **explain every part of the code** on request. Not graded on visual polish or extra features.
- Deployment: **GitHub Pages** (static hosting only).

Our scope decision: the 13-page design system below covers the *complete* system we will build through to Final; the Midterm web app implements the 4-page core (Login, Main Store / menu, role-conditional Dashboard, form page) on hardcoded data, keeping components organized so they plug into the real backend later.

## Roles (strict hierarchy, from the `plan-web` requirements sheet)

| Role    | Who / what they can do                                                        |
|---------|-------------------------------------------------------------------------------|
| buyer   | registers/logs in, browses the catalog, buys, reviews purchased items          |
| staff   | daily transaction ops: order status, product alerts. No product/stock CRUD     |
| manager | product + stock CRUD, order status, review moderation                          |
| admin   | everything, plus user-account management (role changes, disable)              |

Full 14-permission RBAC matrix: see `Sheets-report.md`.

## Pages (13 + shared shell)

**Storefront (buyer):**

| Page | Doc | Notes |
|---|---|---|
| Login | `docs/login/design.md` | email+password; post-login routing: buyer → store, staff/manager/admin → dashboard |
| Register | `docs/register/design.md` | shares the two-panel `AuthLayout` with Login; input validation |
| Main Store | `docs/main-store/design.md` | catalog + featured items, category tiles; shared `StorefrontHeader` + `ProductCard` |
| Search / Browse | `docs/search-browse/design.md` | filter rail (category, price, brand) + free-text search over the same grid |
| Product Details | `docs/product-details/design.md` | image, description, price, stock, reviews; Add-to-Cart. Only storefront page all 4 roles may open |
| Cart | `docs/cart/design.md` | items, quantities, subtotal; order flow Cart → Checkout → Orders Placed |
| Checkout | `docs/checkout/design.md` | 3-step wizard (Personal / Shipping / Payment) + receipt confirmation; implements the sheet's checkout use case incl. out-of-stock and connection-failure states |
| Orders Placed | `docs/orders-placed/design.md` | order history + status tracking; home of the buyer's review form |

**Operations panel (staff/manager/admin):**

| Page | Doc | Roles |
|---|---|---|
| Inventory Dashboard | `docs/inventory-dashboard/design.md` | stock overview + replenishment alerts |
| Ongoing Orders | `docs/ongoing-orders/design.md` | fulfillment console, status machine `pending → processing → shipped → delivered` |
| Per Product Dashboard | `docs/per-product-dashboard/design.md` | add/edit product listings (name, price, description, image, category, initial stock) |
| Per Product Review Panel | `docs/per-product-review-panel/design.md` | approve / hide / delete reviews |
| User Dashboard | `docs/user-dashboard/design.md` | user accounts, roles, disable — most sensitive feature, strict route protection |

All five ops pages share the app-shell layout spec in `docs/control-panel/design.md` (230px sidebar, 8pt-grid content gutter).

Each page folder contains `design.md` (features, wireframe notes, color usage) and `mockup.png` — a pixel-stable render of the page (checkout has per-step mockups; main-store also ships hero + 6 category images).

## Repo structure (all files)

```
shop-inv-management/
├── README.md                        ← this file
├── AGENTS.md                        ← standing rules for AI agents working in this repo (branch/PR policy, inputs)
├── .gitignore
├── COLORS-draft.md                  ← "Sunset Glow" palette (source of truth for color names)
├── Sheets-report.md                 ← full requirements analysis of the plan-web Google Sheet
│                                      (roles, 14-permission matrix, 13 pages, checkout use case,
│                                       locked decisions, open decisions, known gaps)
│
├── docs/                            ← the design layer
│   ├── color-tokens.md              ← resolved color-token scale (7 families × 11 weights)
│   ├── design-tokens-round3.md      ← typography (Roboto 400/500/600), 8pt spacing grid,
│   │                                    component conventions (badges, CTA stack, surfaces)
│   ├── RENDER.md                    ← step-by-step recipe to re-render + verify all 13 mockups
│   │                                    and run the conformance gate
│   ├── control-panel/design.md      ← shared ops app-shell spec (5 pages)
│   └── <page>/design.md + mockup.png×13 pages (list above)
│
└── _mockup-build/                   ← the mockup pipeline (generators + gates; out/ is gitignored)
    ├── lib.py                       ← shared HTML framework: shells, tokens, components
    ├── pages_storefront.py          ← storefront page generators (login, register, main-store,
    │                                    search-browse, product-details, cart, checkout, orders-placed)
    ├── pages_ops.py                 ← ops page generators (inventory, ongoing-orders,
    │                                    per-product ×2, user-dashboard)
    ├── pages_auth.py                ← auth-page generators (login, register)
    ├── build_html.py                ← regenerates out/<page>.html for all 13 pages from lib.py
    ├── render.py                    ← headless-Chromium render driver (html → png)
    ├── rebuild_docs_png.sh          ← one command: render all 13 + sync docs/ + md5-verify
    ├── verify_framework.sh / .cjs   ← conformance gate: out-of-scale hex, font-weight, 8pt grid,
    │                                    framework-line deletions since the lock commit
    ├── verify.cjs                   ← generic verification helper
    ├── capture_bottom.cjs, capture_checkout.py, co_captures.py
    │                                  ← one-off screenshot helpers (below-fold, checkout steps)
    └── out/ verify/ …               ← generated, gitignored (regenerable; see docs/RENDER.md)
```

Regenerating or verifying the mockups: follow `docs/RENDER.md` (5 steps, ~1 minute, all from tracked files).

## Rough data sketch (first-draft data model — will evolve)

Per the midterm requirements, a rough sketch of the two records the system revolves around (plus the two supporting ones). Hardcoded as JS arrays at Midterm; becomes the SQLite schema at Final:

**Product**
| field | type | notes |
|---|---|---|
| id | int | primary key |
| name | string | |
| description | string | |
| price | number | currency per unit |
| category | string | one of the 6 storefront tiles (laptops, audio, smart home, gaming, accessories, wearables) |
| brand | string | search axis |
| image | url | |
| stock | int | decremented on successful order (locked decision) |

**Order**
| field | type | notes |
|---|---|---|
| id | int | |
| buyerId | int | FK → user |
| items | [{productId, qty, price}] | price snapshotted at purchase |
| total | number | sum of items |
| status | enum | `pending → processing → shipped → delivered` (buyer read-only, PATCH by staff+) |
| shippingAddress | {name, address, city, phone} | from checkout step 2 |
| createdAt / updatedAt | timestamp | |

**Review** — `id, orderId+productId (purchase-gated), buyerId, rating, comment, status: pending/approved/hidden (moderated by manager+)`

**User** — `id, email, password (hashed at Final; plain in the Midterm hardcoded list), role: buyer/staff/manager/admin, active`

## Roadmap

| Stage | Deliverable | Data source |
|---|---|---|
| Midterm (now) | Web app: login, menu, role-conditional dashboard, form — both roles — deployed to GitHub Pages | Hardcoded |
| Mid-course (not separately graded) | Same web app reconnected to our own Express + SQLite backend | Real database |
| Final | Web (admin + client) + mobile (client only) + shared backend + 1 AI feature, fully deployed | Real database |

## Git workflow

`main` is PR-protected — all changes land via feature branch + PR (`docs/<topic>`, `feat/<topic>`, `fix/<topic>`). See `AGENTS.md` for the full policy.
