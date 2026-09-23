# Login — Implementation

Phase P3. Visual/interaction source: `docs/login/design.md` + mockup. Layout is locked
shared with Register (`AuthLayout` — two-panel brand + form card; only the form and its
copy differ).

## Route

- Path: `/login` — anonymous users. **Authenticated users hitting Login are redirected
  to their role home** (buyer → `/`, staff → `/ops/orders`, manager/admin →
  `/ops/inventory`). Back/refresh always lands on Login.
- Role-agnostic form: one sign-in for all 4 roles (matrix: login T for everyone);
  the server (mock auth) returns the role, and post-login routing is the locked table:
  buyer → Main Store; staff → Ongoing Orders; manager/admin → Inventory Dashboard.

## Components

| Component | Responsibility |
|---|---|
| `AuthLayout` | Shared two-panel shell: dark `blueSlate-900` brand panel (`tuscanSun-400` sun graphic, `blueSlate-50` tagline) + white 30% form card (border `blueSlate-200`, radius 12px) on the `tuscanSun-50` warm ground; desktop side-by-side; mobile <768: brand collapses to a 64px logo strip, card full-bleed with 24px gutters, 44px min fields |
| `LoginForm` | email + password (with 12/500 `blueSlate-500` "show" toggle) + "Sign in →" primary button + "New here? Register" link; error banner state |
| `InputField` | Shared input: 44px min height, 8px radius, 1px `blueSlate-200` border, `blueSlate-500` placeholder, labels 13/600 `blueSlate-950`, focus ring 2px `atomicTangerine-500` offset 2, `htmlFor` label |
| `PrimaryButton` | Shared filled 44px stack (`atomicTangerine-600` → hover `-700` → active `-800`, white 14/500; disabled = `blueSlate-100` fill + `blueSlate-400` text; loading = 600 fill + spinner + "Signing in…", inputs locked, double-submit guarded) |

## Links

- In-page: "New here? Register" → `/register`. Nothing else. Success = redirect per the
  routing table (navigation itself is the feedback — no toast).

## Data

- `mockApi.login(email, password)` against the mock users from ARCHITECTURE §4.2
  (admin_ria / ops_marta / ops_dan disabled / rian_w / buyer_102 — plus mock buyer +
  staff/manager login credentials so each role's home is reachable):
  - 200 → `{ role }` → redirect per routing table.
  - 401 → banner above form "Email or password is incorrect." (`strawberryRed-100` bg,
    `strawberryRed-600` text, 1px `strawberryRed-300` border, `role="alert"`, focus
    moved to banner).
  - 403 / account disabled → "Account not available — contact an administrator"
    variant (the disabled-user state ops_dan exercises).
- Future Express placeholder: `POST /auth/login` (session cookie — "remember me"
  / duration is TBD, no UI implication per the design doc).

## Surviving state

- Nothing persists pre-login. The session created on success (user + role) lives in
  `AuthContext` for the lifetime of the session and drives every route guard and the
  header account menu.

## Page-specific notes

- No forgot-password flow exists — error copy must not imply one (out of scope per the
  sheet; design doc explicit).
- Validation: email required + format on blur; password required, min 8 chars
  (assumption); Submit enabled only when email valid AND password ≥ 8; inline errors
  `strawberryRed-600`, `aria-describedby`.
- a11y: visible focus ring on every control; `htmlFor` labels; `prefers-reduced-motion`
  respected.
- Verification: match mockup at 1312px (brand panel + form card); 390px = 64px logo
  strip + full-bleed card.
