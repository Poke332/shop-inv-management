# Design Tokens — Round 3 (Sunset Glow)

Source of truth for every pixel decision in Round-3 mockups and the future React/Tailwind build.
Colors: `docs/color-tokens.md` (Sunset Glow 50–950, 7 families). Role-accent + RBAC gating:
color-tokens §5. This document adds the **typography, spacing, and component layers** on top of
the color tokens. No value here may introduce a color outside the 77-value scale + `#FFFFFF`
surface. (Round 7, §11: `#FFFFFF` is demoted from the dominant canvas to the
30% surface layer; the new 60% dominant ground is `tuscanSun-50` #FEF7E6 —
itself an in-scale 77-value tone, so no out-of-scale color is introduced.)

Round-3 goal: look built, not templated — real type hierarchy, 8pt rhythm, filled CTAs, badge
pills, and product tiles that don't read as line-art placeholders.

## 1. Typography

One family: **Roboto**, weights **400 / 500 / 600 only** — no 700+, no 300. Headings carry the
hierarchy via size + weight, never via decorative fonts.

Font loading (put in every HTML head / app entry):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap"
      rel="stylesheet">
```

Fallback (no-JS / offline / render-time): `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

### Scale

| Token | px / line-height | Weight | Usage |
|---|---|---|---|
| `h1` | 26px / 36px | 600 | page title only, one per page |
| `section-header` | 16px / 24px | 600, `letter-spacing: 0.05em`, **not uppercase** | "SHOP ALL", "FEATURED & CATEGORIES" section labels |
| `card-title` | 15px / 24px | 600 | product card title, 1-line clamped (§5) |
| `body` | 14px / 20px | 500 | card description, form values, button labels |
| `price` | 14px / 20px | **600** | current price — distinguished by **weight + color, never size** |
| `strike-price` | 13px / 20px | 400, line-through | original price next to a discounted one |
| `metadata` | 13px / 20px | 400 | SKU, stock hint, category tag, helper text |
| `badge` | 12px / 16px | 600, `letter-spacing: 0.02em` | pill badges (§3), small counts |

Price rule, made explicit: on a sale card the line reads
`Rp1.240jt` (600, `atomicTangerine-600`) then `Rp1.499jt` (400 strikethrough, `blueSlate-600`).
The sale price is **smaller in visual area than the title only via the strike**, and identical in
size to regular prices — weight and color do the work, not scaling.

### CSS variables

```css
:root {
  /* Roboto via the <link> above; system fallback when it fails */
  --font-sans: "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 20px;

  /* type scale */
  --text-h1: 26px;      --lh-h1: 36px;
  --text-section: 16px; --lh-section: 24px; --track-section: 0.05em;
  --text-card: 15px;    --lh-card: 24px;
  --text-body: 14px;    --lh-body: 20px;
  --text-price: 14px;   --lh-price: 20px;
  --text-meta: 13px;    --lh-meta: 20px;
  --text-badge: 12px;   --lh-badge: 16px;

  /* weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
}
```

### Tailwind (config extend — transcribe for the build)

```js
theme: {
  extend: {
    fontFamily: { sans: ["Roboto", "system-ui", "-apple-system", "Segoe UI", "sans-serif"] },
    fontSize: {
      h1: ["26px", { lineHeight: "36px", fontWeight: "600" }],
      section: ["16px", { lineHeight: "24px", fontWeight: "600", letterSpacing: "0.05em" }],
      card: ["15px", { lineHeight: "24px", fontWeight: "600" }],
      body: ["14px", { lineHeight: "20px", fontWeight: "500" }],
      price: ["14px", { lineHeight: "20px", fontWeight: "600" }],
      meta: ["13px", { lineHeight: "20px", fontWeight: "400" }],
      badge: ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.02em" }],
    },
  },
}
```

## 2. Spacing — 8pt grid, airy

All values are multiples of 8 except `touch-min` (44, a11y floor) and `radius` tokens.

| Token | Value | Usage |
|---|---|---|
| `space-2` … `space-12` | 8 / 16 / 24 / 32 / 40 / 48 / 56 | full 8pt scale, used via the grid below |
| `card-gutter` | **32px** (mobile **24px** at <768px) | gap between cards in a grid row |
| `card-padding` | **24px** | inside a card, all sides |
| `section-rhythm` | **48px** (mobile **40px**) | vertical space between page sections |
| `section-label-gap` | **20px** | between a section header and the first row/cards of that section |
| `touch-min` | **44px** | min height AND width for every tap target (buttons, icon buttons, load-more) |

