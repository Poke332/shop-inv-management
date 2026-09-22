# Understanding of the `plan-web` Google Sheet

Source: Google Sheet "plan-web" (ID `107VcwXpwcp1eM1lAuxlMxr0fU5TY5YxQ-sgfxxOYPQE`), read 2026-09-20 by the google-manager profile (task `t_0af0818b` on the `web-mobile-project` board; full raw read report is in that task's completion result and final comment).

## What the sheet is

A requirements-only planning document for this project: an **online store with an integrated stock-management panel**. It defines *who can do what on which page* (Sheet1) and *how the purchase behaves* (Sheet2). There is no architecture, tech stack, schema, or API contract in it — those are open.

## Roles (4, strict hierarchy)

| Role    | Scope                                   |
|---------|------------------------------------------|
| buyer   | registers/logs in, browses, buys, reviews purchased items |
| staff   | daily transaction ops: order status, product alerts. No product/stock CRUD |
| manager | product + stock CRUD, order status, review moderation |
| admin   | everything + user account management (role changes, disable) |

## Permissions (14)

| Permission              | Buyer | Staff | Manager | Admin |
|-------------------------|:-----:|:-----:|:-------:|:-----:|
| login/register          | T | T | T | T |
| purchase product        | T | F | F | F |
| add product to cart     | T | F | F | F |
| check purchase status   | T | T | T | T |
| update purchase status  | F | T | T | T |
| browse product          | T | F | F | F |
| view product details    | T | T | T | T |
| review products bought  | T | F | F | F |
| moderate reviews        | F | F | T | T |
| add new product         | F | F | T | T |
| update stock quantity   | F | F | T | T |
| change product details  | F | F | T | T |
| product update alerts   | F | T | T | T |
| manage user accounts    | F | F | F | T |

Note: "browse product" is buyer-only in the matrix, but the implementation notes say the catalog page is accessible to *buyer & staff only* — internal inconsistency.

## Pages (13)

| #  | Page                     | Primary roles      | Note |
|----|--------------------------|--------------------|------|
| 1  | Login                    | buyer              | email+password; post-login routing: buyer → homepage, staff/manager/admin → dashboard |
| 2  | Register                 | buyer              | input validation |
| 3  | Main Store               | buyer              | catalog + featured items |
| 4  | Search/Browse            | buyer              | filters: category, price, brand + search bar |
| 5  | Product Details          | buyer              | image, description, price, stock, reviews; Add-to-Cart |
| 6  | Cart                     | buyer              | items, quantities, subtotal |
| 7  | Checkout                 | buyer              | finalizes and submits order |
| 8  | Orders Placed            | buyer              | order history + status tracking; review form lives here |
| 9  | Inventory Dashboard      | staff/manager/admin | stock overview + replenishment alerts |
| 10 | Per Product Dashboard    | manager/admin      | add/edit product listings |
| 11 | Per Product Review Panel | manager/admin      | approve/hide/delete reviews |
| 12 | Ongoing Orders           | staff/manager/admin | fulfillment console; status updates |
| 13 | User Dashboard           | admin              | user accounts, roles, disable — "most sensitive feature", strict route protection |

Storefront = pages 1–8 (buyer). Operations panel = pages 9–13.

## Checkout flow (Sheet2, the only detailed use case)

- Preconditions: buyer logged in; cart has ≥ 1 item.
- Basic flow: open Cart → click Buy/Checkout → system checks availability & stock → validates user/permissions → POST order via backend API, recorded with status **pending** → redirect to Orders Placed (confirmation).
- Alt flow 3a: out of stock → error message, checkout cancelled, no state change.
- Alt flow 5a: connection failure → failure notification, retry.
- Postconditions: pending order created, **stock updated** (decremented), confirmation shown.

## Decisions the sheet locks in

| Decision | Value |
|---|---|
| Order status machine | pending → processing → shipped → delivered |
| Order creation | POST; recorded as "pending"; stock validated first; on success stock decremented |
| Status change | PATCH; buyer is read-only on orders |
| Product create/edit | POST / pre-filled edit form; fields: name, price, description, image, category, initial stock; manager+admin |
| Reviews | buyer reviews only *purchased* items; manager/admin moderate (approve/hide/delete) |
| User mgmt | admin-only, behind strict route protection |
| Search axes | category, price, brand + free-text |

## Open decisions (need a call before build)

1. Alert channel: in-app badge/toast **or** email (and no notification infra is defined).
2. Stock editing UX: inline on the product table **or** edit-product form.
3. Cart persistence: session-based vs persisted across logout/devices.
4. Payment: no model at all — no gateway, refunds, or currency; orders just sit as "pending".
5. Stock-decrement conflict: Sheet2 says stock updates automatically on purchase, but "update stock quantity" is a manager/admin permission — clarify whether decrement is automatic, manual, or both.
6. Use-case diagram in the sheet omits the staff actor (only Buyer + Manager/Admin) — inconsistent with the 4-role matrix.
7. A "PAGE NAVIGATION FLOW (Image)" is referenced in Sheet1 but no such image exists in the workbook — that diagram is missing.
8. Page "Visible to" column says Main Store / Search / Product Details are buyer-only, contradicting the matrix that grants browse/view-detail to staff/manager/admin.
9. Review form location conflicts: implementation notes say order-history page; page list also attaches it to Product Details.
10. Review rating scale undefined (1–5? stars?).

## Gaps for a developer

No tech stack, no DB schema, no API endpoint shapes/payloads, no auth design (JWT vs sessions, hashing, role storage), no non-functional requirements (performance, scale, accessibility), no mobile/responsive requirements (notable, given the board's name), no seed data, no test strategy.

## Implications for this board's planning

- The natural build split: **storefront** (pages 1–8, buyer) vs **operations panel** (pages 9–13, staff/manager/admin) — maps cleanly onto frontend-coder / backend-dev / uiux-designer cards.
- Backend core entities: User (role), Product (category, price, image, stock), Order (status machine, line items), Review (status: pending/approved/hidden, purchase-gated), plus a notification mechanism.
- The permission matrix is the RBAC spec: route protection must enforce it server-side, and admin user-management needs the strongest guards.
- Before any data-layer work, the open decisions in §"Open decisions" (esp. #3 cart, #4 payment, #5 stock) should be resolved — they change the API surface and schema.
