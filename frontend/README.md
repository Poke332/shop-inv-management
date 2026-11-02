# Sunset Electronics — Frontend

React berada di folder ini. Backend berada di `../backend/`.

```powershell
npm run dev -- --port 5174 --strictPort
npm run lint
npm run build
```

Jika dependensi belum tersedia, jalankan `npm ci` terlebih dahulu. Konfigurasi lokal frontend berada di `.env.local`; lapisan data membaca API http di `VITE_API_BASE_URL`, jadi development membutuhkan backend ter-seed (jalankan `npm run seed` di `../backend/` — tidak ada lagi fallback mock).

Lihat [README proyek](../README.md), dan [desain](DESIGN.md).