"Airy" is a budget, not a vibe: sections may **add** whitespace in 8px steps (64, 72, 80) but
never **subtract** below the values above. Desktop content max-width **1200px**, centered, with
48px page gutters (24px at mobile).

```css
:root {
  --card-gutter: 32px;
  --card-padding: 24px;
  --section-rhythm: 48px;
  --section-label-gap: 20px;
  --touch-min: 44px;
  --content-max: 1200px;
  --page-gutter: 48px;
}
@media (max-width: 767px) {
  :root { --card-gutter: 24px; --section-rhythm: 40px; --page-gutter: 24px; }
}
```

```js
// Tailwind extend
spacing: {
  4.5: "18px",
  "card-gutter": "var(--card-gutter)",
  "card-padding": "var(--card-padding)",
  "section-rhythm": "var(--section-rhythm)",
  "section-label-gap": "var(--section-label-gap)",
  "touch": "44px",
},
```

## 3. Component tokens

### 3.1 Badges — one pill style, three fills

Every status badge on a card is the **same pill**: `border-radius: 999px`, `padding: 4px 10px`,
font `badge` (12px/600), icon 14px + 4px gap, `white-space: nowrap`. Only color changes per
status. No square badges, no outline-only badges, no mixed radii.

| Badge | Fill | Label | Boundary note |
|---|---|---|---|
| **On-sale** ("−X%", "On sale") | `strawberryRed-600` #C60609 | white | white/600 = 6.12:1 ✓ |
| **Featured** ("Featured") | `tuscanSun-500` #F6AF09 | `blueSlate-950` #0D1216 | 9.91:1 ✓; add `border: 1px solid tuscanSun-600` so the pill edge clears 3:1 on white (bare 500 fill = 1.90:1, decorative-only) |
| **Low-stock** ("Only N left") | `carrotOrange-500` #F78B08 | `blueSlate-950` | 7.76:1 ✓; add `border: 1px solid carrotOrange-600` (bare 500 fill = 2.43:1, decorative-only) |

Placement (fixed, on the tile): **on-sale / out-of-stock → top-left; featured → top-right;
low-stock → bottom-left** (stock states cluster near the price/CTA zone, the featured mark gets
the clean corner). All sit 8px inside the tile edge.

```css
:root {
  --radius-pill: 999px;
  --badge-pad-x: 10px;  --badge-pad-y: 4px;
}
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  border-radius: var(--radius-pill);
  padding: var(--badge-pad-y) var(--badge-pad-x);
  font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.02em;
  white-space: nowrap;
}
.badge-sale      { background: var(--strawberryRed-600); color: #fff; }
.badge-featured  { background: var(--tuscanSun-500); color: var(--blueSlate-950); border: 1px solid var(--tuscanSun-600); }
.badge-lowstock  { background: var(--carrotOrange-500); color: var(--blueSlate-950); border: 1px solid var(--carrotOrange-600); }
```

### 3.2 CTA buttons — filled, 44px, four states

Primary actions are **filled**, never ghost/outline. Min height **44px**; width `auto` with
`min-width: 44px`, `padding: 0 20px`.

| State | Fill | Label |
|---|---|---|
| idle | `atomicTangerine-600` #C14B0B | white (4.91:1 ✓ AA) |
| hover | `atomicTangerine-700` #913808 | white (7.57:1 ✓) |
| active | `atomicTangerine-800` #602506 | white (11.90:1 ✓) |
| disabled | `blueSlate-100` fill, `blueSlate-400` label | — (exempt, WCAG 1.4.3 inactive) |
| loading | idle fill kept, label → spinner | `aria-busy="true"` |

Radius `8px`. Transition: background-color 150ms ease only — no scale, no shadow bloom.

```css
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: var(--touch-min); min-width: var(--touch-min);
  padding: 0 20px; border-radius: 8px; border: 0; cursor: pointer;
  background: var(--atomicTangerine-600); color: #fff;
  font: 500 14px/20px var(--font-sans);
  transition: background-color 150ms ease;
}
.btn-primary:hover  { background: var(--atomicTangerine-700); }
.btn-primary:active { background: var(--atomicTangerine-800); }
.btn-primary:disabled {
  background: var(--blueSlate-100); color: var(--blueSlate-400); cursor: not-allowed;
}
```

