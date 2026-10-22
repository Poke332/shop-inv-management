# Page: Per Product Review Panel — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Typography & spacing per docs/design-tokens-round3.md (Roboto 400/500/600, 8pt grid, unified pill badges, filled CTA stack).
App shell & gutter (v4): `docs/control-panel/design.md` — the ops sidebar is a 230px `--ops-sidebar-w` token and the sidebar-to-content gutter is an explicit `.ops-content` padding (`--ops-page-pad` 32px desktop / 24px mobile), reset-proof by class specificity. This page's content sits 32px off the sidebar; its internal table/panel layout is unchanged by the shell spec.

> **Round-7 scope note (out of scope — layout unchanged):** the round-7
> 60:30:10 storefront color-ratio change (`design-tokens-round3.md` §11 — warm
> `tuscanSun-50` #FEF7E6 dominant ground) applies **only to the buyer-facing
> storefront**. This ops page is **out of scope for layout changes**: the dark
> `blueSlate-900` sidebar + `.ops-content` gutter stay exactly as
> `docs/control-panel/design.md` specifies. If the `.ops-content` area sits on
> the warm ground, that is acceptable; the panel chrome is unchanged.

Access: **manager/admin only** (matrix: "moderate reviews" F/F/T/T re-scoped
by round 6 — see §PERMISSION MATRIX DELTA). This is the moderation console:
view **every** review (public and hidden), add/edit a **seller comment**,
and **hide/unhide**. No approve, no delete.

## FEATURES

- **Product selector** at top (since the page is "Per Product"): pick a
  product → its review list. Arrivals from a deep-link pre-select.
- **Round-6 moderation model (intended-redesign: round-6 review
  auto-approve):** reviews become **public on submission** — there is no
  pending/approved pipeline and no approval step. The sheet's status enum
  `pending/approved/hidden` collapses to **`public` / `hidden`**; the
  sheet's "delete" action is dropped (no delete, no undo problem by
  construction).
  **intended-redesign: round-6 review auto-approve** — the former
  `pending` queue section and the per-row Approve / Delete actions are
  deleted from this framework page (gate deletion audit passes on these
  markers).
- **Review list — every review for the product, public AND hidden.**
  Hidden reviews sit in a second section (below public, newest first),
  clearly labelled so a manager can confirm what the public is *not*
  seeing.
- **Row anatomy (both sections):** rating (stars, read-only), buyer
  (anonymized — `buyer_102`, fine), description, current state pill
  (`Public` / `Hidden`), seller-comment action (**add** or **edit** a
  merchant reply — published publicly under the review on Product
  Details), and a **hide/unhide toggle** (public rows show "Hide",
  hidden rows show "Unhide" back to public).
- **Seller comment semantics:** the comment is a merchant reply, not a
  moderation action. Adding/editing it on a *hidden* review is allowed;
  the text is stored with the review but only ever renders publicly
  (beneath the review on Product Details) while the review itself is
  public. Empty state: no comment yet → action is "Add comment".
- **Totals semantics (round 6):** hidden reviews **still count in the
  total review count** shown on Product Details ("N reviews" = public +
  hidden) and, per design assumption, their stars **still count in the
  rating average** — **TBD** (open decision, flagged; only the
  description of a hidden review is non-public). The panel's meta line
  makes both numbers visible: "122 public / 6 hidden · 128 total".
