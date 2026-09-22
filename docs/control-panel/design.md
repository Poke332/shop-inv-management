# Control Panel (Ops) — App-Shell Layout Spec v4 (Sunset Glow)

Shared shell contract for all 5 ops pages: **Ongoing Orders, Inventory
Dashboard, Per Product Dashboard, Per Product Review Panel, User Dashboard**
(`docs/<page>/design.md` each). This document is **layout-only** — it does
not redefine sidebar visuals, RBAC, page features, or any per-page table
layout; those stay in their page docs. What it owns: the sidebar/content
split, the gutter, and the reset-override rule that keeps the gutter from
collapsing to 0px.

Palette: `docs/color-tokens.md`. Typography & spacing:
`docs/design-tokens-round3.md`.

## THE BUG (diagnosis)

Round-3 mockups rendered the 230px `blueSlate-900` sidebar and the white
content column **flush** — a 0-px gap. Root cause in the round-3
`_mockup-build/lib.py` base CSS:

```css
*{box-sizing:border-box;margin:0;padding:0}   /* global reset */
```

This universal reset zeroes **every** element's padding, and any padding that
the content column was carrying via the `body`/root (or via a later framework
preflight that loads after the page CSS) is wiped. The content therefore
touches the sidebar's right edge. The fix is **not** to re-add root padding
and hope the reset order stays lucky — it is to put the padding **on the
content container itself, as an explicit token**, so no reset, load order,
or framework preflight can eat it. This is the v4 rule: the gutter is a
**named layout token on a named element**, never inherited and never
positional.

## LAYOUT (v4)

DOM contract (the per-page wireframes in each `design.md` map onto this):

```
<div class="ops-shell">                 /* flex row, full height */
  <aside class="ops-sidebar">           /* 230px fixed, blueSlate-900 */
    …ops nav (round-3: role-gated items, nbadges, active bar)…
  </aside>
  <main class="ops-content">           /* flex: 1; the GUTTER lives here */
    <div class="ops-page">…page-specific (table/list/panel/form)…</div>
  </main>
</div>
```

| Element | Property | Value | Notes |
|---|---|---|---|
| `.ops-shell` | `display` | `flex` | row; sidebar + content |
| `.ops-shell` | `min-height` | `100dvh` | full-viewport ops app |
| `.ops-sidebar` | `width` | **`var(--ops-sidebar-w)` = 230px** | `flex: none` so it never shrinks; the 230 is **a token, not a hardcoded 230** scattered in the CSS |
| `.ops-content` | `flex` | `1` | |
| `.ops-content` | `min-width` | `0` | grid/flex shrink floor (round-3 §3.4 rule, applies to the content column too) |
| `.ops-content` | `padding` | **`var(--ops-page-pad)` = 32px** | **the gutter.** Set on the container itself, so the universal reset cannot zero it away (it targets the `*` padding:0, not a named var re-applied on `.ops-content` — see override rule below). 32px = the round-3 `page-gutter` token; 32 is on the 8pt grid |
| `.ops-content` | `padding` (mobile <768px) | **`var(--ops-page-pad)` = 24px** | mobile drop, same token, different value via the media query |
| `.ops-content` | `overflow` | `auto` | long tables scroll inside the content column, not the shell |
| `.ops-page` | — | page-specific | tables/lists/forms; uses round-3 card-gutter / section-rhythm internally, but the **left edge of `.ops-page` sits 32px (desktop) / 24px (mobile) off the sidebar** by virtue of the `.ops-content` padding |

### Round-3 class mapping (what the mockup generator's CSS becomes)

The round-3 generator (`_mockup-build/lib.py`) already renders the shell
with three classes; v4 renames two of them to the canonical names above.
This is the exact mapping a coder applies when porting the shell to the
React/Tailwind build (and to the next round of HTML mockups):

| Round-3 class | v4 class | What changes |
|---|---|---|
| `.ops-shell` (`display:flex; min-height:736px`) | `.ops-shell` | `min-height:736px` (a mockup render box) → `100dvh` |
| `.oside` (230px literal, `padding:20px 14px`) | `.ops-sidebar` | width literal → `var(--ops-sidebar-w)`; keep `flex:none`; sidebar *inner* padding (20px 14px) is cosmetic and stays |
| `.ops-body` (`flex:1; padding:20px 24px`) | `.ops-content` | **the 20px/24px literal padding → `var(--ops-page-pad)`** (this is the fix); add `min-width:0; overflow:auto` |
| `.ops-page` (`display:flex; gap:24px`) | `.ops-page` | unchanged; its 24px gap is *internal* to multi-column pages (e.g. list|editor split) and is **not** the shell gutter — the shell gutter is exclusively the `.ops-content` padding |

The **gutter = `.ops-content` padding**, and it is guaranteed non-zero:
32px desktop, 24px mobile. No element in the shell may be positioned
`absolute` against the shell to re-close that gap; the sidebar is a flex
item with `flex:none` and the content is a flex item with `flex:1`, so the
two never overlap.

### Reset-override rule (the actual fix, in CSS)

Declare the tokens and apply them **directly on the element** — do not rely
on `body` padding or a "more specific" selector winning by accident:

