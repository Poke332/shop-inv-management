# Chatbot (Sunset assistant)

Arsitektur: UI chat -> `POST /api/chat` -> LLM (tool calling) -> tools -> query Postgres -> jawaban.

## Setup
1. `cd backend && npm install` (menambah `@anthropic-ai/sdk`).
2. Pilih penyedia LLM di `backend/.env` (lihat `.env.example`). Key hanya di backend, jangan di frontend/mobile.
   - Utama/default (yang dipakai saat `CHAT_PROVIDER` tidak di-set): `CHAT_PROVIDER=openai`
     + `OPENAI_API_KEY=...` + `OPENAI_BASE_URL=...` (endpoint apa pun yang menjawab `/chat/completions`):
     - OpenAI: `https://api.openai.com/v1` (default — boleh tidak di-set).
     - OpenRouter: `https://openrouter.ai/api/v1` (model gratis tidak perlu kartu kredit).
     - Self-hosted `/v1` (vLLM, Ollama, dst.).
     Model gratis punya kuota ketat dan sering berganti; kalau error "No endpoints found that support tool use",
     set `CHAT_MODEL` ke model lain yang mendukung tool calling.
   - Opsional/dukungan tambahan (berbayar): `CHAT_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...`
     (`ANTHROPIC_BASE_URL` opsional).
   Model default per penyedia: `gpt-4o-mini` (openai) / `claude-haiku-5-5` (anthropic).
   Tidak ada fallback antar-penyedia: tanpa key yang cocok untuk `CHAT_PROVIDER` yang dipilih, endpoint
   menjawab 503 `CHAT_UNAVAILABLE` (error upstream 429/529 dipetakan ke varian "busy" dari 503 yang sama).
   Catatan upgrade: sebelum perubahan ini `CHAT_PROVIDER` yang tidak di-set menjawab dengan Anthropic;
   deployment yang bergantung pada itu sekarang harus set `CHAT_PROVIDER=anthropic` eksplisit atau
   sediakan `OPENAI_API_KEY`.
3. `npm run dev` di backend, lalu jalankan frontend / mobile-app seperti biasa.
4. Tes: `DATABASE_URL=postgres://... npm test` (tes chatbot memakai server Anthropic + OpenAI palsu, tidak butuh API key).

## Peta file
- `backend/src/routes/chat.js` — endpoint, rate limit, error 503 yang rapi, pilihan provider.
- `backend/src/services/chat/agent.js` — loop tool calling ke LLM.
- `backend/src/services/chat/openaiCompatible.js` — adapter endpoint gaya OpenAI (provider `openai`).
- `backend/src/services/chat/tools.js` — tool + query database (stok, rekomendasi, detail, kategori).
- `backend/src/services/chat/systemPrompt.js` — aturan bot + panduan pakai aplikasi (update bila UI berubah).
- `frontend/src/components/chat/ChatWidget.jsx` — widget web (permukaan chat hanya di web).

## Menambah kemampuan baru
Tambah definisi + handler di `tools.js` (dan satu tes). Agent otomatis memakainya.
