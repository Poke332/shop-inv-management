# Inventory — Final Project UI

Updated 22 October 2026 from the implemented React frontend.

- Route: `/ops/inventory`
- Access: Staff read-only; manager/admin edit
- Source: [InventoryPage.jsx](../../frontend/src/pages/InventoryPage.jsx)
- Shared visual rules: [UI system](../UI-SYSTEM.md)

## Layout and behavior

- Computed product/unit/low-stock/out-of-stock metrics, needs-attention list and inventory table.
- Staff cannot adjust stock. Manager/admin retain stock controls and editor links.
- Displayed quantities are computed from the current mock state, including local demo checkout effects.

## Current mockups

### mockup.jpg

![Inventory — mockup.jpg](mockup.jpg)

Data is fictional browser mock data. Screenshots describe the current interface; route guards, form validation and the data facade remain implemented in React. See [capture notes](../RENDER.md).
