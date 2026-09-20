# Sunset Glow — Color Tokens (shared)

Source of truth: `COLORS-draft.md` (template "Sunset Glow") — 7 colors × 11-step scale (50–950).
**Hard rule: no per-page doc may introduce a color outside this scale.** Every hex used across the
design docs is one of the 77 values below, or the declared neutral canvas white.

## 1. Scale values

Colors 1–4 of the main list carry names in the draft; colors 5–7 are unnamed in the draft and are
named here from the scale table (Willow Green, Seagrass, Blue Slate).

| Token key (Tailwind) | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `strawberryRed` | #FEE6E7 | #FDCECE | #FC9C9E | #FA6B6D | #F9393C | #F7080C | #C60609 | #940507 | #630305 | #310202 | #230102 |
| `atomicTangerine` | #FEEFE7 | #FCDFCF | #F9BE9F | #F79E6E | #F47E3E | #F15D0E | #C14B0B | #913808 | #602506 | #301303 | #220D02 |
| `carrotOrange` | #FEF3E6 | #FDE8CE | #FCD19C | #FABA6B | #F9A339 | #F78B08 | #C67006 | #945405 | #633803 | #311C02 | #231401 |
| `tuscanSun` | #FEF7E6 | #FDEFCE | #FBDF9D | #FACF6B | #F8BF3A | #F6AF09 | #C58C07 | #946905 | #624604 | #312302 | #221801 |
| `willowGreen` | #F2F7ED | #E4EFDC | #C9DFB9 | #AFD095 | #94C072 | #79B04F | #618D3F | #496A2F | #304620 | #182310 | #11190B |
| `seagrass` | #EDF8F4 | #DBF0EA | #B6E2D5 | #92D3C0 | #6DC5AB | #49B695 | #3A9278 | #2C6D5A | #1D493C | #0F241E | #0A1A15 |
| `blueSlate` | #EFF2F5 | #DFE6EC | #BFCDD9 | #9FB4C6 | #809BB3 | #60829F | #4D6880 | #394E60 | #263440 | #131A20 | #0D1216 |

Anchor note: the draft's "main" hexes sit at 400–500 of each scale (e.g. Strawberry Red #F94144 ≈
`strawberryRed-400` — note: the draft states main hex `#F94144` but its own scale table's 400 step is
`#F9393C`; this doc standardizes on the scale table, so `#F94144` is retired). By Tailwind
convention, **500 is the canonical brand anchor weight**; 600 is the accessible text-on-light
weight variant.

## 2. Tailwind config mapping (theme keys)

`tailwind.config.js` (design intent; the frontend-coder transcribes this):

```js
theme: {
  extend: {
    colors: {
      // full 50–950 scales, keys as in §1
      strawberryRed:   { 50: '#FEE6E7', /* …50–950 from §1 table */ 950: '#230102' },
      atomicTangerine: { 50: '#FEEFE7', /* … */ 950: '#220D02' },
      carrotOrange:    { 50: '#FEF3E6', /* … */ 950: '#231401' },
      tuscanSun:       { 50: '#FEF7E6', /* … */ 950: '#221801' },
      willowGreen:     { 50: '#F2F7ED', /* … */ 950: '#11190B' },
      seagrass:        { 50: '#EDF8F4', /* … */ 950: '#0A1A15' },
      blueSlate:       { 50: '#EFF2F5', /* … */ 950: '#0D1216' },
      // semantic aliases (point at scale steps above — no new colors)
      primary:    { DEFAULT: '#F15D0E', 600: '#C14B0B' },   // atomicTangerine
      secondary:  '#F78B08',                                 // carrotOrange-500
      accent:     '#F6AF09',                                  // tuscanSun-500
      destructive:'#C60609',                                  // strawberryRed-600
      success:    '#79B04F',                                  // willowGreen-500
      info:       '#60829F',                                  // blueSlate-500
      ink:        '#0D1216',                                   // blueSlate-950 — body text
      inkMuted:   '#394E60',                                   // blueSlate-700
      surface:    '#EFF2F5',                                   // blueSlate-50 — soft panels
      border:     '#BFCDD9',                                   // blueSlate-200
      canvas:     '#FFFFFF',                                   // declared neutral white (see §3)
    },
  },
}
```

## 3. Semantic role assignments

| UI role | Token (weight) | Notes |
|---|---|---|
| Primary CTA (Buy, Place order, Save, Submit) | `atomicTangerine-500`, label white; small text on it uses `atomicTangerine-600` bg | 500+white = 3.3:1 (§6) — fine for ≥18px / bold button labels; 600 for small text |
| Secondary button / price emphasis | `carrotOrange-500` | |
| Featured tag, star rating, "highlight" | `tuscanSun-500` | filled stars; empty stars = `tuscanSun-200` |
| Error, destructive, out-of-stock, delete | `strawberryRed-500/600`; tinted surface `strawberryRed-100` | button: 600 bg + white label; text = `-700` (§6) |
| Success, in-stock, delivered, approved | `willowGreen-500/600`; tinted surface `willowGreen-100` | text = `-700` (§6) |
| Processing state, positive secondary | `seagrass-500/600`; tinted surface `seagrass-100` | text = `-700` (§6) |
| Warning / low-stock alert | `carrotOrange-500/600`; tinted surface `carrotOrange-100` | text = `-700` (§6) |
| Neutral text | `blueSlate-950` (headings/body), `blueSlate-700` (muted), `blueSlate-500` (placeholders) | |
| Neutral borders / dividers | `blueSlate-200` | |
| Panel / chip surfaces | `blueSlate-50` (storefront), `blueSlate-100` (hover) | |
| Dark panels (ops console header, badges) | `blueSlate-800/900`, text `blueSlate-50` | |
| Canvas (page background) | `#FFFFFF` | declared neutral, not part of the 7-color scale; the only permitted non-scale value |

