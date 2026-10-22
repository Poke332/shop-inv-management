# My orders — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/orders`
- Access: Buyer
- Source: [OrdersPage.jsx](../../frontend/src/pages/OrdersPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Buyer order cards with expandable lines, status progress, totals and delivered-order reviews.
- The just-placed local mock order can be pinned and expanded. Buyers have no order-status editing action.
- Counts and records come from the mock state; screenshots are examples, not fixed target numbers.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/orders-placed/IMPLEMENTATION.md).