**"Load more" is a button, not a text link.** Centered under the grid: full-width on mobile,
320px wide on desktop, idle `atomicTangerine-600` → hover `-700` → active `-800` (same state
stack as above). When there are no more products, replace it with a 13px/400 `blueSlate-700`
line — "All N products shown" — not a disabled-looking button.

Secondary / destructive variants (checkout, ops panels):
secondary = white fill, 1px `blueSlate-200` border, `blueSlate-950` label, hover fill
`blueSlate-50` (4.05:1 label fails AA on white, so hover fill must be `blueSlate-100` #DFE6EC
— 14.95:1 ✓). Destructive = `strawberryRed-600` fill stack (same hover/active -700/-800 rule).

### 3.3 Product visuals — gradient tiles, not line-art

Replace the Round-2 faint line-art with **CSS gradient tiles** that read as intentional swatches,
not placeholders.

- Tile: `aspect-ratio: 4 / 3`, `border-radius: 8px`, overflow hidden.
- Fill: `linear-gradient(135deg, <50-step> 0%, <400-step> 100%)` of the family mapped to the
  category (table below). No radial glows, no overlays, no shadows.
- Icon: single line-glyph (headphones, bulb, gamepad, laptop, watch…), **40px, stroke 1.5,
  `blueSlate-900` #131A20 on every tile** — one neutral ink over the hue-keyed gradient.
  The category hue is carried by the gradient + the card's category metadata line, not the
  glyph color. Glyph/gradient worst-corner contrast (dark end of the 400 stop): 4.75:1
  (strawberryRed) to 10.45:1 (tuscanSun) — all ≥ 3:1 ✓. (Per-family 700-step glyphs were
  rejected: 2.49–2.97:1 on the gradient's dark corner, fails WCAG 1.4.11.)
- Out-of-stock: tile at `opacity: 0.4` + "Out of stock" pill (`strawberryRed-700` on
  `strawberryRed-100`, 6.5:1 ✓) — pill, not a banner stripe.

Category → gradient (fixed, reuse everywhere a category visual appears; glyph =
`blueSlate-900` on all):

| Category | Gradient | Glyph / gradient min contrast |
|---|---|---|
| Audio | `tuscanSun-50 → tuscanSun-400` | 10.45:1 ✓ |
| Smart Home | `seagrass-50 → seagrass-400` | 8.55:1 ✓ |
| Gaming | `atomicTangerine-50 → atomicTangerine-400` | 6.60:1 ✓ |
| Laptops & PC | `blueSlate-50 → blueSlate-400` | 6.07:1 ✓ |
| Accessories | `carrotOrange-50 → carrotOrange-400` | 8.63:1 ✓ |
| Wearables | `strawberryRed-50 → strawberryRed-400` | 4.75:1 ✓ |
| Unmapped / new | `blueSlate-50 → blueSlate-400` | 6.07:1 ✓ |

```css
.tile { position: relative; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden;
        display: grid; place-items: center; }
.tile-audio  { background: linear-gradient(135deg, var(--tuscanSun-50), var(--tuscanSun-400)); }
.tile-smart  { background: linear-gradient(135deg, var(--seagrass-50), var(--seagrass-400)); }
/* … same pattern per category */
.tile svg { width: 40px; height: 40px; stroke: 1.5; color: var(--blueSlate-900); }
```

### 3.4 Card layout — baselines that line up

- **Title: `line-clamp: 1`.** `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
  with `min-height: 24px`. No wrapped titles, ever — the ellipsis is the overflow answer and
  the full name lives in the card link (`aria-label`) and the product page H1.
- **Grid columns: `repeat(N, minmax(0, 1fr))`, not bare `1fr`.** Bare `1fr` is
  `minmax(auto, 1fr)`: each column refuses to shrink below its widest content's intrinsic
  min-width. The 1-line-clamped `nowrap` titles (300–500px of unbreakable text) then force
  the row wider than the viewport — measured in the render check: 2075px scroll width at a
  1280px viewport, plus uneven column widths that cascade into misaligned tile heights and
  title baselines within a row. `minmax(0,1fr)` + `min-width: 0` on the card (grid item)
  restores equal columns and true row baselines — re-measured after the fix: 1280px viewport
  has zero horizontal scroll, all button tops in a row identical, all card heights equal;
  the 390px band (2-column) and 785px band (3-column) also measure zero horizontal scroll.
- Card = flex column, `min-height: 300px`; title block fixed 24px; price block fixed 40px
  (price + strike on one baseline row); CTA row pinned to `margin-top: auto` so every card in a
  row has its button on the same line even when titles differ.
- Equal card height per row (grid `align-items: stretch`), 12px vertical gap inside the card
  between tile → title → price → CTA (12 = grid step allowed inside a card; the 8pt rule
  governs *page* rhythm, not card internals).

```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)); /* §8 sets the N per breakpoint */
  gap: var(--card-gutter);
}
.card { min-width: 0; } /* grid-item floor — required for the minmax(0,1fr) fix */
```

### 3.5 No FEATURED / SHOP ALL duplication

Round-2 showed the featured products **twice**: in a FEATURED strip and again at the top of the
SHOP ALL grid. Round-3:

- **Kill the FEATURED strip as a separate section.** Featured items stay in the single
  "SHOP ALL" grid, marked only by the top-right `badge-featured` on their tile.
- Section structure of the store page, top to bottom:
  `h1` → SHOP ALL header → grid (featured items first, badge-marked) → Load-more button.
  One section, zero duplication. (If a category filter ships later, it is the second section —
  still no repeated products.)

## 4. States (loading / empty / error)

| State | Treatment |
|---|---|
| Loading | 6 skeleton tiles, `blueSlate-100` blocks matching tile/title/price/CTA shape, 150ms shimmer or static (pick **static** — no loop, reduced-motion safe) |
| Empty grid | centered 20px/600 `blueSlate-950` "No products yet" + 14px/400 `blueSlate-700` line + one primary CTA ("Refresh") — name the cause and the next action |
| API error | panel `strawberryRed-100` bg, `strawberryRed-700` text, "Try again" (`strawberryRed-600` fill, white) |

## 5. TBD markers (keep — do not resolve in mockups)

Per color-tokens §7 and Sheets-report open decisions: **cart color accents, payment-method
tokens, public stock-exposure, alert/notification colors, star-rating colors** stay `TBD` in the
page docs. Mockups may show the cart icon and star glyphs using the color-tokens §3 mappings
(cart badge = `atomicTangerine-500` white number; stars = `tuscanSun-500` filled /
`tuscanSun-200` empty) but must mark them `<!-- TBD: per open decision #X -->` so the QA pass
can flag them. Nothing new is decided here.

