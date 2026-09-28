# Sunset Electronics — frontend

The web app of this project: a Vite + React SPA with a mock data layer that
stands in for the future Express + SQLite backend. The full design specs live
in `docs/` (one folder per page); phased build status is in
`docs/IMPLEMENTATION.md` (storefront, cart/checkout, ops console, review
panel + the mobile buyer pass are done — P7 polish remains).

## Stack (pinned — see docs/ARCHITECTURE.md §1)

- Plain JavaScript (no TypeScript anywhere)
- React 19 (function components + hooks) + React Router 7 (SPA, not Next)
- Tailwind CSS v3 (theme extension = the token system; `src/styles/tokens.css`
  = CSS var layer + @layer components)
- React Icons (Feather/line glyphs)
- Dev-only: Vite 8 toolchain + oxlint (single-dep linter) + postcss
  (Tailwind v3 build chain). autoprefixer is NOT wired in.

## Quick start

```
cd frontend
npm install
npm run dev        # dev server (Vite, default port 5173)
npm run lint       # oxlint over src/
npm run build      # production build (dist/)
npm run preview    # serve the production build locally
node src/data/smoke.test.js   # mock-data contract: 36 assertions
```

Mock login (password `sunset123` for all of them): `buyer_102@mock.local`
(buyer), `marta@mock.local` (staff), `rina@mock.local` (manager),
`ria@mock.local` (admin). Guests can browse; cart/checkout/orders need a
buyer session. First-visit sessions come pre-seeded with a demo cart
(P-231 + P-198, Rp 1.670.000).

## Data layer

`src/data/` is the mock API (one `.js` per section: `seed/*`, `api/*`,
`mockApi.js` facade, `store.js`, `persistence.js`): 26 Promise-returning
functions that mirror the future Express routes, over seeded data
(48 products, 6 categories, 128 reviews, 128 users, stock audit rows).
The 5 mutable slices persist to a versioned `localStorage` key (survive
reload, `resetData()` to re-seed); the cart keeps session semantics
(`sessionStorage`). `smoke.test.js` asserts the mockup-locked numbers
(counts, averages, credential edge cases) so seed edits can't drift them.

## Code organization (enforced conventions)

- One export per `.jsx` file (single-export components); multi-export is
  reserved for cohesive module files (`guards.jsx`, `OpsPages.jsx`,
  context files, `utils/utils.js`).
- Page-specific components in `components/<page>/` subfolders; general-use
  components at the `components/` root.
- Helper/utility functions in `utils/utils.js`; custom hooks one-per-file in
  `hooks/`.
- JSDoc on every export (JSDoc types only, no TS syntax); single-line
  `//` comments only on genuinely complex syntax; no phase/round markers.

## Token discipline

Components reference **token keys** (`bg-atomicTangerine-600`, `font-h1`),
never raw hex. The only permitted non-scale value is `#FFFFFF` (30%
surface). 60:30:10: warm ground `tuscanSun-50` on the page wrapper, white
content surfaces, accent ~10%.
Conformance gate: `_mockup-build/verify_framework.sh` (docs).
