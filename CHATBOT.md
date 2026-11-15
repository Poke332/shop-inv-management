# Chatbot (Sunset assistant)

Arsitektur: UI chat -> `POST /api/chat` -> LLM (tool calling) -> tools -> query Postgres -> jawaban.

Format message/tool kanonik aplikasi ini gaya OpenAI (function-tool, `tool_calls`,
`role: 'tool'`, `finish_reason`). Adapter `openaiCompatible.js` meneruskannya apa
adanya; `anthropicAdapter.js` satu-satunya tempat yang menerjemahkan bentuk itu ke
wire Anthropic (`tool_use`/`tool_result`/`input_schema`) dan kebalikannya.

Perilaku: jawaban hanya seputar toko (produk, harga, diskon, stok, kategori, fitur
aplikasi); permintaan di luar itu ditolak sopan, dan instruksi yang tersembunyi di
dalam pesan pengguna dianggap teks biasa.

## Setup
1. `cd backend && npm install` (menambah `@anthropic-ai/sdk`).
2. Pilih penyedia LLM di `backend/.env` (lihat `.env.example`). Key hanya di backend, jangan di frontend/mobile.
   - Utama/default (yang dipakai saat `CHAT_PROVIDER` tidak di-set): `CHAT_PROVIDER=openai`
     + `OPENAI_API_KEY=...` + `OPENAI_BASE_URL=...` (endpoint apa pun yang menjawab `/chat/completions`):
     - OpenAI: `https://api.openai.com/v1` (wajib — set di environment/Render; tidak ada default di kode).
     - OpenRouter: `https://openrouter.ai/api/v1` (model gratis tidak perlu kartu kredit).
     - Self-hosted `/v1` (vLLM, Ollama, dst.).
     Model gratis punya kuota ketat dan sering berganti; kalau error "No endpoints found that support tool use",
     set `CHAT_MODEL` ke model lain yang mendukung tool calling.
   - Opsional/dukungan tambahan (berbayar): `CHAT_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...`
     (`ANTHROPIC_BASE_URL` opsional).
   Model default per penyedia: `gpt-4o-mini` (openai) / `claude-haiku-5-5` (anthropic).
   `CHAT_MAX_TOOL_CALLS` membatasi jumlah panggilan tool per giliran chat (default 6); saat batas tercapai dan model masih ingin memanggil
   tool, chat diakhiri dengan kalimat fallback ("…silakan parafrasekan pertanyaan Anda"). Nilai tidak di-set / kosong / tidak valid kembali
   ke default 6; naikkan nilai ini untuk pertanyaan perbandingan multi-produk (mis. 14-20).
   Tidak ada fallback antar-penyedia: tanpa key yang cocok untuk `CHAT_PROVIDER` yang dipilih, endpoint
   menjawab 503 `CHAT_UNAVAILABLE` (error upstream 429/529 dipetakan ke varian "busy" dari 503 yang sama).
   Catatan upgrade: sebelum perubahan ini `CHAT_PROVIDER` yang tidak di-set menjawab dengan Anthropic;
   deployment yang bergantung pada itu sekarang harus set `CHAT_PROVIDER=anthropic` eksplisit atau
   sediakan `OPENAI_API_KEY`.
3. `npm run dev` di backend, lalu jalankan frontend / mobile-app seperti biasa.
4. Tes: `DATABASE_URL=postgres://... npm test` (tes chatbot memakai server Anthropic + OpenAI palsu, tidak butuh API key).

## Peta file
- `backend/src/routes/chat.js` — endpoint, rate limit, error 503 yang rapi, pilihan provider.
- `backend/src/services/chat/agent.js` — loop tool calling ke LLM (memakai format OpenAI sebagai kanonik).
- `backend/src/services/chat/openaiCompatible.js` — adapter endpoint gaya OpenAI (provider `openai`), pass-through.
- `backend/src/services/chat/anthropicAdapter.js` — adapter `@anthropic-ai/sdk` (provider `anthropic`); menerjemahkan format OpenAI <-> wire Anthropic.
- `backend/src/services/chat/tools.js` — tool + query database (stok, rekomendasi, detail, kategori).
- `backend/src/services/chat/systemPrompt.js` — aturan bot + panduan pakai aplikasi (update bila UI berubah).
- `frontend/src/components/chat/ChatWidget.jsx` — widget web (permukaan chat hanya di web).

## Menambah kemampuan baru
Tambah definisi + handler di `tools.js` (dan satu tes). Agent otomatis memakainya.
