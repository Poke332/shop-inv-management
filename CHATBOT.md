# Chatbot (Sunset assistant)

Arsitektur: UI chat -> `POST /api/chat` -> Claude (tool calling) -> tools -> query Postgres -> jawaban.

## Setup
1. `cd backend && npm install` (menambah `@anthropic-ai/sdk`).
2. Salin `ANTHROPIC_API_KEY` ke `backend/.env` (lihat `.env.example`). Key hanya di backend, jangan di frontend/mobile.
3. `npm run dev` di backend, lalu jalankan frontend / mobile-app seperti biasa.
4. Tes: `DATABASE_URL=postgres://... npm test` (tes chatbot memakai server Anthropic palsu, tidak butuh API key).

## Peta file
- `backend/src/routes/chat.js` — endpoint, rate limit, error 503 yang rapi.
- `backend/src/services/chat/agent.js` — loop tool calling ke LLM.
- `backend/src/services/chat/tools.js` — tool + query database (stok, rekomendasi, detail, kategori).
- `backend/src/services/chat/systemPrompt.js` — aturan bot + panduan pakai aplikasi (update bila UI berubah).
- `frontend/src/components/chat/ChatWidget.jsx` — widget web. `mobile-app/app/chat.js` — layar mobile.

## Menambah kemampuan baru
Tambah definisi + handler di `tools.js` (dan satu tes). Agent otomatis memakainya.
