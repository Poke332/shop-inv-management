# Progress — Pull Requests Merged into main

Last updated: 2026-11-10 · generated from `origin/main` @ `50064f2` (50064f25c366d10178dd8215941bd32a88280494)

All 27 merged pull requests, in merge order (oldest first). Verified two ways:
`git log origin/main --merges` (27 merge commits) cross-checked 1:1 against
`gh pr list --state merged` by merge-commit SHA. PR numbers #17, #20, #24–#26, #29
are closed without merging (verified via `gh pr view`) — they are not listed.
No merges landed without a PR.

| # | PR title | Merged (date) | Merge commit | Head ref | One-line summary |
|---|----------|---------------|--------------|----------|------------------|
| 1 | docs: tailor design to electronics/gadgets shop, align login/register, regenerate mockups | 2026-09-21 | 4d6f0b5 | docs/electronics-tailoring-rev2 | Redesigned the shop as an electronics/gadgets store; aligned login/register and regenerated mockups |
| 2 | Round 4: main-store v4 (hero banner + category browsing) + control-panel app-shell gutter fix + design.md autosync | 2026-09-22 | 372f899 | docs/round4-mainstore-v4-panel-gap | Main-store v4 with hero banner + category browsing; control-panel gutter fix; design.md autosync |
| 3 | Round 5: v3 framework + v4 features integration (framework-locked, conformance-gate clean) | 2026-09-22 | db5c54a | docs/round3v4-integration | Integrated v3 framework + v4 features; conformance gate clean |
| 4 | Round 6: review moderation - auto-approve, panel view-all + seller-comment + hide-only | 2026-09-22 | a3b3f1e | docs/round3v4-integration | Review moderation: auto-approve, view-all panel, seller comments, hide-only flow |
| 5 | Housekeeping: add project source docs (AGENTS/palette/sheets-report) + gitignore probe scratch | 2026-09-22 | d35aaaa | docs/commit-source-docs | Added source docs (AGENTS, palette, sheets report); ignored probe scratch files |
| 6 | Round 7: storefront 60:30:10 color ratio (tuscanSun-50 warm ground) + gate re-baseline | 2026-09-23 | 5b63e57 | feat/storefront-603010 | Rebalanced storefront to a 60:30:10 color ratio on a warm ground; re-baselined the gate |
| 7 | Docs/readme | 2026-09-24 | 719034d | docs/readme | Expanded README (course context, page/role map, data model, roadmap) and trimmed it on user revision |
| 8 | [Planning] Website implementation plan docs (React + React Router + Tailwind + React Icons) | 2026-09-24 | 02722f2 | docs/implementation-plan | Documented the website implementation plan and stack |
| 9 | [P1] Router tree + shared layouts + RBAC guards (frontend foundation) | 2026-09-25 | 8897472 | feat/frontend-p1 | Frontend foundation: router tree, shared layouts, RBAC guards |
| 10 | [P3] Storefront pages: main-store, search-browse, product-details, login, register | 2026-09-26 | beabb86 | feat/frontend-p3 | Buyer-facing storefront pages: main-store, search/browse, product details, auth pages |
| 11 | [P4] Cart + checkout wizard + CartStore | 2026-09-26 | eb08119 | feat/frontend-p4 | Cart, multi-step checkout wizard, and CartStore state |
| 12 | [P5] Ops console: ongoing-orders, inventory, per-product, user dashboards | 2026-09-26 | e12d02b | feat/frontend-p5 | Ops console dashboards: ongoing orders, inventory, per-product, users |
| 13 | [P6] Per-product review panel (moderation console) | 2026-09-26 | 0b20a1e | feat/frontend-p6 | Per-product review panel with moderation console |
| 14 | [Mobile] Buyer-facing mobile pass: main-store, browse, detail, cart, orders, checkout | 2026-09-27 | 29692f1 | feat/frontend-p6-mobile | Mobile pass over buyer pages: store, browse, detail, cart, orders, checkout |
| 15 | fix(checkout): align the checkout progress bar (empty status circles + 1-line desktop / 2-line mobile labels) | 2026-09-28 | c24362a | fix/checkout-progress-align | Aligned the checkout progress bar; responsive 1/2-line labels |
| 16 | refactor: split pages/OpsPages.jsx into 7 single-export page files | 2026-09-28 | ca6d89c | refactor/ops-pages-split | Split the OpsPages.jsx monolith into 7 single-export page files |
| 18 | fix(inventory): per-product threshold in attention filter + stepper saves on +/- tap | 2026-09-29 | e201f72 | fix/inventory-attention-threshold | Per-product attention threshold; inventory stepper saves on +/- tap |
| 19 | Final project frontendupdate | 2026-10-22 | 5b4deb2 | final-project-frontendupdate | Final-project frontend batch: redesign checkpoint, refreshed mockups/UI specs, stale build+docs cleanup |
| 21 | backend implement | 2026-10-23 | cc20328 | backend | Backend API implementation with env templates; frontend wiring and README link cleanup |
| 22 | Sunset final project: backend hardening, HTTP data layer, session-state guards, mock-layer removal | 2026-11-02 | 49c8126 | chore/frontend-hygiene | Sunset pass: backend hardening, HTTP data layer, session-state guards, mock layer removed |
| 23 | Supabase rework: Postgres data layer + Storage buckets for product images | 2026-11-03 | 5e37e87 | feat/supabase-postgres | Rebuilt the data layer on Supabase Postgres; added Storage buckets for product images |
| 27 | Deploy readiness: Render bind 0.0.0.0 + env-safe start | 2026-11-03 | f3d55df | feat/supabase-postgres | Deploy readiness: 0.0.0.0 bind and env-safe start for Render |
| 28 | Add mobile app: product list and detail screens | 2026-11-09 | 2a1c3c8 | mobile-app-week12 | Expo mobile app: product list and detail screens |
| 30 | Feature/chatbot | 2026-11-10 | 50064f2 | feature/chatbot | AI chatbot for stock info, recommendations, and app help (POST /api/chat + provider config) |
