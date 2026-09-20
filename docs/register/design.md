# Page: Register — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.

## FEATURES

- Buyer self-service registration: name, email, password (+ confirm field, UI convenience).
- Role note: the matrix marks "login/register" T for all 4 roles, but in practice only **buyers**
  self-register; staff/manager/admin accounts are provisioned by the admin via User Dashboard
  (admin-only "manage user accounts"). This page therefore creates **buyer** accounts. Flagged
  assumption — the sheet is silent on who provisions non-buyer accounts.
- Success → automatic sign-in → Main Store.
- Email uniqueness is enforced server-side (high-level API assumption: `POST /users` returns
  409 on duplicate).

## LINKS / NAVIGATION

- "Already have an account? Sign in" → Login. Nothing else.
- Post-success: auto-login, redirect to Main Store.

## VISUALIZATION

`TODO: request image generation —` same shell as Login (shared `AuthCard`): white canvas,
sharp-bordered card, stacked fields, warm orange primary button. Suggested prompt: "minimal
signup form, white background, card with name/email/password/confirm fields, sharp 1px borders,
warm orange primary button, clean sans-serif, desktop 1440px" — save to `docs/register/`.

ASCII wireframe (desktop):

```
+----------------------------------------------------+
|  LOGO                                             |
+----------------------------------------------------+
|  Create account                                    |
|  +----------------------------------------------+  |
|  | Name         [___________________________]  |  |
|  | Email        [___________________________]  |  |
|  | Password     [___________________________]  |  |
|  | Confirm      [___________________________]  |  |
|  +----------------------------------------------+  |
|  [ Create account → ]            (primary, wide) |
|  Already have an account? Sign in                 |
+----------------------------------------------------+
```

Mobile (<390px): single column, 16px gutters, fields full-bleed inside the card, min height 44px.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / card | `#FFFFFF`, card border `blueSlate-200` |
| Headings / labels / input text | `blueSlate-950` |
| Helper text | `blueSlate-700` |
| Input border idle / hover / focus ring | `blueSlate-200` / `blueSlate-300` / `atomicTangerine-500` |
| Primary button | `atomicTangerine-500` (hover/active `atomicTangerine-600`), white label |
| Sign-in link | `atomicTangerine-600` |
| Field error | `strawberryRed-600` text, `strawberryRed-100` tint |
| Success flash (pre-redirect, optional) | `willowGreen-100` bg, `willowGreen-600` text |

## INTERACTIONS

(React: `RegisterForm` reusing `InputField`, `PrimaryButton` from Login.)

- **Idle:** Submit disabled until name non-empty, email format-valid, password ≥8, confirm ===
  password.
- **Validation:** inline on blur per field; confirm field re-validates live when either
  password changes. Duplicate email (409 on submit) → "An account with this email already
  exists" under the email field. (Optional live pre-check `GET /users/check-email` —
  **TBD**, assume submit-time check for simplicity.)
- **Hover/active:** same button ramp as Login.
- **Loading:** button spinner + "Creating account…"; inputs disabled.
- **Error:** field-level (`strawberryRed-600`) + form-level banner for 409/500.
- **Success:** auto-login, redirect to Main Store; the transition to a logged-in storefront is
  the feedback — no extra confirmation screen.
- **Keyboard/a11y:** focus rings, `htmlFor` labels, `aria-describedby` on errors.
