# Page: Login — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles/permissions: `Sheets-report.md` RBAC matrix.
React component names are hints only — this is a design plan, not code.

## FEATURES

- Email + password sign-in for **all 4 roles** (matrix: login T for buyer/staff/manager/admin).
  The page is role-agnostic: one form; the server decides the role and routing.
- **Post-login routing (locked by the sheet):** buyer → Main Store; staff/manager/admin → dashboards.
  Role→dashboard mapping (assumption, flagged): staff → Ongoing Orders (core duty: order status +
  product alerts), manager/admin → Inventory Dashboard.
- No "remember me" / session duration spec in the sheet — **TBD** (most likely: normal session
  cookie; no UI implication for this page).
- No forgot-password flow in the sheet — out of scope; error copy must not imply one exists.
- Account-disabled users (admin can disable from User Dashboard): server denial state →
  "Account not available — contact an administrator" error banner.

## LINKS / NAVIGATION

- In-page: "New here? Register" → Register. Nothing else.
- Post-login: see routing above.
- Back/refresh always lands on Login. Authenticated users hitting Login are redirected to their
  role home.

## VISUALIZATION

![Login page mockup](mockup.png)

ASCII wireframe (desktop, ≥768px):

```
+--------------------------------------------------------------+
|  LOGO                                                         |
+---------------------------------+----------------------------+
|  (brand panel: blueSlate-900,   |   Email + password          |
|   tuscanSun sun shape)          |   +----------------------+   |
|                                 |   | Email                |   |
|  Tagline (blueSlate-50)        |   +----------------------+   |
|                                 |   +----------------------+   |
|                                 |   | Password         [show] |
|                                 |   +----------------------+   |
|                                 |   [ Sign in → ]  (primary)    |
|                                 |   New here? Register          |
+---------------------------------+----------------------------+
```

Mobile (<768px): brand panel collapses to a 64px top strip with the logo; card full-bleed with
24px gutters; minimum field height 44px.

## COLOR USAGE

| Element | Token |
|---|---|
| Page canvas | `#FFFFFF` |
| Brand panel (desktop) | `blueSlate-900` bg, `tuscanSun-400` sun graphic, `blueSlate-50` tagline |
| Card surface | canvas white, border `blueSlate-200`, radius 12px |
| Labels / headings / input text | `blueSlate-950` |
| Input placeholder | `blueSlate-500` |
| Input border idle / hover / focus ring | `blueSlate-200` / `blueSlate-300` / `atomicTangerine-500` |
| Primary button idle → active | `atomicTangerine-500` → `atomicTangerine-600`, white label |
| Register link | `atomicTangerine-600`, underline on hover |
| Error text / banner | `strawberryRed-600` on `strawberryRed-100`, border `strawberryRed-300` |

## INTERACTIONS

(React: `LoginForm`, `AuthCard`, `InputField`, `PrimaryButton` — shared with Register.)

- **Idle:** fields empty; Submit disabled — `blueSlate-200` bg, `blueSlate-500` text (app-wide
  disabled rule).
- **Validation:** email required + format on blur; password required, min 8 chars (assumption —
  sheet only says "input validation" on Register; applying the same rule here). Inline errors
  under fields, `strawberryRed-600`, tied via `aria-describedby`.
- **Enabling logic:** Submit enabled only when email format valid AND password ≥8.
- **Hover:** button `atomicTangerine-500`→`600`; link underlines. **Active:** `600`, no layout shift.
- **Loading:** button label swaps to spinner + "Signing in…"; inputs disabled; double-submit guarded.
- **Error (server 401):** banner above form: "Email or password is incorrect."
  (`strawberryRed-100` bg, `strawberryRed-600` text, 1px `strawberryRed-300` border,
  `role="alert"`, focus moved to banner). 403 / disabled → "Account not available" variant.
- **Success:** redirect per routing table — navigation itself is the feedback; no toast.
- **Keyboard/a11y:** visible focus ring on every control; labels via `htmlFor`;
  `prefers-reduced-motion` respected for transitions.
