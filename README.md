# DiTz Downloader

Website downloader media super ringan, responsif, dan siap deploy ke Vercel tanpa dependency frontend.

## Fitur

- Mode MP4 dan MP3.
- Deteksi TikTok, YouTube, Instagram, Facebook, X, SoundCloud, Pinterest, Reddit, dan Vimeo.
- URL file media publik bisa langsung diunduh.
- Integrasi opsional dengan instance Cobalt API milik sendiri.
- Pencarian musik menggunakan iTunes Search API; hasil unduhan berupa cuplikan resmi sekitar 30 detik.
- Validasi URL, perlindungan SSRF dasar, cache, dan security headers.

## Menjalankan lokal

Gunakan server statis apa pun, misalnya:

```bash
python3 -m http.server 3000
```

Untuk menguji endpoint API secara penuh, gunakan Vercel CLI atau langsung deploy ke Vercel.

## Mengaktifkan download platform sosial

Tambahkan Environment Variables di Vercel:

```env
COBALT_API_URL=https://instance-api-milik-sendiri.example.com
COBALT_API_KEY=opsional
```

API publik resmi Cobalt tidak disediakan untuk dipakai proyek pihak ketiga, jadi deployment production harus memakai instance milik sendiri atau provider yang memberi izin eksplisit.

## Catatan legal

Gunakan hanya untuk konten milik sendiri, berizin, Creative Commons, atau domain publik. Proyek tidak dibuat untuk melewati DRM, autentikasi, maupun konten privat.
