# Page: User Dashboard — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Access: **admin only** (matrix: "manage user accounts" F/F/F/T). The sheet
flags this as the "most sensitive feature" with strict route protection —
the strongest guard in the app.

## FEATURES

- **User list:** name, email, role (buyer/staff/manager/admin), account
  status (active/disabled), last activity. Search by name/email.
- **Role change:** per-user role select (buyer/staff/manager/admin),
  persisted via high-level `PATCH /users/:id/role` assumption. A
  user can be demoted from the list, or an admin can be promoted
  (staff/manager cannot manage users at all — F/F in matrix).
- **Disable / enable account:** per-user toggle. Disabled users cannot
  log in (their next login attempt shows the "Account not available"
  banner designed in the Login doc). **Disabling is not deleting** —
  the sheet's user management = role changes + disable; no delete-user
  permission is listed (out of scope, flagged).
- **Self-protection (strict route protection, sheet note):**
  - The admin cannot disable **their own** account (control hidden, not
    greyed — a disabled admin could not re-enable; flagged assumption).
  - Role changes require a **confirm dialog** when the target's role ≥
    the actor's (i.e. promoting/creating a peer admin) — most likely
    interpretation of "strict" beyond the page guard; exact threshold
    is **TBD** (flagged).
  - Route guard: admin-only, checked at route level + the API enforces
    server-side (report §"Implications": RBAC enforced server-side).
    Non-admins hitting the URL get a 404-style redirect, never an
    error page revealing the feature exists.

## LINKS / NAVIGATION

- Ops nav item **visible to admin only** (staff/manager nav omits it —
  visibility gating, not just route guards).
- Arrival: ops nav. No deep-link sharing expected (sensitive).

## VISUALIZATION

![User management dashboard mockup](mockup.png)


ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| OPS CONSOLE  [Ongoing Orders] [Inventory] [Products] [Reviews] [Users*]|
+------------------------------------------------------------------+
| USERS                          (admin only)                      |
| [ search name/email………]   128 users · 3 staff · 2 managers · 1 admin|
| +--------------------------------------------------------------+|
| | buyer_102 · buyer · [active] · last 2d      [role ▾][⏻]    ||
| | ops_marta · staff · [active] · last 1h      [role ▾][⏻]    ||
| | ops_dan · manager · [disabled] · last 40d   [role ▾][⏻]    ||
| +--------------------------------------------------------------+|
| * Users nav item: admin-only. ⏻ = disable/enable toggle          |
+------------------------------------------------------------------+
```

Mobile: table → cards with role select + toggle. Admin consoles are
desktop-first; this page degrades to card list on <768px.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / row border | `#FFFFFF` / `blueSlate-200` |
| Role select border / focus | `blueSlate-200` / `atomicTangerine-500` ring |
| Role select accent (admin value) | `atomicTangerine-600` text when admin selected |
| Status pill: active / disabled | `willowGreen-100` / `strawberryRed-100`, text `blueSlate-900` |
| Toggle (enable/disable) | on-state track `willowGreen-500`, off-state `blueSlate-200`; disabled-user row left bar `strawberryRed-500` |
| Role change confirmation dialog | `strawberryRed-100` bg, heading `strawberryRed-700`, cancel ghost / confirm `atomicTangerine-500` (confirm label "Change role") |
| Disable confirmation dialog | `strawberryRed-100` bg, confirm `strawberryRed-600` bg white text |
| Success flash (row) | `willowGreen-100` tint, `willowGreen-600` text "Role updated to manager" |
| Search input | standard `SearchInput` tokens (blueSlate-200 border, atomicTangerine-500 focus) |
| Count summary line | `blueSlate-700` |

## INTERACTIONS

(React: `UserDashboard`, `UserTable`, `RoleSelect`, `StatusToggle`,
`ConfirmDialog` (shared with Review Panel).)

- **Idle:** list paginated (assume 50/page, "Load more" consistent with
  other pages; flagged).
- **Role change:** open `ConfirmDialog` naming the user + old → new role:
  "Change buyer_102 from buyer to manager? They gain product and order
  management." Confirm / Cancel. Optimistic update + success flash;
  failure → `strawberryRed` toast + row reverts.
- **Disable:** `ConfirmDialog` (danger styling): "Disable ops_dan?
  They will not be able to log in." Confirm button `strawberryRed-600`.
  Enabling is the reverse, `willowGreen-500` confirm, lighter copy.
- **Disabled (control level):** own-row controls **absent** (self-protect);
  all other rows fully enabled. Loading: table skeletons; buttons
  spinner-lock during saves.
- **Error:** row-level failure = `strawberryRed` toast + revert; page
  load failure = `strawberryRed` panel + retry.
- **Role-based visibility:** admin-only page AND admin-only nav item.
  Staff/manager: no nav link, route-redirect to Ongoing Orders (their
  home), no 403 page that names the feature.
- **Audit note (flagged, out of v1):** the sheet does not specify an
  audit log; recommend one (high-level) before role/disable actions
  become real — noted for backend-dev, not designed here.
- **a11y:** role select is a labelled native select; status pill always
  carries text; toggles keyboard-operable with visible focus ring.
