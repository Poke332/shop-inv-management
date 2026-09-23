# Per Product Dashboard — Implementation

Phase P5 (inside the ops app shell). Visual/interaction source:
`docs/per-product-dashboard/design.md` + mockup; shell gutter per
`docs/control-panel/design.md`. This is the product CRUD console: list, add, edit.

## Route

- Path: `/ops/products` (list) + `/ops/products/:id/edit` (pre-filled editor) — roles:
  **manager / admin only** (matrix: add new product / update stock quantity / change
  product details all F for buyer + staff). No staff/buyer UI on this page.
- Arrival: ops nav "Products"; Inventory Dashboard "Open editor" (pre-filled for that
  product — the sheet's "pre-filled edit form"); deep-link `/ops/products/:id/edit`.

## Components

| Component | Responsibility |
|---|---|
| `ProductManager` | Page inside `OpsShell`: **master/detail split** — `ProductList` (left, 330px) + `ProductForm` (right, pre-filled editor). Mobile <768: list and form stack; form becomes the primary view when an item is selected (back link to list) |
| `ProductList` | All products with a search filter (reuses `SearchInput` pattern, debounced): id + name, stock badge (unified pill In · N / Low · N / Out · N — `willowGreen-100` / `carrotOrange-100` / `strawberryRed-100` tints, text `blueSlate-900`, 12/600, 4×10). Row hover `blueSlate-50`; selected row = 3px `atomicTangerine-500` left bar + `atomicTangerine-100` bg. Read-only columns — **editing happens in the form, not inline** (the form is the canonical edit surface; Inventory's inline quick-set PATCHes the same stock field but is number-only). " + New product" full-width primary button |
| `ProductForm` | **Add** (`POST /products`) and **Edit** (`PATCH /products/:id`, pre-filled) share one form with the **locked sheet field set**: name, price, description, image, category, initial stock. Field rules: name required; price > 0 numeric; category required (select from the 6 existing categories — assumption, category CRUD is out of sheet scope, flagged); image required for a publishable listing (or "publish without image"? TBD, v1 assumes required); initial stock ≥ 0 integer. Edit shows the current thumbnail + a replace control. Save disabled until all required fields valid; dirty tracking — leaving with unsaved changes shows a confirm dialog. Success (add) → list with the new row highlighted; success (edit) → stays in form with a success flash |
| `ImageDropzone` | Dashed `blueSlate-300` border, `blueSlate-700` helper; invalid image → `strawberryRed` variant; keyboard-replace input |
| `SpecsCard` (round-9) | The repeatable **name/value spec-pair section** between Description and the footer (resolves the former spec-fields TBD; supersedes the "no layout change until decided" placeholder). White surface card (`#FFFFFF` per round-8 §12, 1px `blueSlate-200`, 12px radius — same card tokens as the editor card); rows a 2-col grid `130px 1fr`, row min-height 44px, of a `.input` name + `.input` value; each row carries a 44px trash-glyph remove control (`.btn-del`, `strawberryRed-600` filled stack, white 16px trash glyph, `aria-label="Remove spec"`); "+ Add spec" secondary button (`.btn-sec`: `#FFFFFF` fill, 1px `blueSlate-200` border, `blueSlate-950` 14/500 label + plus glyph, `blueSlate-100` hover, 44px, 8px radius) appends an empty pair. **P-231 pre-fill** = the same 6 pairs as the product-details specs table: Model / Bluetooth / Battery / ANC / IP rating / Weight |

## Links

- Arrival (above). "Open editor" from Inventory → pre-filled edit for that product.
  No links into storefront pages.

## Data

- `mockApi` products CRUD against the ARCHITECTURE §4.2 set. **P-231 Sony WF-C710N** is
  the pre-filled editor example: name "Sony WF-C710N", price 1290000, category Audio,
  stock 34, 6 spec pairs; **P-198 Anker 735 PB** (Low · 5), **P-140 Logi MX Keys S**
  (Low · 3), **P-087 Razer V3** (Out · 0) are the other visible list rows.
- Future Express placeholders: `POST /products` (create, with specs pairs + stock),
  `PATCH /products/:id` (edit, pre-filled). **No delete endpoint in v1** — the matrix
  has no "delete product" permission (product CRUD = add/edit); **do not ship a delete
  button** (flagged).
- Stock-decrement note (open decision #5): if decrements are automatic (the v1
  assumption), the stock field's helper text reads "Auto-decremented on each order —
  enter actual shelf count". No behavior change in the UI.

## Surviving state

- None cross-page: selected product + form draft (incl. the spec-pair list) are in-page;
  leaving with unsaved changes prompts (confirm dialog), then the draft is dropped. The
  form re-hydrates from the product record on `/ops/products/:id/edit` arrival.

## Page-specific notes

- Button stacks (round-3): "Save changes" / "New product" = filled `atomicTangerine-600`
  idle → `-700` hover → `-800` active, white 14/500, 44px min, 8px radius; disabled =
  `blueSlate-100` fill + `blueSlate-400` label. Loading = spinner + "Saving…", form
  locks during save. Success flash (row / form) = `willowGreen-100` bg + `willowGreen-600` text.
- Field errors: inline `strawberryRed-600` text + `strawberryRed-100` tint under the
  field; form-level errors = `strawberryRed` banner above the form, `role="alert"`.
- a11y: form fields labelled; category select uses a native `<select>`; the image
  dropzone is keyboard-replaceable; stock badge text always present; focus ring 2px
  `atomicTangerine-500` offset 2.
- Verification: match mockup at 1312px (list + pre-filled P-231 editor incl. the 6-row
  Specs card); 390px = stacked list → form.
