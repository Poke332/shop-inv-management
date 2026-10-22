# Per Product Review Panel — Implementation

Phase P6 (inside the ops app shell — its own phase so the round-6 moderation model gets
one focused pass). Visual/interaction source: `docs/per-product-review-panel/design.md`
+ mockup; shell gutter per `docs/control-panel/design.md`. This is the **moderation
console**: view every review (public and hidden), add/edit a seller comment, hide/unhide.
**No approve, no delete.**

## Route

- Path: `/ops/reviews?product=<id>` — roles: **manager / admin only** (matrix "moderate
  reviews" F/F/T/T, re-scoped by round 6: view all reviews incl. hidden, add seller
  comments, hide/unhide). **Staff get no nav item and are route-redirected to
  Ongoing Orders** (their home) — no 403 page naming the feature.
- Arrival: ops nav "Reviews"; deep-link `/ops/reviews?product=P-231` pre-selects the
  product. No exit to storefront; an optional "See on store" link → Product Details
  variant B (read-only), flagged.

## Components

| Component | Responsibility |
|---|---|
| `ReviewPanel` | Page inside `OpsShell`: "Reviews" h1 + `ProductSelect` + meta line + two sections (`PublicSection`, `HiddenSection`) rendered from one review list |
| `ProductSelect` | Product picker at the top (the page is "Per Product"): 44px `selectbox` (1px `blueSlate-200` border, 8px radius) — "Sony WF-C710N (P-231) ▾" in the mock; pre-filled from the `?product=` deep-link; switching refetches |
| `ReviewCard` | Row anatomy (both sections): `StarRating` read-only (filled `tuscanSun-500` / empty `tuscanSun-200` — TBD marker per open decision #10) + buyer (anonymized, `buyer_102`) + order provenance (`#WB-0987`, 13/400 `blueSlate-700`) + description + state pill (`Public` = `.pill-in` `willowGreen-100` bg / `willowGreen-700` text; `Hidden` = `strawberryRed-100` bg / `strawberryRed-700` text — soft, non-alarming) + actions: **Hide** (public rows) / **Unhide** (hidden rows, `willowGreen-600` text on the same secondary shape — reversible, non-destructive, not danger-colored) + **Add / Edit comment** (secondary button; "Edit comment" carries a small `blueSlate-500` dot / "edited" suffix when a comment exists) |
| `SellerCommentComposer` | Inline composer under the row: full-width textarea (1px `blueSlate-200` border, radius 10px), empty for Add, pre-filled for Edit; **Save** = filled `atomicTangerine-600` 44px CTA, **Cancel** = secondary (discards). Semantics: the comment is a **merchant reply, not a moderation action** — adding/editing on a *hidden* review is allowed; the text is stored with the review and only ever renders publicly (beneath the review on Product Details) **while the review itself is public**; unhiding a commented review publishes the comment with it. No delete-comment action in v1 (edit is the replacement, flagged) |
| Section headers | Public: accent bar 4×20 `willowGreen-500` + "Public" + count badge; Hidden (collapsed behind its count header, expandable): accent bar `blueSlate-400` + "Hidden" + count badge, "not public · still counts in total" hint. Meta line under the selector: **"122 public / 6 hidden · 128 total"** (`blueSlate-700`) |

## Links

- Ops nav "Reviews" (manager/admin item only — hidden from staff per the matrix).
- Arrivals: ops nav; deep-link `/ops/reviews?product=P-231` (pre-selects P-231).
- "See on store" (optional, flagged) → `/products/:id` variant B. **No link into User
  Dashboard** (buyer accounts are admin-only scope; provenance shows buyer + order only).

## Data

- `mockApi.getProductReviewsAll("P-231")` (future: `GET /ops/reviews?product=P-231`) →
  **public AND hidden** (the public-only consumer is Product Details): the ARCHITECTURE
  §4.2 P-231 set = **128 total = 122 public + 6 hidden**, mockup samples: buyer_102 4★
  "Solid build, ANC keeps up on the train…" (#WB-0987, seller comment "Thanks —
  firmware 2.1 improved ANC.", composer pre-filled in the mock), buyer_207 5★ "Fast
  charge, great for travel" (#WB-0951, comment "We ship the 20 000 mAh variant — 36 h
  max."), buyer_348 3★ (#WB-0922, no comment), hidden: buyer_311 2★ "Arrived cracked in
  the mail" (#WB-0890, comment "Replacement shipped — order #WB-0901.").
- **Totals semantics (round 6):** hidden reviews keep counting in the total shown on
  Product Details ("N reviews" = public + hidden) and, per the v1 data-layer decision,
  in the rating average (TBD — flagged; only the description of a hidden review is
  non-public). The panel's meta line makes both numbers visible.
- Round-6 status enum: the sheet's `pending/approved/hidden` collapses to
  **`public` / `hidden`** (auto-approve on submission; no pending state, no approved
  label; delete dropped).
- Future Express placeholders: `PATCH /reviews/:id/hidden` (hide/unhide),
  `PUT /reviews/:id/seller-comment` (add/edit comment).

## Surviving state

- None cross-page: selected product (from the URL), expanded/collapsed Hidden section,
  and open composer drafts are in-page (the composer survives a Hidden-section
  collapse within the session; navigation drops it). The public/hidden state itself is
  server data, re-fetched on arrival.

## Page-specific notes

- **Every row shows exactly its two valid actions** — public → [Hide] [Add/Edit
  comment]; hidden → [Unhide] [Add/Edit comment]. No third button, nothing greyed.
- Optimistic actions: hide/unhide moves the card between sections with a
  `willowGreen-100` row tint / `willowGreen-600` success flash + pill flip; comment
  save flashes on save. Failure → `strawberryRed` toast, row rolls back.
- **No approve, no restore, no delete, no undo confirm dialog** (the round-5
  `ConfirmDialog` on this page is deleted — it remains on User Dashboard for its own
  confirmations).
- Empty states: "No reviews for this product" (section headers hidden) and "No hidden
  reviews" (light `willowGreen` check — everything is public).
- Loading: static skeleton cards per section (no shimmer loops); error: `strawberryRed`
  panel + retry.
- a11y: action buttons text-labelled (never icon-only); state pills carry
  `aria-label` ("Public" / "Hidden"); section moves and state flips announced
  `aria-live="polite"`; composer label "Seller comment"; focus ring 2px
  `atomicTangerine-500` offset 2; Unhide renders as text, not icon-only.
- Mobile: sections stack vertically; action buttons wrap to a full-width row under each
  card.
- Verification: match the mockup at 1312px (selector + meta line + public rows incl.
  the two seller-comment rows + collapsed Hidden section + footer note) and 390px
  (stacked sections, wrapped action rows). Note the committed mockup is the pre-round-6
  render — the **spec above is the target** (the next mockup card regenerates it).
  The mockup PNG regeneration is a **pending follow-up card on this board** — do not
  treat the stale PNG as a spec error; verify against the spec text, not the old render.
