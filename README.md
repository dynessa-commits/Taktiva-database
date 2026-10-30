# Taktiva (versi cloud: login & data tersinkron antar perangkat)

Isi proyek:
- public/index.html            : aplikasi Taktiva
- public/icons/, manifest.webmanifest : ikon maskot Taktiva (favicon, ikon iOS/Android, install sebagai aplikasi)
- netlify/functions/api.mjs    : server (daftar, masuk, simpan & sinkron data)
- netlify.toml, package.json   : konfigurasi Netlify

Data pengguna disimpan di Netlify Blobs (bawaan Netlify, tanpa database tambahan).
Kata sandi di-hash dengan scrypt, sesi memakai token bertanda tangan (berlaku 30 hari).

## Cara deploy (pilih salah satu)

### A. Lewat GitHub (disarankan, situs baru)
1. Buat repository GitHub, unggah SEMUA isi folder ini (bukan hanya index.html).
2. Di app.netlify.com: Add new site > Import an existing project > pilih repository tadi.
   Pengaturan build biarkan sesuai netlify.toml, lalu Deploy.
3. Site configuration > Environment variables > tambah:
     JWT_SECRET = teks acak panjang (min. 32 karakter)
   Contoh membuatnya di terminal:  openssl rand -base64 32
4. Deploys > Trigger deploy > Deploy site (agar variabel terbaca).

### B. Lewat Netlify CLI (bisa untuk situs yang sudah ada)
  npm i -g netlify-cli
  netlify login
  netlify link                      # pilih situs, mis. taskmate-26
  netlify env:set JWT_SECRET "isi-teks-acak-panjang-minimal-32-karakter"
  netlify deploy --prod

## Cek berhasil
Buka https://NAMA-SITUS.netlify.app/api/ping  -> harus tampil {"ok":true}
Lalu daftar akun di satu perangkat, masuk di perangkat lain: tugasmu sama.

## Catatan
- Jika /api/ping gagal, aplikasi otomatis jalan dalam "Mode lokal" (data hanya di perangkat itu).
- Akun lama (mode lokal) tidak otomatis ada di server. Daftar ulang dengan email yang sama
  di browser yang sama agar tugas lama ikut terunggah.
- Belum ada fitur lupa kata sandi (butuh layanan email).

- Aplikasi ini sebelumnya bernama TaskMate. Nama di layar sudah diganti menjadi Taktiva, tetapi kunci
  penyimpanan internal (taskmate.*) sengaja dipertahankan agar data dan sesi pengguna lama tidak hilang.
- Level kepentingan tugas (Rendah/Sedang/Tinggi) memakai warna yang sama dengan level risiko
  (hijau/kuning/oranye); merah hanya dipakai untuk risiko Kritis.


## Perbaikan isolasi data akun (2026-10)
- Data cloud dipisahkan berdasarkan email akun yang tercantum pada token sesi.
- Akun cloud baru tanpa data tersimpan kini mulai dengan daftar tugas kosong, bukan enam tugas contoh.
- Data lokal lama untuk email yang sama tetap bisa dibaca untuk mendukung migrasi dari mode lokal.
- Akun yang sebelumnya sudah menyimpan tugas contoh di cloud tidak dihapus otomatis; periksa data tersebut sebelum menghapusnya.


## Profil dan avatar
- Kartu profil di sidebar menjadi satu-satunya ringkasan profil dan dapat diklik untuk membuka halaman Profil.
- Halaman Profil menyediakan pilihan 32 avatar emoji imut, opsi kembali ke inisial, dan unggah foto JPG/PNG/WebP.
- Foto di-crop persegi dan diperkecil ke 256x256 JPEG agar lebih ringan untuk penyimpanan dan sinkronisasi cloud.
- Avatar disimpan di `prefs.avatar`, sehingga mengikuti data akun dan sinkronisasi antarperangkat.


## UI refresh: sidebar and Taktiva mascot avatars
- The sidebar uses a softer light theme with a compact profile card at the top.
- The bottom Profile navigation item is removed; clicking the profile card opens Profile.
- On mobile, a profile shortcut appears in the top toolbar so Profile remains accessible.
- Profile page uses a two-column layout: profile/mascot picker on the left, study rhythm and appearance/language on the right, with backup controls below.
- Added 15 original SVG mascot pose variants under `public/mascots/`. The selected mascot or uploaded photo is stored in the existing account preferences.
- Theme choices now include Auto, Light, and Dark.


## UI refinement (2026-10-30)
- Sidebar width reduced and visual treatment simplified: quiet near-white surface, restrained lavender active state, lighter icons, and less decorative shadow/gradient.
- Profile remains accessible from the identity card directly below the Taktiva brand; there is no duplicate Profile navigation item.
- The 15 mascot choices now use distinct study-friendly poses and props (waving, reading, writing, running, celebrating, caring for a plant, etc.) while preserving the same Taktiva cat identity.
- Mascot picker includes short pose labels and accessible descriptions.

## Dashboard refresh (2026-10-30)
- Dashboard now includes a seven-day workload estimate based on the daily study capacity configured in the profile.
- The forecast highlights capacity pressure before near-term deadlines; it is an estimate, not a fixed calendar booking.
- Added a daily focus list, upcoming deadline shortlist, task-completion overview, and quick links to Planner, Calendar, and Rescue.
- The dashboard mascot pose changes with the overall task state while the user's selected profile avatar remains unchanged.
- Existing task records, profile preferences, authentication, and cloud synchronization formats are unchanged.

## Rescue Mode v3 (2026-10-30)
- Rebuilt Rescue as a capacity-aware seven-day recovery simulation.
- Prioritizes tasks by safety-buffer deadline and importance, and displays scheduled vs. unscheduled remaining work.
- Adds a daily recovery view, overdue indicators, deadline-collision summary, flexible low-priority tasks, and prepared extension-message drafts.
- The recovery view is a simulation: it does not silently change task deadlines, progress, or task estimates.
- Responsive layout for desktop, tablet, and mobile.
