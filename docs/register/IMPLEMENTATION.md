# Register — Implementation

Phase P3. Visual/interaction source: `docs/register/design.md` + mockup. Layout is
locked shared with Login (`AuthLayout`); only the form and its copy differ.

## Route

- Path: `/register` — anonymous users. Authenticated users hitting Register are
  redirected to their role home (same rule as Login).

## Components

| Component | Responsibility |
|---|---|
| `AuthLayout` | Identical to Login's (dark brand panel + white form card on the `tuscanSun-50` ground; mobile 64px logo strip + full-bleed card). See `docs/login/IMPLEMENTATION.md` |
| `RegisterForm` | name (required), email (required + format), password (required, min 8) with show toggle, confirm password (=== password, re-validated live when either password changes), "Create account →" primary button, "Already have an account? Sign in" link |
| `InputField` / `PrimaryButton` | Shared with Login (same tokens; loading label "Creating account…", inputs locked, double-submit guarded) |

## Links

- In-page: "Already have an account? Sign in" → `/login`. Nothing else. Success =
  auto-login + redirect to `/` (Main Store) — the transition to a logged-in
  storefront is the feedback; no confirmation screen.

## Data

- Creates **buyer** accounts only (documented assumption: staff/manager/admin accounts
  are provisioned by an admin via User Dashboard; the sheet is silent on who provisions
  them, flagged).
- `mockApi.register({ name, email, password })` — email uniqueness enforced server-side
  (mock: 409 on duplicate → "An account with this email already exists" under the email
  field; the optional live pre-check `GET /users/check-email` stays TBD, v1 =
  submit-time check).
- 200/201 → auto sign-in (AuthContext created as buyer) → redirect `/`.
- Future Express placeholders: `POST /users` (409 duplicate), `POST /auth/register`
  (mock choice: one combined endpoint returning a session).

## Surviving state

- Nothing persists pre-registration. On success the buyer session (AuthContext) is
  created — same shape as Login's.

## Page-specific notes

- Submit enabled only when: name non-empty, email format-valid, password ≥ 8,
  confirm === password. Inline field errors `strawberryRed-600` on blur
  (`aria-describedby`); form-level banner for 409/500.
- Helper text (field hints) `blueSlate-700`; optional success flash pre-redirect:
  `willowGreen-100` bg / `willowGreen-600` text (Register-only extras per the design
  doc's color table).
- a11y: focus rings, `htmlFor` labels, reduced-motion safe.
- Verification: match mockup at 1312px (same layout as Login, 4 fields + confirm);
  390px = 64px logo strip + full-bleed card.
