# Checkout — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/checkout`
- Access: Buyer
- Source: [CheckoutPage.jsx](../../frontend/src/pages/CheckoutPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Numbered progress circles 1–2–3, Personal information, Shipping address and Payment.
- Existing validation, Back/Continue, Edit cart, stock conflicts, receipt and pending/to-be-settled order remain.
- Screenshots cover all three steps and the receipt using fictional local mock data.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/checkout/IMPLEMENTATION.md).