### Order status machine (locked by the sheet) — chip mapping

| Status | Chip bg | Chip text |
|---|---|---|
| pending | `tuscanSun-100` | `blueSlate-900` |
| processing | `seagrass-100` | `blueSlate-900` |
| shipped | `blueSlate-100` | `blueSlate-900` |
| delivered | `willowGreen-100` | `blueSlate-900` |

Any failure/stock-error state reuses `strawberryRed` — no new hue.

## 4. Usage rules

- Components reference **token keys** (`atomicTangerine-500`), never raw hex.
- Tinted status surfaces always use `-100`/`-50` steps with `blueSlate-900` text for 4.5:1.
- Focus ring: `atomicTangerine-500` (2px) on all interactive elements.
- Weight 900/950 steps are reserved for text and dark surfaces, not for fills on CTA-like elements.

## 5. Role-accent convention

One hue family per RBAC role (from `Sheets-report.md`), fixed — page docs reference these,
do not reassign:

| Role | Accent family | Where it shows |
|---|---|---|
| buyer | `atomicTangerine` | storefront accent, primary CTA |
| staff | `carrotOrange` | ops-console accent, alert highlights |
| manager | `seagrass` | product/stock panel accent |
| admin | `strawberryRed` | user-management accent, privileged/destructive context |

Role badge spec: bg `<accent>-100`, text `<accent>-700` (verified 4.5:1+, see §6),
1px border `<accent>-300`. Admin badge may additionally carry a `strawberryRed` ring to
signal the most-protected surface.

## 6. State tokens (success / warning / error / disabled / info)

Semantic tokens are **aliases of the scale above — no new hex**.

| State | Text on light bg | Tinted surface | Border | Usage |
|---|---|---|---|---|
| success | `willowGreen-700` (#496A2F) | `willowGreen-100` | `willowGreen-300` | in-stock, order delivered, review approved |
| warning | `carrotOrange-700` (#945405) | `carrotOrange-100` | `carrotOrange-300` | low stock, out-of-stock alert, re-stock due |
| error | `strawberryRed-700` (#940507) | `strawberryRed-100` | `strawberryRed-300` | form error, checkout failure, insufficient stock |
| info | `blueSlate-700` (#394E60) | `blueSlate-100` | `blueSlate-300` | neutral notice, pending state, disabled hint |
| disabled | `blueSlate-400` (#809BB3) on `blueSlate-100` fill | `blueSlate-100` | `blueSlate-200` | Checkout w/ empty cart, form controls before validation |

Button state recipe: idle = 500/600 fill (white or `blueSlate-900` label per §3),
hover = 600, active = 700, disabled = `blueSlate-100` fill + `blueSlate-400` label +
`cursor-not-allowed` (no hover/active). Loading state: button keeps 600 fill, label
replaced by spinner (`blueSlate-950` on tint / `#FFFFFF` on 600+ fill) + `aria-busy`.

### WCAG 2.1 contrast (computed per WCAG 2.1 formula, verified against §1 values)

| Pairing | Ratio | Verdict |
|---|---|---|
| `blueSlate-950` #0D1216 on `#FFFFFF` | 18.8 | AAA body/heading |
| `blueSlate-700` #394E60 on `#FFFFFF` | 8.6 | AA+ secondary text / state text |
| `blueSlate-500` #60829F on `#FFFFFF` | 4.05 | below 4.5 — placeholders & large text only |
| `#FFFFFF` on `atomicTangerine-600` #C14B0B | 4.9 | AA white button label |
| `#FFFFFF` on `atomicTangerine-500` #F15D0E | 3.3 | large/UI components only; small labels use 600 |
| `willowGreen-700` on `willowGreen-100` | 5.2 | success text on tint |
| `carrotOrange-700` on `carrotOrange-100` | 5.0 | warning text on tint |
| `strawberryRed-700` on `strawberryRed-100` | 6.5 | error text on tint |
| `blueSlate-900` on any `-100` chip tint | 13.9–15.4 | chip text OK |
| `strawberryRed-700` on `#FFFFFF` | 9.2 | error text on white |
| `blueSlate-400` on `blueSlate-100` (disabled) | 2.3 | disabled controls — exempt per WCAG 1.4.3 (inactive UI) |

Hard limits: body text on white = weight 700+ (strawberryRed/tangerine/carrot/tuscan/
willow); blueSlate 700+. Placeholder/muted = 500 max. Tuscan weights below 800 are
fill/decoration only — never text. White labels only on 600+ fills.

## 7. Rules for page docs

1. Reference tokens by key (`atomicTangerine-500`), never raw hex, except declared
   `#FFFFFF` canvas (§2).
2. No color outside the 77 scale values + white canvas. New-need = extend this file
   first (owner: uiux-designer), then use it.
3. Open decisions stay `TBD` in page docs; color mappings for TBD features use only
   the tokens above.
