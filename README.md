# Sunset Electronics — Final Project Frontend

React storefront and operations workspace for the Web & Mobile Application Development project. This branch contains the updated UI and its current mockups, based on the existing mock data flows.

## Preview

![Sunset storefront](docs/main-store/mockup.jpg)

## Run locally

Use Node.js 22.12+ compatible with Vite 8 and the installed dependencies.

```powershell
cd frontend
npm ci
npm run dev -- --port 5174
```

Open the local URL printed by Vite. Build with `npm run build` from frontend. Demo account shortcuts on sign-in cover buyer, staff, manager and admin; these are fictional browser mock accounts.

## Product image storage

New product images are uploaded to a public Supabase Storage bucket and the
returned public URL is stored in `products.image`.

Setup, per Supabase project:

- The `product-images` bucket (public, read access for anon) is created by
  the backend itself on the first image upload — the storage client's
  `createBucket` call runs with the service-role key and treats "bucket
  already exists" as success. No manual dashboard step is required; only
  if your project blocks bucket creation from the API do you create it
  yourself (Storage → New bucket, public, read-only for anon).
- Put `SUPABASE_URL` (project URL, Settings → API) and
  `SUPABASE_SERVICE_ROLE_KEY` (service-role key — an anon key cannot create
  buckets) in `backend/.env`. The service-role key grants admin access to
  the project and must stay server-side only — never load it into the
  browser.

Behavior:

- `POST`/`PATCH /api/ops/products` accepts an inline
  `data:image/{png,jpeg,webp};base64` payload (≤ 1.5 MB) and stores it in
  the bucket under `products/<productId>/`; the public URL is what the API
  returns and what `products.image` holds.
- Existing values keep working: local `/products`, `/img` and `/uploads`
  paths, and public Supabase object URLs, pass through unchanged.
- Files already uploaded to `backend/data/uploads` stay served at `/uploads`
  for back-compat; they are legacy data, not a migration target.

## Current contents

- [frontend/](frontend/README.md): current React application, assets and UI styles.
- [Mockup gallery and page specifications](docs/README.md): current desktop/mobile captures.
- [Figma editable design](https://www.figma.com/design/B6wD9LAN70E4nrLjoJQPsQ).
- [UI system](docs/UI-SYSTEM.md) and [capture workflow](docs/RENDER.md).
- [Implementation status](docs/IMPLEMENTATION.md): current scope and verification limits.
- [Architecture](docs/ARCHITECTURE.md) and [requirements](docs/PRD.md): functional reference.
- [Historical midterm documentation](docs/legacy-midterm/README.md); its original renderer is identified in [_mockup-build](_mockup-build/README.md).

## Current behavior

Home, Shop now, Categories and My orders navigation; six category filters; numbered three-step checkout; role-filtered operations navigation with disabled staff storefront link. Existing auth redirects, purchasing, order status, reviews, stock and user-management flows remain in the frontend mock.

This frontend checkpoint excludes backend code, environment secrets, SQLite databases, dependencies and generated build output. Local backend learning work remains separate. No merge to main is performed by this update.

## Verification

Frontend source build passed and the existing mock API smoke suite reports 32 passed, 0 failed. Updated screenshots were taken on 22 October 2026 from the same UI source. Screenshots are visual evidence and do not establish a complete regression or accessibility audit.
