# shop-inv-management

**Online store + integrated stock-management panel** ("Sunset Electronics") — a web application (and, at Final, a client mobile app) built by our team for the *Web & Mobile Application Development* course.

At the **Midterm (UTS)** we deliver the web application built on **hardcoded (mock) data** — no backend, no database, no real authentication. This repo currently contains:

- **`frontend/`** — the built web app: React SPA (Vite + Tailwind) with a full mock data layer that stands in for the future Express + SQLite backend. Implementation status per phase: see `docs/IMPLEMENTATION.md` — the storefront, cart/checkout, ops console, review panel, and the mobile buyer pass are done; P7 polish is the remaining phase.
- **`docs/`** — the design layer the app was built from: requirements analysis (`Sheets-report.md`), per-page design specs, the color/typography token system, and the phased implementation plan.
- **`_mockup-build/`** — the pixel-stable mockup render + verification pipeline.

> One continuous project in two stages: Midterm = web app on hardcoded data; Final = the same web app reconnected to a real backend (Express + SQLite), plus a Client-only mobile app and one AI-powered feature.

## Run it

```
cd frontend
npm install
npm run dev        # Vite dev server (default port 5173)
```

Mock login (every password is `sunset123`):

| Role | Login | Lands on |
|---|---|---|
| buyer | `buyer_102@mock.local` | Main Store (`/`) |
| staff | `marta@mock.local` | Ongoing Orders (`/ops/orders`) |
| manager | `rina@mock.local` | Inventory (`/ops/inventory`) |
| admin | `ria@mock.local` | Inventory (`/ops/inventory`) |

Guests (no login) can browse the main store, search, and open product pages; cart/checkout/orders require a buyer session. A first-visit session is pre-seeded with a demo cart (P-231 + P-198, Rp 1.670.000). The 5 mock-login credential rows + edge cases (403 disabled, 409 duplicate register) are shown on the login page and documented in `frontend/src/data/seed/users.js`.

Checks:

```
cd frontend
npm run lint                       # oxlint over src/
node src/data/smoke.test.js        # 36-assertion mock-data contract (32/32 gate)
npm run build                      # production build to dist/
```

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

## Data layer (how the "hardcoded data" is wired)

The Midterm data requirement is met by a mock API that mirrors the future Express endpoints, so the backend swap later is a one-module change (`frontend/src/data/mockApi.js`):

- **Seed data** (`src/data/seed/*`): 48 products (12 hand-authored + 36 synthesized), 6 categories, 5 mock orders, 128 reviews (122 public / 6 hidden, avg 4.3) on P-231, 128 users (3 staff / 2 managers / 1 admin / the rest buyers), and a stock audit trail (`init` → `order-decrement` / `manual-set` rows).
- **Mock API** (`src/data/api/*` + `mockApi.js` facade): 26 Promise-returning functions across 7 sections (categories, products, orders, reviews, users, stock, cart) — the same names the future Express routes will have.
- **Persistence**: the 5 mutable slices (products, orders, reviews, users, stock) persist to a versioned `localStorage` key and survive reloads; the cart keeps *session* semantics (`sessionStorage`, per the §4.5 ruling) and dies with the tab; `resetData()` in the dev-only `window.__sunset` bridge re-seeds everything.
- **Shape contract**: `node src/data/smoke.test.js` asserts 36 values (counts, averages, mockup-locked totals, credential edge cases) so a seed edit can't silently drift the mockup numbers.

The rough schema below is the same model, shown flat (it becomes the SQLite schema at Final):

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

## Repo layout

```
frontend/          the web app (see frontend/README.md)
docs/              per-page design specs + token docs + IMPLEMENTATION.md (phase status)
_mockup-build/     mockup render pipeline + verification scripts
Sheets-report.md   requirements analysis from the plan-web sheet
COLORS-draft.md    "Sunset Glow" palette (source of truth for color names)
```
