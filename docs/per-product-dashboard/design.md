# Page: Per Product Dashboard — Design Spec (Sunset Glow)

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

Access: **manager/admin only** (matrix: add new product / update stock
quantity / change product details all F for buyer+staff). This is the
product CRUD console: list, add, edit (pre-filled form per the sheet).

## FEATURES

- **Product list** (all products, with search filter — reuse `SearchInput`
  pattern): name, category, price, stock, status. Read-only columns;
  editing happens via the form, not inline (keeps this doc consistent with
  the stock-editing TBD in Inventory Dashboard — the **form** is the canonical
  edit surface; inline quick-sets live on Inventory Dashboard and PATCH the
  same field).
- **Add product:** `POST /products` (high-level assumption) with the
  **locked field set** from the sheet: name, price, description, image,
  category, initial stock.
- **Edit product:** pre-filled form (sheet's "pre-filled edit form"),
  `PATCH /products/:id` — same fields; image shows current thumbnail +
  replace control; stock field participates in the same edit form here
  (the stock-editing-location TBD defaults to the form for full edits).
- **Stock-decrement note (open decision #5): TBD** — if decrements are
  automatic, the stock field's helper text reads "Auto-decremented on each
  order — enter actual shelf count". No behavior change in UI.
- **Delete product:** matrix has no "delete product" permission; product
  CRUD in the sheet = add/edit. **Out of scope — do not ship a delete
  button in v1** (flagged).
- **Specs editor (round 9 — resolves the former spec-fields TBD note;
  superseded by this decision):** the form gains a repeatable
  **name/value spec-pair section** between Description and the footer
  (P-231 pre-filled: Model / Bluetooth /
  Battery / ANC / IP rating / Weight — same 6 pairs as the
  product-details specs table). Rendering: white surface card
  (`#FFFFFF`, 1px `blueSlate-200`, 12px radius — same card tokens as the
  editor card, round-8 §12 surface rule), rows are a 2-col grid
  (`130px 1fr`, row min-height 44px) of `.input` name + `.input` value,
  each row carries a 44px trash-glyph remove control (`.btn-del`,
  `strawberryRed-600`), and a "Add spec" secondary button (`.btn-sec` +
  plus glyph) appends an empty pair row.
  **intended-redesign: round-9 user decision — repeatable name/value
  spec-pair section replaces the previous "no layout change until decided"
  placeholder; the editor card gains a Specs card inside it.**

## LINKS / NAVIGATION

- Arrival: ops nav "Products"; Inventory Dashboard "Open editor" (pre-filled
  for that product); deep-link `/ops/products/:id/edit`.
- Success (add) → list with new row highlighted; success (edit) → stays in
  form with success flash.
- No links into storefront pages.

## VISUALIZATION

![Product management dashboard mockup](mockup.png)

> mockup.png rendered from _mockup-build/out/per-product-dashboard.html via headless Chromium @ 2026-09-22


ASCII wireframe (desktop — vertical 230px dark ops sidebar, not a top bar;
master/detail split: list left, pre-filled editor right):

```
+------------------+------------------------+-----------------------------+
| OPS CONSOLE      | PRODUCTS (330px)       | Product editor  #P-231      |
|------------------+------------------------+-----------------------------|
| Ongoing Orders   | [ Search products… ]   | Name        [Sony WF-C710N…] |
| Inventory        |+------------------------| Price       [1290000]      |
| > Products       | | P-231 Sony WF-C710N [In · 34]  | Category  [ Audio ▾ ]|
| Reviews          | | P-198 Anker 735 PB  [Low · 5]  | Image     [ thumb | Replace ]
| Users            | | P-140 Logi MX Keys S [Low · 3] | Description [textarea………]   |
| (foot: role-gated| | P-087 Razer V3      [Out · 0]  | Initial stock [34]        |
|  note)           | | … 44 more                | +--------------------------------+
|                  |+------------------------| | Specs            (round 9)  |
|                  | [ + New product ] (full) | | [Model][WF-C710N] [×]      |
|                  |                          | | [Bluetooth][5.3…] [×]     |
|                  |                          | | … 4 more rows …           |
|                  |                          | | [+ Add spec]                |
|                  |                          | +--------------------------------+
|                  |                          | Auto-decremented on each order …   |
|                  |                          |              [ Save changes ]  |
+------------------+------------------------+-----------------------------+
* selected list row: 3px atomicTangerine-500 left bar + atomicTangerine-100 bg
* stock badges on list rows: unified pills (In · 34 / Low · 5 / Out · 0)
* Specs card: white surface (round-8 §12), 130px label col × input rows,
  44px trash remove per row ("×" = trash glyph), "+ Add spec" secondary button
```

Mobile (<768px): list and form stack; form becomes the primary view when an
item is selected (back link to list). Admin consoles are desktop-first.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas / list border / form border | `#FFFFFF` / `blueSlate-200` |
| List row hover / selected | `blueSlate-50` / `atomicTangerine-100` bg + 3px `atomicTangerine-500` left bar |
| List stock badges (in/low/out) | unified pills: `willowGreen-100` / `carrotOrange-100` / `strawberryRed-100` tints, text `blueSlate-900`, 12/600, padding 4×10 (low-stock = warning role per color-tokens §3) |
| Form labels | `blueSlate-950`, 13/600 |
| Input border / focus ring | `blueSlate-200`, 44px min-height, 8px radius, placeholder `blueSlate-500`; focus ring 2px `atomicTangerine-500`, offset 2px |
| Field error | `strawberryRed-600` text, `strawberryRed-100` tint under field |
| Image upload dropzone | dashed `blueSlate-300` border, `blueSlate-700` helper; invalid image → `strawberryRed` variant |
| "Save changes" CTA | filled `atomicTangerine-600` idle → `-700` hover → `-800` active, white 14/500 label, 44px min-height, 8px radius; disabled = `blueSlate-100` fill + `blueSlate-400` label |
| "New product" button | full-width primary, same `atomicTangerine-600` filled stack |
| Specs card (round 9) | `#FFFFFF` surface (round-8 §12: 30% layer on the warm ops content ground), 1px `blueSlate-200` border, 12px radius — same card tokens as the editor card; rows: 130px `blueSlate-950` 13/600 name input col + 1fr value input, 44px min-height row floor, 16px/24px grid gaps |
| "Add spec" button | `.btn-sec` secondary: `#FFFFFF` fill, 1px `blueSlate-200` border, `blueSlate-950` 14/500 label + plus glyph, `blueSlate-100` hover, 44px min-height, 8px radius |
| Spec row remove control | `.btn-del` destructive: filled `strawberryRed-600` idle → `-700` hover → `-800` active, white 16px trash glyph, 44×44px target (touch floor), 8px radius; `aria-label="Remove spec"` on each row |
| Success flash (row / form) | `willowGreen-100` bg, `willowGreen-600` text |

## INTERACTIONS

(React: `ProductManager`, `ProductList`, `ProductForm`, `ImageDropzone`.)

- **Validation (add):** name required; price > 0 numeric; category required
  (select from existing categories — assumption; category CRUD not in sheet,
  flagged); image required for publishable listing (or allow "publish without
  image"? **TBD**, assume required); initial stock ≥ 0 integer.
  Edit: same, pre-filled; stock field = current value.
- **Enabling logic:** Save disabled until all required fields valid; dirty
  tracking — leaving with unsaved changes shows a confirm dialog.
- **Hover:** list rows `blueSlate-50`; buttons use the round-3 filled CTA
  stack (`atomicTangerine-600` → `-700` hover → `-800` active).
- **Active/loading:** Save shows spinner + "Saving…", form locks during save.
- **Disabled state:** `blueSlate-100` fill + `blueSlate-400` label on
  44px-minimum, 8px-radius buttons.
- **Error (field-level):** `strawberryRed` inline (e.g. price 400 from
  server); (form-level) `strawberryRed` banner above the form, `role="alert"`.
- **Disabled (state):** none role-wise beyond the page guard (manager+
  only). No staff/buyer UI on this page.
- **a11y:** form fields labelled; select uses native `<select>`; image drop
  zone has keyboard-replace input; stock badge text always present.
