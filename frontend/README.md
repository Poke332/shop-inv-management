# Sunset Electronics — frontend (Vite + React + React Router + Tailwind CSS + React Icons)

Scaffold phase: P0 of `docs/IMPLEMENTATION.md`. The token system is transcribed verbatim
from `docs/color-tokens.md` (7 families x 11 steps, 50-950) + `docs/design-tokens-round3.md`
(typography, spacing, component layer) + `docs/control-panel/design.md` (ops-shell gutter v4).

## Stack (pinned — see docs/ARCHITECTURE.md §1)

- Plain JavaScript (no TypeScript anywhere)
- React (function components + hooks) + React Router (SPA, not Next)
- Tailwind CSS v3 (theme extension = the token system; `src/styles/tokens.css` = CSS var layer + @layer components)
- React Icons (Feather/line glyphs)
- Dev-only: Vite toolchain + oxlint (single-dep linter) + postcss (Tailwind v3 build chain). autoprefixer is NOT wired in and is parked on the off-stack sign-off card t_7480ddbe (not required for this build).

## Quick start

```
cd frontend
npm install
npm run dev        # dev server (Vite)
npm run lint       # ESLint over src/
npm run build      # production build (dist/)
```

## Token discipline

Components reference **token keys** (`bg-atomicTangerine-600`, `font-h1`), never raw hex.
The only permitted non-scale value is `#FFFFFF` (30% surface). 60:30:10: warm ground
`tuscanSun-50` on the page wrapper, white content surfaces, accent ~10%.
Conformance gate: `_mockup-build/verify_framework.sh` (docs).
