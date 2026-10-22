# Inventory — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/ops/inventory`
- Access: Staff read-only; manager/admin edit
- Source: [InventoryPage.jsx](../../frontend/src/pages/InventoryPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Computed product/unit/low-stock/out-of-stock metrics, needs-attention list and inventory table.
- Staff cannot adjust stock. Manager/admin retain stock controls and editor links.
- Displayed quantities are computed from the current mock state, including local demo checkout effects.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/inventory-dashboard/IMPLEMENTATION.md).
