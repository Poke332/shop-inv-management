# Operations orders — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/ops/orders`
- Access: Staff / manager / admin
- Source: [OngoingOrdersPage.jsx](../../frontend/src/pages/OngoingOrdersPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Order queue with status tabs, expandable receipts and forward-status actions.
- Detail deep link /ops/orders/WB-1042 expands the selected order.
- Existing pending → processing → shipped → delivered transitions are preserved.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/ongoing-orders/IMPLEMENTATION.md).