## 6. RBAC gating — preserved, unchanged

Role accents and gating stay exactly as color-tokens §5: buyer = `atomicTangerine`, staff =
`carrotOrange`, manager = `seagrass`, admin = `strawberryRed`; role badge = `<accent>-100`
fill + `<accent>-700` text + 1px `<accent>-300` border. Ops-console pages (inventory,
per-product dashboard, user dashboard, per-product review panel) keep their role-gated routes;
this token spec changes their **visual system** (type/spacing/components), not their access
matrix. The admin destructive context keeps `strawberryRed` as its only accent.

## 7. A11y requirements (all states, all breakpoints)

1. **Focus:** visible ring on every interactive element — 2px `atomicTangerine-500`
   `outline-offset: 2px` (3.33:1 vs white ✓). Never `outline: none` without this replacement.
2. **Touch targets:** every tappable element ≥ 44×44px incl. icon buttons (cart, account,
   add-to-cart) — meet the 44 floor by hit-area, not by visual size.
3. **Keyboard:** cards are real links (`<a>`), CTA rows are real `<button aria-label="Add X to
   cart">`; featured strip (if ever revived) scroll controls keyboard-reachable; logical DOM
   order = visual order.
4. **Reduced motion:** `@media (prefers-reduced-motion: reduce)` kills shimmer/transition;
   hover states remain color-only (no movement).
5. **Text:** never below 12px; metadata floor 13px (§1); 200% zoom must not clip card text
   (no `overflow: hidden` on the text container, only the 1-line clamp).