- **Rating display (open decision #10): TBD** — assume 1–5 stars
  consistent with Product Details (`StarRating` shared, read-only here).
- Purchase-gate context: each review shows the buyer (anonymized) + the
  order it came from (moderators need provenance; buyer accounts are
  only manageable by admin — no link into User Dashboard from here).

## LINKS / NAVIGATION

- Ops nav "Reviews" (manager/admin item; hidden from staff per matrix —
  "moderate reviews" F for staff).
- Arrivals: ops nav; deep-link `/ops/reviews?product=P-231`.
- No exit to storefront; "See on store" link → Product Details (variant B,
  read-only) — optional, flagged.

## VISUALIZATION

![Review moderation panel mockup](mockup.png)

> mockup.png rendered from _mockup-build/out/per-product-review-panel.html via headless Chromium @ 2026-09-22


ASCII wireframe (desktop — vertical 230px dark ops sidebar, not a top bar):

```
+------------------+-------------------------------------------------------+
|OPS CONSOLE       |Reviews   Product: [ Sony WF-C710N (P-231) ▾ ]         |
|----------------  | 122 public / 6 hidden · 128 total (blueSlate-700)     |
|Ongoing Orders    |PUBLIC [122]  (accent bar willowGreen-500)             |
|Inventory         |★★★★☆ “Solid build…” — buyer_102 [Public]              |
|Products          |      [ Hide ] [ Add comment ]  ↓ on product page      |
|> Reviews [128]   |★★★★★ “Fast charge…” — buyer_207 [Public]              |
|Users             |      [ Hide ] [ Edit comment ]                        |
|(foot: role-gated |HIDDEN [6]  (not public; still counts in total) [▾]    |
|  note)           |★★★★☆ “Arrived cracked…” — buyer_311 [Hidden]          |
+------------------+-------------------------------------------------------+
```

Mobile: sections stack vertically; action buttons wrap to a full-width row
under each card.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / card border | `#FFFFFF` / `blueSlate-200` |
| Section headers | `blueSlate-950`; count badges `blueSlate-100` bg, `blueSlate-700` text; section accent bars 4×20 (public `willowGreen-500`, hidden `blueSlate-400`) |
| "Public" section accent bar | `willowGreen-500` (**intended-redesign: round-6 review auto-approve** — the former pending `tuscanSun-500` / approved `willowGreen-500` pair is replaced; no pending section) |
| State pill: `Public` | reuses existing pill token `.pill-in` (`willowGreen-100` bg, `willowGreen-700` text) |
| State pill: `Hidden` | reuses existing pill token `.pill-out`-class convention (`strawberryRed-100` bg, `strawberryRed-700` text) — soft, non-alarming; no new colors |
| Review card stars | `tuscanSun-500` filled / `tuscanSun-200` empty |
| Buyer / order provenance | `blueSlate-700` 13/400 text |
| Hide / Unhide toggle | secondary: white fill, 1px `blueSlate-200` border, `blueSlate-950` text, hover bg `blueSlate-100`; Unhide renders `willowGreen-600` text on the same secondary shape (reversible, non-destructive → not danger-colored) |
| Add / Edit comment button | secondary style (same as toggle); "Edit comment" shows a small `blueSlate-500` dot or "edited" suffix when a comment exists |
| Seller-comment composer | full-width textarea, 1px `blueSlate-200` border radius 10px; Save = filled `atomicTangerine-600` CTA (44px), Cancel = secondary |
| Success flash (after hide/unhide/comment save) | row tint `willowGreen-100`, text `willowGreen-600` |
| ~~Approve button~~ `willowGreen-600` filled / ~~Restore button~~ `seagrass-500` / ~~Delete button~~ `strawberryRed-600` / ~~Danger confirm dialog~~ `strawberryRed-100` | **intended-redesign: round-6 review auto-approve** — deleted: no approve, no restore (it's an unhide now), no delete, no confirm dialog |

## INTERACTIONS

(React: `ReviewPanel`, `ProductSelect`, `ReviewCard`, `SellerCommentComposer`.
**intended-redesign: round-6 review auto-approve** — `ConfirmDialog` is
deleted from this page: no destructive action remains.)

- **Idle:** two sections — Public (newest first) then Hidden (collapsed
  behind its count header until expanded). Meta line under the product
  selector: "122 public / 6 hidden · 128 total".
- **Hide (public row):** optimistic move to the Hidden section + success
  flash; row pill flips `Public` → `Hidden`. `PATCH /reviews/:id/hidden`
  (high-level assumption). Reverts with a `strawberryRed` toast on
  failure. Nothing is destroyed — hidden reviews keep counting toward
  totals.
- **Unhide (hidden row):** optimistic move back to Public + success
  flash. A seller comment saved while the review was hidden publishes
  with it when it becomes public again.
- **Add / Edit seller comment:** opens the inline composer under the
  row (empty textarea for Add; prefilled for Edit). Save (filled CTA)
  commits `PUT /reviews/:id/seller-comment`; the comment renders publicly
  beneath the review on Product Details (visible only while the review is
  public). Cancel discards. No delete-comment action in v1 (edit is the
  replacement; flagged).
- **No approve, no delete, no undo confirm dialog** —
  **intended-redesign: round-6 review auto-approve** (supersedes the
  sheet's "approve/remove incoming reviews (spam)"; gate deletion audit
  passes on these markers).
- **Disabled logic:** every row shows exactly its two valid actions —
  public row → [Hide] [Add/Edit comment]; hidden row → [Unhide]
  [Add/Edit comment]. No third button, nothing greyed.
- **Loading:** static skeleton cards per section (no shimmer loops;
  skeletons stay still under `prefers-reduced-motion`). **Error:**
  `strawberryRed` panel with retry; failed optimistic actions roll the
  row back.
- **Empty states:** "No reviews for this product" (section headers
  hidden) and "No hidden reviews" (celebratory-light: `willowGreen`
  check icon — everything is public).
- **Role-based visibility:** whole page manager/admin only; staff get
  no nav item and are route-redirected to Ongoing Orders.
- **a11y:** action buttons text-labelled (never icon-only); state pills
  carry `aria-label` ("Public" / "Hidden"); section moves and state
  flips announced via `aria-live="polite"`; composer has a visible text
  label "Seller comment".

## PERMISSION MATRIX DELTA (round-6 override of the sheet)

- The Sheets-report row **"moderate reviews" (staff F / manager T /
  admin T)** is **re-scoped by round 6** — a made decision, TBD-free:
  staff F; manager/admin T, meaning **view all reviews incl. hidden,
  add seller comments, hide/unhide**. The sheet's original scope
  ("approve/remove incoming reviews (spam)" incl. delete) no longer
  applies. **intended-redesign: round-6 review auto-approve** — this
  marker is the deletion audit's pass condition for the framework
  lines removed above.
- Review status enum: sheet's `pending/approved/hidden` → **`public/hidden`**
  (auto-approve on submission; no pending state, no approved label).
- **Rating-average semantics: TBD.** Design assumption: hidden stars
  still count in the average (only descriptions are non-public). The
  panel and Product Details UI are unaffected either way — data-layer
  only.

> **Mockup note:** `mockup.png` above still shows the pre-round-6
> pending/approve/delete layout (it is the round-5 render). The next
> card regenerates it from the updated generator source; this spec is
> the target.
