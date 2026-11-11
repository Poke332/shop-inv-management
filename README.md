# Sunset Electronics — shop-inventory management

Full-stack shop-inventory system for the "Sunset" electronics store: a REST API, a web storefront, and a mobile storefront, built as the final project for the Web & Mobile Application Development course. Three apps in one repo:

- **[backend/](backend/)** — Express 5 API on PostgreSQL (Supabase), with Supabase Storage for product images and an AI chat endpoint.
- **[frontend/](frontend/)** — React 19 + Vite 8 web storefront and operations workspace.
- **[mobile-app/](mobile-app/)** — Expo (SDK 58) / React Native 0.88 mobile storefront.

[CHATBOT.md](CHATBOT.md) documents the chatbot's architecture (a tool-calling agent that queries the live database).

## Prerequisites

- **Node.js 22.12+** — Vite 8 requires `^20.19.0 || >=22.12.0`, and the backend's `npm start` script uses `--env-file-if-exists` (Node ≥ 22.9).
- **A Supabase project** — a Postgres connection string (`DATABASE_URL`), the project URL (`SUPABASE_URL`), and a service-role key (`SUPABASE_SERVICE_ROLE_KEY`).

## Setup

1. **Backend** (`cd backend`): run `npm install`, then copy `.env.example` to `.env` (gitignored) and fill in:
   - `DATABASE_URL` — Supabase's direct connection (`postgres://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`) or the pooler host (`...pooler.supabase.com:6543`); the driver runs with prepared statements disabled, so the transaction-mode pooler works. The server refuses to boot without it.
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — used by the product-image pipeline (and by the seed, which uploads images). Service-role only: it grants admin access to the project and must stay server-side.
   - `JWT_SECRET` — the example ships a 41-char dev-only placeholder; rotate it anywhere that is not your own machine.

   Every backend script loads `.env` via `node --env-file`.

2. **Seed demo data** (`cd backend`): `npm run seed` loads the demo catalog, users and orders and uploads the seeded product images to the storage bucket. It is idempotent — deterministic object paths, upserted — so re-running is safe. `npm run seed:refresh` truncates the seeded data tables and re-seeds from scratch (the schema is untouched).

3. **Web frontend** (`cd frontend`): `npm install`. The API base URL defaults to `http://localhost:3000/api`; if the API listens elsewhere, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL`.

4. **Mobile** (`cd mobile-app`): `npm install`. `EXPO_PUBLIC_API_URL` defaults to `http://localhost:3000/api` and is inlined at build time; copy `.env.example` to `.env` and adjust if needed.

## Run it

**Backend** — `cd backend && npm run dev` (watch mode). Listens on `PORT`, default 3000: `http://localhost:3000/api`.

**Web frontend** — `cd frontend && npm run dev -- --port 5174`. Port 5174 matches the API's default CORS origin (`FRONTEND_ORIGIN=http://localhost:5174`); use a different port and set `FRONTEND_ORIGIN` in `backend/.env` to match.

**Mobile** — `cd mobile-app && npx expo start`, then open the app in Expo Go (scan the QR code). Testing from a real phone or tablet on your local network? `localhost` only resolves on the machine running the API, so point `EXPO_PUBLIC_API_URL` at that machine's LAN IP instead, e.g. `http://192.168.1.42:3000/api` (device and API must share the network).

## Auth and roles

- `POST /api/auth/register` creates a buyer account (201); `POST /api/auth/login` returns a 1-hour JWT plus a server-side session row; `GET /api/auth/me` and `POST /api/auth/logout` complete the flow (logout revokes the session).
- Roles: `buyer` (default), `staff`, `manager`, `admin`. The catalog (products, categories, public reviews) is open to guests. `/api/orders` requires a buyer session; `/api/ops` requires staff/manager/admin, with manager-only and admin-only sub-routes.
- Demo accounts (seeded by `npm run seed`; every one uses the password `sunset123`):

  | email | role |
  |---|---|
  | `buyer_102@mock.local` | buyer |
  | `marta@mock.local` | staff |
  | `rina@mock.local` | manager |
  | `ria@mock.local` | admin |

  `dan@mock.local` is seeded **disabled** (login → 403 "Account not available") as an edge case; the login page's demo-account shortcuts cover all of these.

## API surface

Base path `/api` on the backend port:

| endpoint | access |
|---|---|
| `GET /health` | public |
| `GET /categories` | public |
| `GET /products` (`?category=&brand=&query=&priceMin=&priceMax=&sort=featured\|price-asc\|price-desc\|catalog`) | public |
| `GET /products/:id` · `GET /products/:id/reviews` (public reviews only) | public |
| `POST /chat` (rate-limited, see below) | public; a valid token only tailors the app-help answers |
| `POST /auth/register` · `POST /auth/login` | public |
| `GET /auth/me` · `POST /auth/logout` | any role |
| `GET /orders/mine` · `POST /orders` (checkout, 201) · `POST /orders/:id/reviews` | buyer |
| `GET /ops/orders` · `PATCH /ops/orders/:id/status` · `GET /ops/stock` | staff+ |
| `PATCH /ops/stock/:id` · `POST /ops/products` (201) · `PATCH /ops/products/:id` · `GET /ops/products/:id/reviews` · `PATCH /ops/reviews/:id/hidden` · `PATCH /ops/reviews/:id/comment` | manager+ |
| `GET /ops/users` · `PATCH /ops/users/:username/role` · `PATCH /ops/users/:username/active` | admin |

`/uploads` additionally serves legacy uploaded images statically.

## AI chatbot (`POST /api/chat`)

Guests can chat; the catalog answers are public. The LLM backend is chosen entirely by environment variables (read per request, so config changes apply without restart — the rate limiter caps how often that matters):

| variable | value |
|---|---|
| `CHAT_PROVIDER` | `openai` (default — the main provider: any OpenAI-compatible `/chat/completions` host (OpenAI, OpenRouter, self-hosted vLLM/Ollama…). OpenRouter is reached through it by setting `OPENAI_BASE_URL=https://openrouter.ai/api/v1` with your OpenRouter key as `OPENAI_API_KEY`), or `anthropic` (optional, extra support — requires an explicit `CHAT_PROVIDER=anthropic`). Any other value is unrecognized and answers 503 `CHAT_UNAVAILABLE`. Note: before this change an unset `CHAT_PROVIDER` answered with Anthropic; deployments that relied on that must now either set `CHAT_PROVIDER=anthropic` explicitly or provide `OPENAI_API_KEY`. |
| `ANTHROPIC_API_KEY` | Anthropic key (`ANTHROPIC_BASE_URL` optional). Default model: `claude-haiku-5-5`. |
| `OPENAI_API_KEY` | OpenAI-compatible key. Required, together with `OPENAI_BASE_URL` (e.g. `https://api.openai.com/v1` — set it in the deployment env, e.g. Render), for the openai provider. Default model: `gpt-4o-mini`. |
| `CHAT_MODEL` | optional override to any model that supports tool calling. |
| `CHAT_RATE_LIMIT_PER_MIN` | per-IP limit, default 20; over → 429 `RATE_LIMITED` (with `Retry-After`). |

There is no fallback between providers: with no usable key for the chosen provider the endpoint answers **503 `CHAT_UNAVAILABLE`** (upstream 429/529 map to a "busy" variant of the same 503). Keys stay server-side only — never in the frontend or mobile env files. Architecture and file map: [CHATBOT.md](CHATBOT.md).

## Product image storage

`POST`/`PATCH /api/ops/products` accepts an inline `data:image/{png,jpeg,webp};base64` payload (≤ 1.5 MB): the bytes are converted to WebP (quality 80, via `sharp`) and stored in the public Supabase Storage bucket `product-images` under `products/<productId>/<uuid>.webp`; the returned public URL is what gets stored in `products.image`. The bucket is provisioned by the backend itself on first use (`createBucket` with the service-role key, "already exists" tolerated) — only if your project blocks bucket creation from the API do you create it manually (Storage → New bucket, public, read-only for anon). Existing plain paths (`/products`, `/img`, `/uploads`) and public Supabase object URLs pass through unchanged; files already in `backend/data/uploads` stay served at `/uploads` for back-compat. Seeded products upload their source images (`frontend/public/products/*.png`) as `products/<id>/<name>.webp` with deterministic, upserted object paths, so the database always points at bucket images.

## Tests

`cd backend && npm test` (`node --test test/*.test.js`). The suite needs a `DATABASE_URL` pointing at a Postgres where the app user can create databases — four of the suites drop and create a disposable database per run. The chat and storage suites run against fake LLM / storage servers, so no API key or Supabase account is needed for them.