6. **Color is never the only signal:** out-of-stock = pill + 0.4 tile, low-stock = pill +
   text; sale = "−X%" number inside the pill, not hue alone.
7. **Alt:** tile glyphs are decorative → `aria-hidden="true"` on the SVG; the card link text
   carries the product name.

## 8. Breakpoints

| Range | Grid | Notes |
|---|---|---|
| < 390px | 1 column | `card-gutter` N/A, `page-gutter` 16px |
| 390–767px | 2 columns, 24px gutter | badges stay `nowrap`; verify no horizontal scroll at 390px |
| 768–1023px | 3 columns, 32px gutter | |
| ≥ 1024px | 4 columns, 32px gutter, content max 1200px | desktop QA viewport |

Mobile header: logo left, cart + account right, search row on its own line below (44px min).

## 9. What changed vs Round 2 (the diff)

| Element | Round 2 | Round 3 |
|---|---|---|
| Font | default sans stack | Roboto 400/500/600, fixed type scale (§1) |
| Section labels | ~12px, heavy tracking, often uppercase | 16px/600, 0.05em, sentence case (§1) |
| Card gaps | 12px | 32px desktop / 24px mobile, section rhythm 48px (§2) |
| Prices | size-based emphasis | 14px/600 `atomicTangerine-600`, color+weight only (§1) |
| Badges | mixed square/pill, thin borders | single pill, 3 fills + boundary border (§3.1) |
| Load more | ghost text-ish | filled 44px button, 3-state stack (§3.2) |
| Product visuals | faint line-art placeholders | gradient tiles + 700-step glyph, category-mapped (§3.3) |
| Card titles | free-wrap | 1-line clamp, pinned CTA row (§3.4) |
| Featured | separate strip, duplicated in grid | strip removed, badge-only marking (§3.5) |
| Skeletons | shimmer loops | static, reduced-motion safe (§4) |

## 10. Contrast ledger (WCAG 2.1, computed — do not eyeball)

Verified pairs (text/background): `atomicTangerine-600`/white 4.91 · `tuscanSun-500` with
`blueSlate-950` 9.91 · `carrotOrange-500` with `blueSlate-950` 7.76 ·
`strawberryRed-600` with white 6.12 · `strawberryRed-700`/`strawberryRed-100` 6.52 ·
`blueSlate-600`/white 5.82 · `blueSlate-700`/white 8.63 · `blueSlate-950`/`blueSlate-100`
14.95 · `blueSlate-950`/`blueSlate-50` 16.76.

Known limits (by design, documented): bare `tuscanSun-500` and `carrotOrange-500` fills fail
3:1 against white (1.90 / 2.43) → badges always carry the 600-step boundary border (§3.1).
`blueSlate-200` card borders are decorative framing (1.62:1 vs white) — they never carry
meaning; state chips use tint+text instead. `blueSlate-500` placeholder text is 4.05:1 →
large-text/decorative only, per color-tokens §6.

## 11. Color usage ratio — 60 : 30 : 10 (Round 7)

Round 3 shipped on a pure `#FFFFFF` canvas, which reads flat/blank. Round 7 applies the
classic **60 : 30 : 10** distribution to the buyer-facing storefront so the surface is layered
and warm. This is a **usage-ratio change, not a new palette** — every value below is one of
the 77 in-scale tones + the demoted white. Nothing out-of-scale is introduced.

### 11.1 The three layers (exact tokens, all in-scale)

| Layer | Share | Token | Hex | Role |
|---|---|---|---|---|
| **Dominant ground** | **60%** | `tuscanSun-50` | `#FEF7E6` | page background — the warm light ground that replaces the `#FFFFFF` canvas; carries the "Sunset Glow" warmth without competing with content |
| **Secondary surface** | **30%** | `#FFFFFF` (card/panel/form-field fill) | `#FFFFFF` | now sits **on** the warm ground (was the canvas itself); depth reads as a bright panel floating on the tinted ground. `blueSlate-50` stays the alternate soft surface where the design already called for it |
| **Accent** | **10%** | `atomicTangerine-600` `#C14B0B` (primary CTA/price), `strawberryRed-600` `#C60609` (sale/error/destructive), `carrotOrange-500` `#F78B08` (low-stock/secondary), `tuscanSun-500` `#F6AF09` (featured/star) | — | highest-attention elements only: primary buttons, sale/discount badges, stock alerts, featured marks. Kept to ~10% of the surface so the eye lands on it |