```css
:root{
  --ops-sidebar-w: 230px;     /* sidebar width token */
  --ops-page-pad: 32px;      /* content-container padding = the gutter */
  --ops-page-pad-mobile: 24px;
}
@media (max-width: 767px){
  :root{ --ops-page-pad: var(--ops-page-pad-mobile); }
}

.ops-shell{ display:flex; min-height:100dvh; }
.ops-sidebar{
  width: var(--ops-sidebar-w);     /* 230px, token, not literal */
  flex: none;
  /* round-3 sidebar visuals: blueSlate-900 bg, blueSlate-50 text,
     active item blueSlate-800 + 3px atomicTangerine-500 left bar,
     nbadge strawberryRed-600 white 12/600 pill (unchanged from round 3) */
}
.ops-content{
  flex: 1;
  min-width: 0;
  padding: var(--ops-page-pad);    /* 32px desktop / 24px mobile — the gutter */
  overflow: auto;
}
```

Why this survives the reset: the universal `*{padding:0}` sets padding to 0,
but **`.ops-content` is a named class, and `.ops-content{padding:var(--ops-page-pad)}`
is a class selector (specificity 0,1,0) that beats the universal `*`
(specificity 0,0,0) regardless of source order** — so the class rule wins
even when the reset comes later, and even when a Tailwind preflight loads
after the page CSS. The padding is token-driven, so changing the gutter is a
one-line `:root` edit, not a sweep of literals. (If a framework preflight
ever declares `.ops-content{padding:0}` at the same class specificity, bump
to `#ops .ops-content` or add `!important` on the single `padding` line —
but that is not the round-3/4 situation.)

### Sidebar / content relationship

- Sidebar is **fixed-width 230px** on desktop; it does **not** participate in
  the content column's max-width. The content column is `flex:1` and scrolls
  internally.
- There is exactly **one** gutter, and it is the `.ops-content` padding. The
  24px flex `gap` that round-3 used between an `.ops-page` flex and its
  inner column is **removed** in v4 — the content column's padding is the
  single source of sidebar-to-content spacing. (Per-page multi-column
  layouts, e.g. Per Product Dashboard's list|editor split, keep their own
  internal gaps *inside* `.ops-page`; the shell gutter is separate.)
- Sidebar height = full `100dvh`; its own internal scroll (if nav overflows)
  is `overflow-y:auto` on `.ops-sidebar`, independent of content scroll.

## MOBILE (<768px)

- **Sidebar collapses to an off-canvas drawer** (ops consoles are
  desktop-first — this is the supported-but-degraded path, consistent with
  the round-3 "desktop-first" note in each page doc). Drawer = same 230px
  width, `transform: translateX(-100%)` when closed, opened by a round-3
  `StorefrontHeader`-style 56px top bar with a 44×44 menu button
  (`aria-expanded`, `aria-controls`).
- `.ops-content` padding drops to **24px** via the `--ops-page-pad` mobile
  value; no element re-tightens it.
- Per-page mobile table→card transforms are unchanged (owned by the page
  docs); the shell only guarantees the 24px gutter on mobile.

## A11y (shell level)

- `<main class="ops-content">` is the **main landmark**; the sidebar is
  `<aside>` with `aria-label="Ops navigation"`.
- Every nav item ≥ 44px tall (round-3 `touch-min`) — already true in round 3
  (`.onav` `min-height:44px`).
- Focus ring on nav items: 2px `atomicTangerine-500`, `outline-offset:2px`
  (round-3 §7.1); on the dark sidebar the ring is visible against
  `blueSlate-900` (ring 3.33:1 vs the darker item bg — verified against the
  800 active state).
- Keyboard: full nav is tab-reachable before content (DOM order: sidebar
  first); skip link is **not** required (the nav is short), but if added,
  it targets `.ops-content`.
- Reduced motion: the drawer's translate is disabled (instant show/hide)
  under `prefers-reduced-motion`.

## BREAKPOINTS (shell)

| Range | Sidebar | Content padding (gutter) |
|---|---|---|
| ≥1024px | 230px fixed, in-flow | 32px |
| 768–1023px | 230px fixed, in-flow | 32px (24px if the team wants tablet tight — **TBD-light**, v1 keeps 32) |
| <768px | off-canvas drawer (closed by default) | 24px |

## QA / acceptance check (for the render pass)

After the frontend-coder applies the shell, re-render one panel page and
verify:
1. The measured gap between the sidebar's right edge and the first content
   column's left edge is **32px at 1280/1312px desktop** and **24px at
   390px** — not 0. (This is the pass/fail line for this round.)
2. The gap holds **after a Tailwind preflight / global reset is present**
   (i.e. the `.ops-content` class padding still wins).
3. Sidebar width reads 230px (token), not `auto`/shrunk.
4. No horizontal scroll at 1312px or 390px on the shell.
5. Sidebar visuals (round-3: `blueSlate-900`, active bar, nbadges) are
   unchanged — this spec is spacing-only.

## WHAT CHANGED vs Round 3 (the diff)

| Element | Round 3 | v4 |
|---|---|---|
| Sidebar→content gap | 0px (global `*{padding:0}` reset zeroed inherited root padding) | 32px desktop / 24px mobile, on `.ops-content` as `--ops-page-pad` |
| Sidebar width | hardcoded 230px in CSS | `--ops-sidebar-w` token (230px), applied via the token |
| Gutter source | inherited root/body padding (reset-vulnerable) | explicit class padding on `.ops-content` (reset-proof, specificity 0,1,0) |
| Shell height | `min-height:736px` (mockup render box) | `100dvh` (real app viewport) |
| Mobile sidebar | (in-flow, degraded) | off-canvas drawer + 56px top bar |

Nothing else in the sidebar's visuals, the RBAC gating, or the per-page
table layouts is changed by this document.
