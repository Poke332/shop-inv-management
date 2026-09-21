# Page: Per Product Review Panel — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Access: **manager/admin only** (matrix: moderate reviews F/F/T/T). This is the
moderation console: approve / hide / delete reviews, scoped per product.

## FEATURES

- **Product selector** at top (since the page is "Per Product"): pick a
  product → its review queue. Arrivals from a deep-link pre-select.
- **Review list** grouped by moderation state:
  - `pending` — new reviews awaiting a decision (top of queue, most
    prominent).
  - `approved` — live on Product Details.
  - `hidden` — suppressed but kept (restorable).
  Sheet locks review status to pending/approved/hidden (report §"Decisions
  the sheet locks in"). **Delete** is one of the three moderation actions in
  the page list ("approve/hide/delete") — a hard delete is a distinct,
  destructive action; no undo is specified (flagged).
- **Rating display (open decision #10): TBD** — assume 1–5 stars consistent
  with Product Details (`StarRating` shared, read-only here).
- Purchase-gate context: each review shows the buyer's name + the order it
  came from (moderators need provenance; buyer accounts are only manageable
  by admin — no link into User Dashboard from here).

## LINKS / NAVIGATION

- Ops nav "Reviews" (manager/admin item; hidden from staff per matrix —
  "moderate reviews" F for staff).
- Arrivals: ops nav; deep-link `/ops/reviews?product=P-231`.
- No exit to storefront; "See on store" link → Product Details (variant B,
  read-only) — optional, flagged.

## VISUALIZATION

![Review moderation panel mockup](mockup.png)


ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| OPS CONSOLE  [Ongoing Orders] [Inventory] [Products] [Reviews (7)]|
+------------------------------------------------------------------+
| REVIEWS   Product: [ Sony WF-C710N (P-231) ▾ ]    7 pending / 42 total |
+------------------------------------------------------------------+
| PENDING (7)                                                      |
| +--------------------------------------------------------------+|
| | ★★★★☆  "Solid build, ANC keeps up on the train…"            ||
| |            — buyer_102 (order #WB-0987, Sony WF-C710N x1)    ||
| |    [ Approve ]  [ Hide ]  [ Delete (confirm) ]              ||
| +--------------------------------------------------------------+|
| | ★★★★★  "Fast charge, great for travel"                      ||
| |            — buyer_207 (order #WB-0951, Anker 735 PB x1)    ||
| APPROVED (34)  (collapsed list, newest first)                    |
| HIDDEN (6)   (collapsed; per item: [ Restore ] [ Delete ])      |
+------------------------------------------------------------------+
```

Mobile: sections stack vertically; action buttons wrap to a full-width row
under each card.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / card border | `#FFFFFF` / `blueSlate-200` |
| Section headers | `blueSlate-950`; count badges `blueSlate-100` bg, `blueSlate-700` text |
| "Pending" section accent bar | `tuscanSun-500` |
| Review card stars | `tuscanSun-500` filled / `tuscanSun-200` empty |
| Buyer / order provenance | `blueSlate-700` small text |
| Approve button | `willowGreen-500` bg, white label (hover `willowGreen-600`) |
| Hide button | ghost: `blueSlate-200` border, `blueSlate-950` text, hover `blueSlate-50` |
| Delete button | `strawberryRed-600` bg white text (hover `strawberryRed-700`) |
| Restore button | `seagrass-500` bg, white label |
| Success flash (after approve/restore) | row tint `willowGreen-100`, text `willowGreen-600` |
| Danger confirm dialog | `strawberryRed-100` bg, heading `strawberryRed-700` |

## INTERACTIONS

(React: `ReviewPanel`, `ProductSelect`, `ReviewCard`, `ConfirmDialog`.)

- **Idle:** queue sorted: pending first (newest), then approved, then hidden
  (collapsed behind a count header).
- **Approve:** optimistic move to Approved section + success flash;
  `PATCH /reviews/:id/status` (high-level assumption). Reverts with a
  `strawberryRed` toast on failure.
- **Hide:** optimistic move to Hidden section.
- **Delete:** **requires `ConfirmDialog`** — text: "Delete review by
  buyer_102? This cannot be undone." Buttons: Cancel (ghost) / "Delete"
  (`strawberryRed-600`). No undo in v1 (flagged).
- **Disabled logic:** a review in any state has exactly the actions valid
  for that state (pending → approve/hide/delete; approved → hide/delete;
  hidden → restore/delete); other buttons absent, not greyed.
- **Loading:** skeleton cards per section. **Error:** `strawberryRed` panel
  with retry; failed optimistic actions roll the card back.
- **Empty states:** "No pending reviews" (celebratory-light: `willowGreen`
  check icon) vs "No reviews for this product".
- **Role-based visibility:** whole page manager/admin only; staff get no
  nav item and are route-redirected to Ongoing Orders.
- **a11y:** action buttons text-labelled (never icon-only); confirm dialog
  traps focus; section moves announced via `aria-live="polite"`.