- **60% ground:** set as the `body`/page background. Replaces `--canvas:#FFFFFF` in the
  generator (`_mockup-build/lib.py`) and the "Canvas" row in each storefront page doc's
  COLOR-USAGE table. A subtle warm wash built from in-scale tones is also acceptable where a
  flat fill feels too static, but it must stay within the 77-value scale (e.g. a
  `tuscanSun-50 → blueSlate-50` wash). No gradient may introduce a hue outside the scale.
- **30% surfaces:** cards, panels, form fields, and badge tints keep their existing white /
  `blueSlate-50` / `blueSlate-100` fills; they become visually *distinct* from the new warm
  ground, which is the whole point of the ratio. No surface token changes — only its
  relationship to the ground changes.
- **10% accent:** unchanged from color-tokens §3/§5 (primary `atomicTangerine-600` stack,
  destructive/sale `strawberryRed-600`, low-stock `carrotOrange`, featured `tuscanSun-500`).
  The ratio is a *discipline on how much* accent may appear, not a new set of colors.

### 11.2 On-ground contrast deltas (recomputed on `tuscanSun-50` #FEF7E6 — do not eyeball)

The ground is near-white warm, so most on-ground pairs barely move. Pairs that **change** vs
the white-canvas baseline, computed per WCAG 2.1 (formula self-tested against the §10 ledger
anchors, all exact):

| Pair | On white (R3) | On ground (R7) | Verdict on ground |
|---|---|---|---|
| `blueSlate-950` text | 18.83 | **17.63** | AAA ✓ |
| `blueSlate-700` text | 8.63 | **8.08** | AA ✓ |
| `blueSlate-600` strike/meta | 5.82 | **5.45** | AA ✓ |
| `blueSlate-500` placeholder | 4.05 | **3.79** | still large/decorative only (consistent with the §10 limit — placeholder text was already <4.5 on white; no regression, no new text use allowed) |
| `atomicTangerine-600` price/link (text) | — | **4.60** | AA ✓ for ≥ 14px text; for small labels the price stays 600 weight + size per §1 |
| `strawberryRed-700` (error text) | — | **8.61** | AAA ✓ |
| `atomicTangerine-500` focus ring (non-text) | 3.33 | **3.11** | still ≥ 3:1 ✓ (WCAG 1.4.11 non-text) |

**Documented limit on ground (by design, carries the existing "decorative borders" rule):**
`blueSlate-200` card borders drop from 1.62:1 (vs white) to **1.52:1** vs the warm ground, and
`atomicTangerine-400` hover borders drop to **2.49:1** — both remain **decorative framing that
carries no meaning** (state is always tint + text, never border alone), matching the §10
"known limits" note. No new meaning is conveyed by any border, so the WCAG 1.4.11 3:1 requirement
for *meaning-bearing* UI-component boundaries is not violated. White surface-on-ground edge is
**1.07:1** — an intentional soft warm halo, not a boundary that must clear 3:1 (the card is a
surface, not a control; focus rings and badges carry the meaningful boundaries, and those
clear 3:1 per above).

### 11.3 Which pages are in scope

- **In scope (buyer-facing storefront):** main-store, search-browse, product-details, cart,
  checkout, orders-placed, login, register. All eight COLOR-USAGE tables get their "Canvas"
  row switched to the `tuscanSun-50` ground and the surface layer made explicit (see each page
  doc).
- **Out of scope (ops / control-panel):** inventory-dashboard, per-product-dashboard,
  per-product-review-panel, ongoing-orders, user-dashboard — and the shared `control-panel`
  app-shell. These keep their dark `blueSlate-900` `.ops-sidebar` + `.ops-content` gutter
  chrome **unchanged**; if a panel's content area happens to sit on the same warm ground that
  is acceptable, but **no layout or chrome change** is made to them. The 60:30:10 ratio is a
  storefront-bias: the ops shell is intentionally high-density and dark, not a warm ground.

### 11.4 Conformance-gate re-baselining requirement

This section **changes the framework spec** (`docs/design-tokens-round3.md`), so the
conformance-gate framework lock must be **re-baselined** to the commit that introduces it:

- Gate check `[1]` (framework byte-identical to lock) will FAIL against the old lock
  `356edf3` by design — that is the re-baseline trigger, not a drift error.
- Gate check `[2]` (color conformance) already whitelists the 77-value scale; `tuscanSun-50`
  `#FEF7E6` is in-scale, so it passes **without a scanner change**. The gate's mental
  "canvas = `#FFFFFF`" assumption is the only thing to update: the dominant ground is now
  `tuscanSun-50`, and `#FFFFFF` is a sanctioned 30% surface tone, not the background. The gate
  must keep catching out-of-scale hexes and weight > 600 and off-8pt spacing — no relaxation.
- Re-baseline happens **after** the `design-tokens-round3.md` + page-doc changes land: point
  `verify_framework.sh` / `verify_framework.cjs` `LOCK` at the new commit, re-run, expect GREEN.
- The 30% white surface and 10% accents are already in the sanctioned set, so **no scanner
  whitelist change** is required — only the lock re-baseline + the §11 documentation of the
  on-ground "known limits" above.

### 11.5 What changed vs Round 3 (the diff)

| Element | Round 3 | Round 7 |
|---|---|---|
| Page background (dominant) | `#FFFFFF` canvas (flat) | `tuscanSun-50` `#FEF7E6` warm ground (60%) |
| Card/panel/form fill | `#FFFFFF` canvas (invisible on same bg) | `#FFFFFF` surface (30%, now reads as depth on warm ground) |
| Accent share | unmapped, ad hoc | disciplined to ~10% (CTA / sale / stock / featured) |
| Framework lock | `356edf3` | re-baseline to the commit that adds this §11 |
| Ops / control panels | white + dark sidebar | **unchanged** (out of scope for the ratio) |

## 12. Surface Rule — white content surfaces on the warm ground (Round 8)

When the 60% ground flipped to `tuscanSun-50` `#FEF7E6` in Round 7, some content surfaces
inherited the tint instead of staying white, and the 30% layer stopped reading as depth.
The rule is permanent:

- **Content surfaces** — cards, panels, forms, tables, sidebars — are **`#FFFFFF`**
  (the 30% layer) **on** the `tuscanSun-50` dominant warm ground (60% layer).
- **Accents** — ~10% — stay with the highest-attention elements only:
  `atomicTangerine-600` primary CTA, `strawberryRed-600` sale/error/destructive,
  `carrotOrange-500` low-stock pill. (Same accent set as §11.1; this rule does not
  change it.)
- Restoring a surface is a **fill-only change**: borders, shadows, and token
  references are preserved — only the fill returns to `#FFFFFF`. `#FFFFFF` is already
  in the gate's allowed set, so no scanner change is required.

Governed component groups (the 8 named surfaces, generator files where they live):

| # | Component group | Page | Surface |
|---|---|---|---|
| 1 | Cart item rows/cards | cart (`pages_storefront.py`) | cart items |
| 2 | Checkout shipping-address card **and** review-order card | checkout (`pages_storefront.py`) | both cards on the page |
| 3 | Product list (table) container | inventory-dashboard (`pages_ops.py`) | the table panel |
| 4 | Order cards | ongoing-orders (`pages_ops.py`) | each order card |
| 5 | Product card **and** product editor form panel | per-product-dashboard (`pages_ops.py`) | both panels |
| 6 | Specifications card **and** description card | product-details (`pages_storefront.py`) | both section cards |
| 7 | Filters sidebar panel | search-browse (`pages_storefront.py`) | the sidebar |
| 8 | User list (table) container | user-dashboard (`pages_ops.py`) | the table panel |

**Chrome stays untouched:** the control-panel shell — dark `.ops-sidebar`,
`.ops-content` 32/24 gutter, and nav — is **out of scope**; only the 8 named content
surfaces get white fills. (Consistent with §11.3: ops shell is dense/dark by design.)

### 12.1 What changed vs Round 7

| Element | Round 7 | Round 8 |
|---|---|---|
| Content-surface fills | 30% layer partly tinted to the `tuscanSun-50` ground | **all** content surfaces `#FFFFFF` over the ground (explicit rule) |
| Ground / accents | `tuscanSun-50` 60% / accents ~10% | unchanged |
| Control-panel chrome | unchanged | unchanged |

