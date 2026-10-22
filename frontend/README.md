# Sunset Electronics — Frontend

React berada di folder ini. Backend berada di `../backend/`.

```powershell
npm run dev -- --port 5174 --strictPort
npm run lint
npm run build
```

Jika dependensi belum tersedia, jalankan `npm ci` terlebih dahulu. Konfigurasi lokal frontend berada di `.env.local`; mode data ditentukan oleh `VITE_DATA_SOURCE` (`mock` atau `http`).

Lihat [README proyek](../README.md), [panduan fullstack](../backend-guide/README.md), [laporan pengujian](../pengujian.md), dan [desain](DESIGN.md).