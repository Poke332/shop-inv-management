# User Dashboard — Implementation

Phase P5 (inside the ops app shell). Visual/interaction source:
`docs/user-dashboard/design.md` + mockup; shell gutter per
`docs/control-panel/design.md`. The **most sensitive feature** in the system — the
strongest route guard in the app.

## Route

- Path: `/ops/users` — roles: **admin only** (matrix "manage user accounts" F/F/F/T).
  The ops nav item itself is **admin-only** (staff/manager nav omits it — visibility
  gating, not just route guards). Non-admins hitting the URL get a 404-style redirect
  (to their ops home), **never an error page revealing the feature exists**. The API
  enforces the same rule server-side (RBAC enforced server-side — Sheets-report
  "Implications").

## Components

| Component | Responsibility |
|---|---|
| `UserDashboard` | Page inside `OpsShell`: "Users · [Admin only]" header + search + count summary line ("128 users · 3 staff · 2 managers · 1 admin") + `UserTable` + footer note; list paginated, "Load more" 50/page (assumption, flagged — consistent with the storefront load-more) |
| `UserTable` | Rows: name (`blueSlate-950` 14/600, min-width 190px), role badge pill (color-tokens §5: `<accent>-100` fill + `<accent>-700` text + 1px `<accent>-300` border — buyer `atomicTangerine`, staff `carrotOrange`, manager `seagrass`, admin `strawberryRed`), status pill (Active `willowGreen-100` / Disabled `strawberryRed-100`, text `blueSlate-900` 12/600 4×10; **disabled rows carry a 3px `strawberryRed-500` left bar**), "last active 2d" `blueSlate-700` 13/400, then `RoleSelect` + `StatusToggle` right-aligned. Search by name/email (`SearchInput` tokens: 44px min, `blueSlate-200` border, `atomicTangerine-500` focus ring, placeholder `blueSlate-500`) |
| `RoleSelect` | Per-user role select (native `<select>`, labelled): buyer/staff/manager/admin, 44px min height, 8px radius, `blueSlate-200` border; when **admin** is selected the value renders in `atomicTangerine-600`. Change → `ConfirmDialog` (naming the user + old → new role: "Change buyer_102 from buyer to manager? They gain product and order management." Confirm `atomicTangerine-600` filled stack / Cancel secondary, `strawberryRed-100` dialog bg + `strawberryRed-700` heading) → optimistic update + success flash ("Role updated to manager · ops_marta", `willowGreen-700` text on `willowGreen-100` tint + `willowGreen-300` border), failure → `strawberryRed` toast + row reverts |
| `StatusToggle` | Enable/disable switch (44px hit area; track 40×24, on-state `willowGreen-500`, off-state `blueSlate-200`, white 20px thumb; `role="switch"`, `aria-checked`, keyboard-operable). **Disable** → danger `ConfirmDialog` (`strawberryRed-100` bg, "Disable ops_dan? They will not be able to log in.", confirm `strawberryRed-600` bg white text, hover `-700`, active `-800`); **enabling** is the reverse with lighter `willowGreen-500` confirm. Disabled users cannot log in — their next login shows the "Account not available" banner designed in the Login doc. **Disabling is not deleting** (the sheet's user management = role changes + disable; no delete-user permission, out of scope, flagged) |
| `ConfirmDialog` | Shared confirm primitive (round-3 destructive variant per the User Dashboard color table; the Review Panel's round-6 model deleted its own use of it, but it is still this page's confirmation surface) |

## Links

- Arrival: ops nav "Users" (admin-only item). **No deep-link sharing expected**
  (sensitive — no shareable URL state; the list is query-parameter-free by design).

## Data

- `mockApi` against the ARCHITECTURE §4.2 user set: 128 total (3 staff · 2 managers ·
  1 admin); the 5 visible rows — buyer_102 (buyer, active, 2d), ops_marta (staff,
  active, 1h), **ops_dan (manager, disabled, 40d)** (3px `strawberryRed-500` left bar
  in the mockup), rian_w (buyer, active, 6d), **admin_ria (admin, active, 2h)**.
- Future Express placeholders: `GET /ops/users` (search + role counts),
  `PATCH /users/:id/role`, `PATCH /users/:id/active`.

## Surviving state

- None cross-page: search text, current page offset, and any in-flight confirmations
  are in-page; the list re-queries on navigation. Role/status changes are server state
  (optimistically applied, reverted on failure).

## Page-specific notes

- **Self-protection (strict route protection, the sheet's note):** the admin cannot
  disable **their own** account — own-row controls are **absent** (hidden, not
  greyed; a disabled admin could not re-enable). Role changes require the confirm
  dialog; the extra threshold for "target's role ≥ actor's" is TBD (flagged — v1
  confirms all role changes via the dialog regardless).
- Audit note (flagged, out of v1): the sheet does not specify an audit log;
  recommended (high-level) before role/disable actions become real — noted for
  backend-dev, not designed here.
- Loading: static table skeletons (no shimmer loops); buttons spinner-lock during
  saves. Row-level failure = `strawberryRed` toast + revert; page-load failure =
  `strawberryRed` panel + retry.
- a11y: role select is a labelled native select; status pill always carries text;
  toggles keyboard-operable with a visible focus ring; focus ring 2px
  `atomicTangerine-500` offset 2.
- Mobile (<768px): table → cards with role select + toggle. Desktop-first.
- Verification: match mockup at 1312px (5 rows incl. ops_dan's disabled bar + the
  success-flash banner); 390px = card list.
