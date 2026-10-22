# User administration — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/ops/users`
- Access: Admin
- Source: [UsersPage.jsx](../../frontend/src/pages/UsersPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Search, derived user counts, role/status controls and account rows.
- Existing confirmation dialogs, disabled account presentation and own-account control protection remain.
- The mock source currently contains 127 users; UI counts are derived, not forced to a mockup total.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/user-dashboard/IMPLEMENTATION.md).
