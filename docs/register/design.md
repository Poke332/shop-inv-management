# Page: Register — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md` RBAC matrix.
React component names are hints only — this is a design plan, not code.
Typography & spacing per `docs/design-tokens-round3.md` (Roboto 400/500/600, 8pt grid,
unified pill badges, filled CTA stack).

**SHARED LAYOUT (locked with Login, `docs/login/design.md`):** this page and Login share
one layout — the two-panel `AuthLayout` below (brand panel + form card, same logo placement,
typography, spacing, colors, and mobile collapse). They differ **only in the form**
(registration fields vs sign-in fields). The layout in this doc is identical to
`docs/login/design.md`; the layout in that doc is identical to this one.

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

![Register page mockup](mockup.png)

> mockup.png rendered from _mockup-build/out/register.html via headless Chromium @ 2026-09-22


ASCII wireframe (desktop, ≥768px) — **identical to Login's wireframe; only the form and copy differ:**

```
+--------------------------------------------------------------+
|  LOGO                                                         |
+---------------------------------+----------------------------+
|  (brand panel: blueSlate-900,   |   Create account           |
|   tuscanSun sun shape)          |   +----------------------+ |
|                                 |   | Name                 | |
|  Tagline (blueSlate-50)        |   +----------------------+ |
|                                 |   +----------------------+ |
|                                 |   | Email                | |
|                                 |   +----------------------+ |
|                                 |   +----------------------+ |
|                                 |   | Password         [show] |
|                                 |   +----------------------+ |
|                                 |   +----------------------+ |
|                                 |   | Confirm password     | |
|                                 |   +----------------------+ |
|                                 |   [ Create account → ]    |
|                                 |   Already have an          |
|                                 |   account? Sign in         |
+---------------------------------+----------------------------+
```

Mobile (<768px): brand panel collapses to a 64px top strip with the logo; card full-bleed with
24px gutters; minimum field height 44px. **Same collapse rule as Login.**

## COLOR USAGE

Shared rows are **identical to Login's color table** (same brand panel, card, inputs, button,
link, error). Register-only extras are marked below.

> **60 : 30 : 10 mapping (round 7 · `design-tokens-round3.md` §11):** 60% dominant ground = `tuscanSun-50` #FEF7E6 (the warm page background, replacing the `#FFFFFF` canvas) · 30% secondary surface = `#FFFFFF` card/form-field fill (now reads as depth on the warm ground; `blueSlate-50` stays the alternate soft surface) · 10% accent = `atomicTangerine-600` (primary CTA) · `strawberryRed-600` (error) · `carrotOrange-500` (secondary) · `tuscanSun-500` (star/featured) — used sparingly, ~10% of the surface.
> **intended-redesign: round-7 60:30:10 storefront color ratio** — the `#FFFFFF` canvas is demoted to the 30% surface layer and the `tuscanSun-50` warm ground becomes the 60% dominant page background (`design-tokens-round3.md` §11). Auth pages take the same dominant-ground treatment for visual consistency. Control-panel / ops pages are **out of scope**.

| Element | Token |
|---|---|
| **Page background (60% ground)** | `tuscanSun-50` #FEF7E6 (warm ground, round 7 §11) — the form card sits on it as the 30% `#FFFFFF` surface; the dark brand panel `blueSlate-900` is unchanged (it is a panel, not the ground) |
| Brand panel (desktop) | `blueSlate-900` bg, `tuscanSun-400` sun graphic, `blueSlate-50` tagline |
| Card surface (30%) | `#FFFFFF` on the warm ground, border `blueSlate-200`, radius 12px |
| Labels / headings / input text | `blueSlate-950` (labels 13/600; "Create account" heading 26/36 w600) |
| Input placeholder | `blueSlate-500` |
| Inputs | 44px min height, radius 8px, 1px `blueSlate-200` border; focus ring 2px `atomicTangerine-500`, offset 2; "show" toggle 12/500 `blueSlate-500` |
| Primary button ("Create account →") | filled 44px: `atomicTangerine-600` idle → `-700` hover → `-800` active, white 14/500 label; disabled = `blueSlate-100` bg + `blueSlate-400` text |
| Sign-in link | `atomicTangerine-600`, underline on hover |
| Error text / banner | `strawberryRed-600` on `strawberryRed-100`, border `strawberryRed-300` |

Register-only extras (no counterpart on Login — not layout, so outside the shared rule):

| Element | Token |
|---|---|
| Helper text (field hint) | `blueSlate-700` |
| Success flash (pre-redirect, optional) | `willowGreen-100` bg, `willowGreen-600` text |

## INTERACTIONS

(React: same shared `AuthLayout` two-panel container + brand panel as Login — **identical layout**;
`RegisterForm` on the form side, reusing `InputField`, `PrimaryButton`. The form side is the only
difference; see `docs/login/design.md`.)

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
