# Product Requirements — Sunset Electronics (shop-inv-management)

## Purpose

Sunset Electronics is an **online store for electronics & gadgets with an integrated
stock-management console** — one system, two surfaces:

1. **Storefront** (buyer): browse the catalog, search/filter, open a product, keep a cart,
   check out a 3-step order flow, track placed orders, and review delivered purchases.
2. **Operations console** (staff/manager/admin): fulfill orders (status machine), monitor
   stock with replenishment alerts, manage products and their spec data, moderate reviews,
   and (admin) manage user accounts.

The source of requirements is the `plan-web` Google Sheet as analyzed in
`Sheets-report.md` (13 pages, 4 roles, 14 permissions, one detailed checkout use case);
the visual system is the committed Sunset Glow design tree (`docs/<page>/design.md`,
`docs/design-tokens-round3.md`, `docs/color-tokens.md`).

## Target audience

| Segment | Roles | What they get |
|---|---|---|
| **Buyer** (external) | `buyer` | Registers/logs in, browses the catalog, buys, reviews purchased items. All 4 roles can log in, but only buyers self-register — staff/manager/admin accounts are provisioned by an admin via the User Dashboard. |
| **Ops staff** | `staff` | Daily transaction ops: advance order statuses, see product-update alerts. No product/stock CRUD, no review moderation, no user management. |
| **Ops manager** | `manager` | Everything staff has, plus product + stock CRUD, review moderation (view all incl. hidden, seller comments, hide/unhide). |
| **Ops admin** | `admin` | Everything manager has, plus user account management (role changes, disable — the most sensitive feature, strict route protection). |

Permissions are the 14-row matrix in `Sheets-report.md` (strict hierarchy
buyer < staff < manager < admin). Two matrix inconsistencies in the sheet are carried as
documented assumptions in the page docs, not decisions here: "browse product" is buyer-only in
the matrix but the implementation notes say "buyer & staff" (most-likely interpretation used
through the docs: storefront is buyer-only; staff+ post-login-route to ops pages), and the
"view product details" row is the one storefront page all 4 roles may open (staff/manager/admin
see the read-only variant B — no purchase CTA, no cart).

## Problem it solves

- Buyers need a working catalog with a reliable **checkout flow**: Cart → Checkout →
  Orders Placed, with availability checked before the order is accepted, the order recorded
  `pending`, stock decremented on success, and a confirmation receipt (Sheet2 basic flow,
  locked).
- The store's operators currently have no place to **run the shop**: order fulfillment,
  stock replenishment, product listings, and review quality are all handled out-of-band. The
  ops console closes that loop — the same system that sells the product manages it.

## Locked behaviors (from the sheet + the finalized round-6/9 design decisions)

- **Order status machine (locked):** `pending → processing → shipped → delivered`,
  forward-only in v1. Orders are created `pending`; the buyer is read-only on their orders
  (status changes are staff+ via PATCH).
- **Checkout preconditions:** buyer logged in, cart ≥ 1 item, stock validated first;
  alt-flow 3a (out of stock on submit) cancels with no state change and clamps the
  conflicting line; alt-flow 5a (connection failure) offers retry with the same
  client-generated order id (no duplicate orders).
- **Stock:** decremented on successful purchase (Sheet2 postcondition; open decision #5
  resolved in favor of automatic — manager stock edits set absolute values and the UI copy
  warns accordingly). Low-stock threshold = 5 ("Only N left" pill on cards; "Needs
  attention" banner on the Inventory Dashboard; nav badge count).
- **Review moderation (round-6, a made decision superseding the sheet's
  approve/remove scope):** reviews are **public on submission** — no approval step, no
  delete. A review's status is `public` or `hidden`; manager/admin can hide/unhide and add
  or edit a **seller comment** (a merchant reply that renders publicly beneath the review
  while it is public). Hidden reviews stay out of the public list but keep counting in the
  total ("N reviews" = public + hidden) and in the rating average.
- **Review form home:** Orders Placed — per delivered order, per purchased product,
  1–5 stars (v1 assumption for open decision #10) + optional comment, purchase-gated,
  single-shot (sent state is non-re-openable). Product Details shows reviews read-only.
- **Post-login routing (locked):** buyer → Main Store; staff → Ongoing Orders;
  manager/admin → Inventory Dashboard.
- **User management (admin-only):** role changes + disable/enable (no delete; disabling is
  not deleting — a disabled user's next login shows "Account not available"). Self-protection:
  an admin cannot disable their own account; peer-or-higher role changes confirm via dialog.

## Open decisions carried as documented assumptions (not re-opened in v1)

Cart persistence = session-based; payment = designed step (Card / Bank transfer / QRIS,
round-9) with orders still settling as `pending` "Total (to be settled)"; alert channel =
in-app (nav badge + dashboard banner); stock-editing = inline quick-stepper on Inventory
Dashboard (number only) + full edit in the Per Product Dashboard form; rating scale = 1–5
stars. Each is flagged `TBD` in the owning page doc where the sheet left it open.

## Success criteria

- The buyer path works end to end on the mock data: catalog → product → cart → 3-step
  checkout → receipt → Orders Placed (new order on top, `pending`) → status timeline advances
  → review form on delivery.
- Each role sees exactly its matrix scope: no purchase CTA for non-buyers, no write controls
  for staff on stock/products, no Users nav item for non-admins, no 403 pages that name a
  hidden feature (non-actors get redirected, never an error screen).
- Every page matches its committed `docs/<page>/design.md` + mockup (tokens, states, a11y
  floor) at desktop 1280/1312px and mobile 390px — no horizontal scroll, 44px touch floor,
  focus rings, reduced-motion safe.
