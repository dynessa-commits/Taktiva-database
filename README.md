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
