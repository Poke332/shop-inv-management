# Shared operations workspace — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/ops/inventory`
- Access: Staff / manager / admin (role-specific controls)
- Source: [../layouts/OpsShell.jsx](../../frontend/src/layouts/OpsShell.jsx)
- [Current layout, behavior and screenshots](design.md)

- Dark shared sidebar, workspace header, role-filtered menu and sign out.
- Orders, Inventory and Products are available in the base ops tier; Reviews and Users follow their existing guards.
- Back to storefront is deliberately disabled according to the agreed access flow.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/control-panel/IMPLEMENTATION.md).
