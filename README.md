# Keuangan Keluarga — PWA (tanpa build)

Paket ini adalah situs statis biasa: **HTML + JS + JSON**. Tidak ada `npm install`,
tidak ada `npm run build`. React, ikon (lucide-react), dan grafik (recharts) dimuat
langsung dari CDN saat aplikasi dibuka, dan JSX di `app.jsx` di-transpile di dalam
browser oleh Babel Standalone — jadi kamu tinggal meng-upload isi folder ini apa
adanya.

## Isi folder
- `index.html` — halaman utama (memuat React/Babel/lucide/recharts dari CDN)
- `app.jsx` — seluruh aplikasi (dashboard, transaksi, budget, tagihan, goal, laporan, dll)
- `manifest.json` — metadata PWA (nama, warna, ikon)
- `service-worker.js` — caching offline & "Add to Home Screen"
- `icons/` — ikon aplikasi

## Kenapa perlu di-hosting (bukan dibuka langsung dari file di HP)
Browser hanya mengizinkan **Service Worker** (syarat wajib PWA agar bisa
"Add to Home Screen" + offline) berjalan di alamat **https://** atau `localhost`,
bukan saat file dibuka langsung (`file://`). Jadi kamu tetap perlu meng-upload
folder ini ke suatu tempat — tapi ini murni **upload file**, bukan proses build.

## Cara tercepat: Netlify Drop (1 menit, tanpa akun wajib)
1. Buka https://app.netlify.com/drop di laptop/HP.
2. Seret (drag & drop) seluruh folder `pwa` ini ke halaman tersebut.
3. Netlify langsung memberi URL publik, misalnya `https://xxxx.netlify.app`.
4. Buka URL itu di **HP** (Chrome/Safari) → menu browser → **"Tambahkan ke Layar Utama" / "Add to Home Screen"**.
5. Ikon aplikasi akan muncul di HP dan terbuka tanpa address bar (mode standalone).

## Alternatif: GitHub Pages
1. Buat repository baru di GitHub, upload semua file dalam folder ini ke root repo.
2. Masuk ke **Settings → Pages**, pilih branch `main` dan folder `/root`.
3. GitHub memberi URL `https://namakamu.github.io/nama-repo/`.
4. Buka di HP, lalu "Add to Home Screen" seperti di atas.

## Alternatif: coba dulu di komputer sendiri (opsional, sebelum upload)
Kalau Python sudah ada di komputer (biasanya sudah, tanpa perlu install apa pun tambahan):
```
cd pwa
python3 -m http.server 8080
```
Buka `http://localhost:8080` di browser komputer. Service worker & "Add to Home
Screen" hanya aktif penuh di HTTPS/hosting asli, tapi ini cara cepat mengecek
tampilan & fungsi sebelum upload.

## Tentang koneksi internet & offline
Karena React, Tailwind, ikon, dan grafik dimuat dari CDN (bukan dibundel ke file lokal),
**setiap kali dibuka, HP perlu internet sebentar** untuk memuat "kerangka" aplikasinya
(biasanya cepat, dan browser akan menyimpan cache-nya untuk pembukaan berikutnya).
Data keuangan kamu sendiri tersimpan 100% di HP (localStorage) sehingga aman walau
sinyal hilang di tengah pemakaian — hanya *pemuatan awal halaman* yang idealnya perlu
internet. Kalau kamu butuh versi yang benar-benar 100% offline dari awal (tanpa CDN
sama sekali), beri tahu saya — itu bisa dibuat tapi perlu proses bundling (build) satu kali.

## Tentang data
Data disimpan di **localStorage** browser HP kamu (bukan server), jadi:
- Data tetap ada walau HP offline / pesawat mode.
- Data **tidak otomatis sinkron** antar HP/browser lain — ini murni penyimpanan lokal per perangkat.
- Menghapus cache/data browser, atau "Clear storage", akan menghapus data juga. Cadangkan secara berkala kalau perlu (fitur export bisa ditambahkan kalau kamu mau).

## Login, Daftar & Keluar
Aplikasi ini sekarang punya halaman Masuk/Daftar sendiri:
- **Daftar**: buat akun dengan nama keluarga, email, dan password (minimal 6 karakter).
- **Masuk**: pakai email & password yang sama untuk lanjut ke data yang sama.
- **Keluar**: ada di halaman Pengaturan, kembali ke halaman Masuk (data tidak hilang).
- Bisa lebih dari satu akun/keluarga di HP yang sama — tiap akun datanya terpisah total, tidak akan tercampur.
- Kalau kamu sebelumnya sudah pakai versi lama (tanpa login), datanya **otomatis dipindahkan** jadi akun pertamamu saat pertama kali buka versi baru ini — tidak perlu daftar ulang, tidak ada data yang hilang.

Catatan jujur soal keamanan: karena ini aplikasi tanpa server, password disimpan dalam bentuk **ter-hash** (bukan teks biasa) di HP itu sendiri — cukup untuk mencegah orang lain iseng buka-buka lewat aplikasi, tapi bukan pengganti keamanan server sungguhan. Akun juga hanya ada di HP itu saja (belum bisa dipakai login dari HP lain).

## Kalau ingin upgrade ke backend sungguhan
Versi ini cocok untuk MVP keluarga di satu HP. Kalau nanti butuh multi-device
sync (akun bisa dipakai login dari HP manapun), database nyata (PostgreSQL + Prisma
sesuai dokumen awal), itu perlu server backend sungguhan — beri tahu saya, saya bisa
siapkan source code Next.js + Prisma-nya secara terpisah untuk dijalankan di
komputer/server dengan `npm install` dan database asli.

## Mengaktifkan "Masuk dengan Google" (opsional)
Tombol ini sudah disiapkan di kode tapi **nonaktif secara default** sampai kamu
mengisi Client ID milikmu sendiri (gratis, dari Google, ~5 menit):
1. Buka https://console.cloud.google.com/apis/credentials
2. Buat project baru -> "Create Credentials" -> "OAuth client ID" -> pilih "Web application".
3. Di "Authorized JavaScript origins", isi alamat hosting kamu persis, contoh:
   `https://nama-app-kamu.netlify.app` (tanpa garis miring di akhir).
4. Salin "Client ID" yang muncul.
5. Buka `app.jsx`, cari baris `const GOOGLE_CLIENT_ID = "";` (dekat komponen Onboarding),
   tempel Client ID kamu di antara tanda kutip, lalu upload ulang `app.jsx` ke hosting.
6. Buka lagi alamat hosting kamu — tombol Google akan muncul di halaman awal.

Catatan: ini hanya untuk **identitas** (nama, foto, email ditampilkan di halaman
Pengaturan) supaya tidak perlu ketik nama manual — data keuangan tetap tersimpan
lokal di HP, belum ada sinkronisasi antar perangkat. Kalau Client ID dikosongkan,
aplikasi tetap berjalan normal seperti biasa dengan isi nama manual.
