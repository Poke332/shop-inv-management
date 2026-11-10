# Chatbot (Sunset assistant)

Arsitektur: UI chat -> `POST /api/chat` -> Claude (tool calling) -> tools -> query Postgres -> jawaban.

## Setup
1. `cd backend && npm install` (menambah `@anthropic-ai/sdk`).
2. Pilih penyedia LLM di `backend/.env` (lihat `.env.example`). Key hanya di backend, jangan di frontend/mobile.
   - Berbayar: `CHAT_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...`
   - Gratis: `CHAT_PROVIDER=openrouter` + `OPENROUTER_API_KEY=...` (model default `openrouter/free`).
     Model gratis punya kuota ketat dan sering berganti; kalau error "No endpoints found that support tool use",
     set `CHAT_MODEL` ke model `:free` lain yang mendukung tool calling.
3. `npm run dev` di backend, lalu jalankan frontend / mobile-app seperti biasa.
4. Tes: `DATABASE_URL=postgres://... npm test` (tes chatbot memakai server Anthropic palsu, tidak butuh API key).

## Peta file
- `backend/src/routes/chat.js` — endpoint, rate limit, error 503 yang rapi.
- `backend/src/services/chat/agent.js` — loop tool calling ke LLM.
- `backend/src/services/chat/openaiCompatible.js` — adapter untuk OpenRouter / API gaya OpenAI.
- `backend/src/services/chat/tools.js` — tool + query database (stok, rekomendasi, detail, kategori).
- `backend/src/services/chat/systemPrompt.js` — aturan bot + panduan pakai aplikasi (update bila UI berubah).
- `frontend/src/components/chat/ChatWidget.jsx` — widget web. `mobile-app/app/chat.js` — layar mobile.

## Menambah kemampuan baru
Tambah definisi + handler di `tools.js` (dan satu tes). Agent otomatis memakainya.
