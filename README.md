# 💰 Expense Tracker

Aplikasi web untuk mencatat dan memantau kondisi keuangan pribadi: pemasukan, pengeluaran, kategori, analitik, laporan, dan anggaran bulanan. Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, dan **Prisma ORM**.

| Tahap | Cakupan | Status |
| :--- | :--- | :--- |
| **Tahap 1** | Fondasi, autentikasi, database, layout dashboard | ✅ Selesai |
| **Tahap 2** | Transaksi, kategori, dashboard keuangan, search & filter | ✅ Selesai |
| **Tahap 3** | Dashboard analitik, laporan, anggaran, export CSV/PDF, kesiapan produksi | ✅ Selesai |
| **Tahap 4** | Keamanan akun: rate limiting, pencabutan sesi, halaman Settings, CSP, CI | ✅ Selesai |

---

## 🛠️ 1. Tech Stack

| Layer | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) 16 (App Router) | Server Components, Route Handlers, Proxy |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) | Strict static typing |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) v4 | Utility-first CSS |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Sumber data utama |
| **ORM** | [Prisma](https://www.prisma.io/) v6 | Type-safe query & migration |
| **Autentikasi** | `bcryptjs` + `jose` (JWT) | Hash password & cookie sesi HTTP-only |
| **Grafik** | SVG buatan sendiri | Tanpa library chart tambahan |
| **PDF** | [`pdf-lib`](https://pdf-lib.js.org/) | Laporan PDF di server (pure JS, MIT) |
| **Icons** | [Lucide React](https://lucide.dev/) | Icon set |
| **Testing** | `node:test` (bawaan Node.js) | Unit test & test integrasi API |

---

## 🚀 2. Fitur

### Tahap 1 — Fondasi & Autentikasi
- **Landing page** responsif dengan navbar, hero, dan ringkasan fitur.
- **Registrasi** (`/register`): validasi nama, email, password (min. 8 karakter), konfirmasi password, dan cek email duplikat. Password di-hash dengan **bcrypt** (10 salt rounds).
- **Login** (`/login`): opsi *Remember Me* (sesi 30 hari vs 1 hari) dan tombol **"Gunakan Akun Demo"**.
- **Sesi**: JWT (HS256) di cookie HTTP-only `expense_tracker_session` (`SameSite=Lax`, `Secure` di produksi).
- **Proteksi rute** via `src/proxy.ts`: `/dashboard`, `/transactions`, `/categories`, `/reports`, `/budgets`, `/settings` hanya untuk pengguna login. Pengguna yang sudah login diarahkan dari `/login`/`/register` ke `/dashboard`.
- **Logout** yang menghapus cookie sesi di server.
- **Komponen UI reusable** (`src/components/ui`): `Button`, `Input`, `Card`, `Modal`, `ConfirmDialog`, `Alert`, `Avatar`, `Badge`.

### Tahap 2 — Core Features
- **Manajemen transaksi** (`/transactions`):
  - Tabel berisi tanggal, judul, kategori, nominal (bertanda + / −), dan aksi.
  - Tambah/edit lewat modal (tipe, judul, nominal, kategori, tanggal, deskripsi opsional) dengan validasi, loading state, dan pencegahan submit ganda.
  - Hapus dengan dialog konfirmasi.
  - **Search** (dengan debounce), **filter** tipe/kategori/rentang tanggal/tahun/bulan, **sorting**, dan **pagination di server**. Filter tersimpan di URL.
  - **Unduh CSV** sesuai filter aktif (Tahap 3).
- **Manajemen kategori** (`/categories`):
  - Tab Semua/Pemasukan/Pengeluaran, tambah, ubah nama/warna, hapus.
  - **13 kategori default** berbahasa Indonesia (Gaji, Makan & minum, Transportasi, dst.) dibuat otomatis per pengguna, tanpa duplikasi. Akun yang dibuat sebelum kategori diterjemahkan tetap memakai nama lamanya; namanya bisa diubah di halaman Kategori.
  - Kategori yang masih dipakai transaksi atau anggaran **tidak bisa dihapus**. Transaksi tidak pernah ikut terhapus.
- **Aksi cepat** di dashboard: **Catat pengeluaran** dan **Catat pemasukan**, plus **5 transaksi terakhir** dengan tautan **Lihat semua**.

### Tahap 3 — Advanced Features
- **Dashboard analitik** (`/dashboard`):
  - **Pemilih periode**: Minggu ini, Bulan ini, Bulan lalu, 3 bulan terakhir, Tahun ini, Rentang lain. Semua angka dan grafik mengikuti periode yang dipilih, dan label periodenya selalu ditampilkan.
  - **Neraca periode**: pemasukan, pengeluaran, dan saldo bersih (atau defisit) dalam satu tabel, ditutup garis ganda, plus tingkat tabungan.
  - **Tren** dibanding periode sebelumnya, untuk pemasukan, pengeluaran, dan saldo bersih: selisih nominal dan persentase. Jika periode pembanding bernilai nol, ditampilkan "Belum ada data pembanding", bukan persentase yang menyesatkan.
  - **Grafik arus kas** (pemasukan vs pengeluaran): harian, mingguan, atau bulanan tergantung panjang periode. Tooltip menampilkan tanggal dan nominal Rupiah, tersedia lewat mouse maupun keyboard, ukurannya responsif, dan ada tabel data sebagai alternatif.
  - **Pengeluaran per kategori**: bar per kategori dengan nominal, persentase, warna kategori, dan tooltip.
  - Saldo dari seluruh catatan sejak awal ditampilkan di bawah dashboard.
- **Laporan** (`/reports`):
  - Periode mingguan, bulanan, tahunan, atau rentang khusus, dengan navigasi sebelumnya/berikutnya. Filter jenis transaksi dan kategori.
  - Neraca: pemasukan, pengeluaran, saldo bersih, tingkat tabungan, dan kategori pengeluaran terbesar.
  - **Wawasan kategori**: pengeluaran per kategori, dan tabel kategori yang pengeluarannya naik dibanding periode sebelumnya.
  - Tabel transaksi sesuai filter dengan pagination di server.
  - **Unduh CSV** dan **Unduh PDF** dengan filter yang sama.
- **Anggaran** (`/budgets`):
  - Anggaran bulanan per kategori pengeluaran: buat, edit, dan hapus (dengan konfirmasi), plus daftar per bulan/tahun.
  - Satu tabel per bulan: batas, terpakai, sisa, persentase, dan bar pemakaian yang tetap rapi di atas 100%, ditutup baris jumlah.
  - **Peringatan dalam aplikasi**: *Mendekati batas* (≥ 80%), *Habis* (= 100%), *Terlampaui* (> 100%). Tidak ada email atau push notification.
- **Export**:
  - **CSV** dalam UTF-8 (dengan BOM agar terbaca benar di Excel). Kolom: tanggal (`YYYY-MM-DD`), judul, tipe, kategori, nominal (`5000000.00`), dan deskripsi. Koma, tanda kutip, dan baris baru di-escape. Teks yang menyerupai rumus (`=`, `+`, `-`, `@`) diberi awalan `'` untuk mencegah CSV/formula injection.
  - **PDF** A4: judul, periode, filter, waktu pembuatan, ringkasan, pengeluaran per kategori, dan tabel transaksi. Header tabel diulang di tiap halaman dan setiap halaman bernomor. Maksimal 2.000 baris transaksi; untuk data lengkap gunakan CSV.

### Tahap 4 — Keamanan Akun
- **Pengaturan** (`/settings`):
  - Ubah nama tampilan. Email tidak bisa diubah karena dipakai untuk login.
  - **Ganti password**: wajib memasukkan password saat ini. Setelah berhasil, sesi di perangkat lain berakhir, sedangkan sesi saat ini tetap berjalan.
  - **Logout dari semua perangkat**: mengakhiri semua sesi, termasuk sesi saat ini.
  - **Hapus akun**: wajib memasukkan password. Akun beserta seluruh transaksi, kategori, dan anggaran dihapus permanen.
- **Pencabutan sesi**: setiap token membawa `sessionVersion` milik pengguna. Ganti password atau "logout semua perangkat" menaikkan versi tersebut, sehingga semua token lama langsung ditolak di setiap request. Perangkat yang sesinya dicabut (atau akunnya dihapus) diarahkan lewat `/api/auth/session-expired`, yang menghapus cookie lama lalu membuka halaman login. Setelah login ulang, pengguna kembali ke halaman yang tadi dibuka.
- **Rate limiting** (di memori proses):

  | Aksi | Batas |
  | :--- | :--- |
  | Login gagal per email | 5 per 15 menit; selama terkunci, password yang benar pun ditolak (`429` + `Retry-After`) |
  | Login gagal per IP | 50 per 15 menit |
  | Registrasi per IP | 50 per jam |
  | Registrasi dengan email yang sudah terdaftar, per IP | 10 per jam; setelah itu semua registrasi dari IP tersebut ditolak, supaya daftar email tidak bisa dicek satu per satu |
  | Password saat ini salah (ganti password / hapus akun), per pengguna | 5 per 15 menit |
- Login dengan email yang tidak terdaftar memakan waktu yang sama dengan password salah, sehingga keberadaan email tidak bisa ditebak dari waktu respons.
- Password minimal **8 karakter** dan maksimal 72 byte (batas bcrypt).
- Halaman **404** dan **error** dengan tombol "Coba lagi", serta `global-error` untuk kegagalan di root layout.

### Definisi perhitungan
| Istilah | Rumus |
| :--- | :--- |
| Total Income | Jumlah transaksi `INCOME` dalam periode |
| Total Expense | Jumlah transaksi `EXPENSE` dalam periode |
| Net Balance | Total Income − Total Expense |
| Savings Rate | (Total Income − Total Expense) ÷ Total Income × 100%; **0% jika Total Income = 0**; bisa negatif bila pengeluaran melebihi pemasukan |
| Perubahan periode | (nilai sekarang − nilai sebelumnya) ÷ \|nilai sebelumnya\| × 100%; tanpa persentase jika nilai sebelumnya 0 |
| Penggunaan anggaran | Pengeluaran kategori pada bulan tersebut ÷ anggaran × 100% |
| Sisa anggaran | Anggaran − pengeluaran aktual (negatif = melebihi anggaran) |

**Periode pembanding:** minggu, bulan, 3 bulan, atau tahun sebelumnya untuk preset; untuk rentang khusus dipakai jumlah hari yang sama tepat sebelum rentang. Preset selalu mencakup periode kalender penuh (misalnya This Month = tanggal 1 sampai akhir bulan), dan minggu dimulai hari Senin. "Hari ini" ditentukan berdasarkan `APP_TIMEZONE` (default `Asia/Jakarta`).

Saldo bersih adalah selisih transaksi yang tercatat, **bukan saldo rekening bank aktual**. Semua uang dihitung dengan `Decimal` di database dan satuan sen (integer) di aplikasi, sehingga hasilnya eksak.

---

## 🗄️ 3. Database Schema

Didefinisikan di [`prisma/schema.prisma`](prisma/schema.prisma).

| Model | Field utama | Catatan |
| :--- | :--- | :--- |
| `User` (`users`) | `id`, `name`, `email` (unik), `password`, `sessionVersion` | Tahap 1; `sessionVersion` sejak Tahap 4 |
| `Category` (`categories`) | `id`, `userId`, `name`, `type`, `color` | Unik per `(userId, name, type)` |
| `Transaction` (`transactions`) | `id`, `userId`, `categoryId`, `type`, `amount`, `title`, `description?`, `date` | `amount` = `Decimal(15,2)`; kategori `onDelete: Restrict` |
| `Budget` (`budgets`) | `id`, `userId`, `categoryId`, `amount`, `month`, `year` | **Tahap 3**. Unik per `(userId, categoryId, year, month)`; `CHECK month 1–12` dan `amount > 0`; kategori `onDelete: Restrict` |

Migration:
| Migration | Isi |
| :--- | :--- |
| `20261009154848_init_phase2` | Tabel `users`, `categories`, `transactions` |
| `20261010154238_add_budgets_and_analytics_indexes` | Tabel `budgets`; index `transactions (userId, type, date)` dan `(userId, categoryId, date)` untuk query analitik dan anggaran (menggantikan index `(userId, type)` yang sudah tercakup). **Tidak menghapus data.** |
| `20261011090000_add_user_session_version` | Kolom `users.sessionVersion` (default `0`). Sesi yang sudah ada tetap valid. **Tidak menghapus data.** |

Catatan desain:
- Anggaran **hanya untuk kategori pengeluaran**. Aturan ini dicek di API, karena tipe disimpan di kategori, bukan di anggaran.
- `date` adalah **tanggal kalender** yang disimpan sebagai 00:00 UTC dan selalu diformat dalam UTC, sehingga transaksi tidak bergeser hari di zona waktu mana pun.
- Statistik dihitung dengan agregasi PostgreSQL (`groupBy`, `date_trunc`), bukan dengan mengambil semua transaksi ke aplikasi.

---

## ⚙️ 4. Menjalankan Secara Lokal

### Prasyarat
- Node.js **v20.19+** (disarankan v22 atau v24) dan npm. Unit test memakai fitur Node untuk menjalankan file `.ts` secara langsung (bawaan sejak Node 22.18 / 23.6).
- PostgreSQL (lokal, Docker, atau cloud), **atau** PostgreSQL bawaan project lewat `npm run db:start`.

### Langkah
1. **Install dependensi** (otomatis menjalankan `prisma generate`):
   ```bash
   npm install
   ```
2. **Environment**: salin `.env.example` ke `.env`, lalu isi (lihat [Environment variables](#-6-environment-variables)).
3. **(Opsional) PostgreSQL bawaan** di terminal terpisah:
   ```bash
   npm run db:start
   ```
   Data disimpan di `.db-data/` dan dipakai ulang setiap start. Kredensialnya `postgres:postgres` di port `5432`.
4. **Migration**:
   ```bash
   npm run db:migrate   # development: menerapkan migration yang belum dijalankan
   ```
   **Jangan** menjalankan `prisma migrate reset` pada database berisi data, karena perintah itu menghapus seluruh isi database.
5. **(Opsional) Akun demo**: `npm run seed` membuat `demo@example.com` / `Password123!` beserta kategori default (tanpa transaksi dummy).
6. **Jalankan**: `npm run dev`, lalu buka [http://localhost:3000](http://localhost:3000).

### Database lokal & encoding
Mulai Tahap 3, `npm run db:start` membuat data directory **baru** dengan encoding **UTF-8** (locale `C.UTF-8`). Data directory yang dibuat sebelumnya di Windows bisa saja memakai **WIN1252**. Akibatnya teks dengan emoji atau huruf non-Latin ditolak (API mengembalikan pesan yang jelas, bukan error 500). Saat start, script akan menampilkan peringatan jika hal ini terjadi. Untuk pindah ke UTF-8:
1. Hentikan `npm run db:start`, lalu **ganti nama** `.db-data` (simpan sebagai cadangan, jangan langsung dihapus).
2. Jalankan `npm run db:start` lagi untuk membuat data directory UTF-8 yang baru.
3. Jalankan `npm run db:deploy`, lalu `npm run seed` jika perlu akun demo.
4. Jika data lama perlu dipindahkan, ekspor dulu (misalnya dengan `pg_dump`) dari cadangan sebelum memulai langkah ini.

Database produksi pada umumnya sudah memakai UTF-8.

---

## 🧪 5. Testing

| Jenis | Lokasi | Perintah | Butuh aplikasi berjalan? |
| :--- | :--- | :--- | :--- |
| Unit test | `tests/unit/*.test.mjs` | `npm run test:unit` | Tidak |
| Integration (API end-to-end) | `tests/api.test.mjs` (Tahap 2), `tests/stage3.test.mjs` (Tahap 3), `tests/account.test.mjs` (Tahap 4) | `npm run test:integration` | Ya |
| Semua | | `npm test` | Ya |

```bash
# 1. Database berjalan dan migration sudah diterapkan
# 2. Jalankan aplikasi
npm run dev            # atau: npm run build && npm start
# 3. Di terminal lain
npm test               # BASE_URL default: http://localhost:3000
```

Test integrasi membuat pengguna uji dengan email `*@test.expense-tracker.local` dan **hanya menghapus pengguna tersebut** di akhir. Data lain tidak disentuh. Meski begitu, sebaiknya jalankan terhadap database development atau database test, **jangan terhadap database produksi**.

Cakupan:
- **Unit**: total, saldo bersih, savings rate (termasuk pemasukan nol dan nilai negatif), perubahan antarperiode (pembanding nol, basis negatif), penggunaan dan sisa anggaran serta statusnya (80%, 100%, >100%), resolusi periode (minggu Senin, pergantian tahun, Februari kabisat, zona waktu), bucket grafik, dan penulisan CSV (escaping, formula injection).
- **Integrasi Tahap 2**: CRUD transaksi, filter, validasi nominal dan kategori, isolasi antar pengguna, ringkasan, persistensi, dan akses tanpa login.
- **Integrasi Tahap 3**: analitik per periode (termasuk transaksi di hari pertama/terakhir rentang), laporan dengan filter, validasi backend, ekspor CSV (isi, escaping, BOM, hanya data sendiri, 404 bila kosong), PDF (valid, periode kosong), anggaran (progres dari pengeluaran aktual, berubah saat transaksi diedit/dihapus, duplikat, kategori pemasukan ditolak), isolasi anggaran/laporan/ekspor antar pengguna, dan semua endpoint/halaman baru menolak akses tanpa login.
- **Integrasi Tahap 4**: penguncian login (429), aturan password, ubah profil, ganti password (sesi lain dicabut, sesi ini tetap), batas tebakan password, logout semua perangkat, hapus akun beserta seluruh datanya, akses tanpa login, dan header CSP.
- **Unit Tahap 4**: rate limiter (batas, reset jendela waktu, isolasi key) dan pembacaan IP klien.

Rate limiter menyimpan hitungan di memori server. Satu kali `npm test` memakai sekitar 15 registrasi dan 20-an login gagal dari IP yang sama. Jika test dijalankan berkali-kali dalam satu jam lalu registrasi mendapat `429`, restart aplikasi untuk mengosongkan hitungan.

### CI
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) berjalan di setiap push ke `main` dan setiap pull request:
1. **checks**: lint, typecheck, unit test, dan build.
2. **integration**: PostgreSQL 17 sebagai service, `db:deploy`, build, `npm start`, lalu `npm run test:integration`. Log aplikasi ditampilkan jika ada test yang gagal.

Belum ada test browser (Playwright). Skenario end-to-end diuji di level HTTP. Lihat bagian [Keterbatasan](#-12-keterbatasan--rencana-berikutnya).

Pemeriksaan lain: `npm run lint`, `npm run typecheck`, `npm run build`.

---

## 🔐 6. Environment Variables

| Variabel | Wajib | Keterangan |
| :--- | :--- | :--- |
| `DATABASE_URL` | Ya | Connection string PostgreSQL. Gunakan database ber-encoding UTF-8. |
| `JWT_SECRET` | Ya (produksi) | Minimal 32 karakter acak. Di produksi, aplikasi menolak berjalan tanpa nilai ini. Contoh pembuatan: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `APP_TIMEZONE` | Tidak | Zona waktu untuk menentukan "hari ini" pada filter periode. Default `Asia/Jakarta`. |
| `BASE_URL` | Tidak | URL aplikasi untuk test integrasi. Default `http://localhost:3000`. |

`NODE_ENV` diatur otomatis oleh `next dev` / `next build` / `next start`. Template ada di [`.env.example`](.env.example) (tanpa secret).

---

## 🚢 7. Deployment

Langkah umum untuk server Node.js (VPS, Docker, Railway, Render, dan sejenisnya):
```bash
npm ci                      # install + prisma generate
npm run build               # build produksi
npm run db:deploy           # prisma migrate deploy: hanya menerapkan migration yang ada, non-destruktif
npm start                   # jalankan di port 3000 (atur PORT bila perlu)
```
- Set `DATABASE_URL` dan `JWT_SECRET` di environment platform. Jangan commit `.env`.
- Jalankan `npm run db:deploy` sebagai langkah rilis **sebelum** versi baru menerima traffic. Jangan pernah memakai `migrate dev`, `migrate reset`, atau `db push` di produksi.
- Untuk platform serverless (misalnya Vercel), gunakan PostgreSQL terkelola dengan connection pooling (misalnya PgBouncer atau pooler bawaan penyedia), lalu jalankan `prisma migrate deploy` di pipeline rilis.
- Rate limiting disimpan di memori proses. Ini cukup untuk **satu instance** (VPS atau satu container). Jika aplikasi berjalan di beberapa instance atau serverless, tiap instance menghitung sendiri-sendiri, jadi gunakan store bersama (misalnya Redis). Batas per IP membaca `x-real-ip` / `x-forwarded-for`, jadi pastikan reverse proxy Anda menimpa header tersebut. Batas per email tidak bergantung pada IP.
- Aplikasi mengirim header keamanan (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `Strict-Transport-Security` di produksi) dan `Cache-Control: no-store` untuk seluruh API, sehingga data keuangan tidak di-cache.
- PostgreSQL embedded (`npm run db:start`) hanya untuk development.

---

## 📖 8. Panduan Penggunaan

**Ringkasan:** pilih periode di baris tab (Minggu ini … Rentang lain). Neraca, tren, dan grafik ikut berubah, dan nama periodenya tampil di bawah tab. Arahkan kursor atau fokus keyboard ke batang grafik untuk melihat nominal, atau buka "Lihat tabel data".

**Transaksi:** catat lewat **Catat pengeluaran** / **Catat pemasukan** di Ringkasan, atau **Catat transaksi** di halaman Transaksi. Ubah lewat ikon pensil, hapus lewat ikon tempat sampah (ada konfirmasi). Tab Semua/Pemasukan/Pengeluaran, kotak cari, dan filter di bawahnya bisa digabung; **Hapus semua filter** mengembalikan daftar lengkap. **Unduh CSV** mengunduh semua transaksi yang sesuai filter aktif, tidak hanya halaman yang sedang tampil.

**Laporan:** pilih Mingguan/Bulanan/Tahunan/Rentang tanggal, lalu atur periode (tombol ‹ › untuk mundur/maju), tipe transaksi, dan kategori. **Unduh CSV** dan **Unduh PDF** memakai filter yang sama.

**Anggaran:** geser bulan dengan tombol ‹ › atau pilih langsung di kotak bulan, lalu klik **Buat anggaran** dan isi kategori pengeluaran, batas, bulan, dan tahun. Tabel anggaran menunjukkan batas, yang terpakai, sisa, dan statusnya. Peringatan muncul di atas tabel bila ada anggaran yang mendekati atau melewati batas. Satu kategori hanya bisa punya satu anggaran per bulan.

**Kategori:** kategori pemasukan dan pengeluaran ditampilkan dalam dua daftar. Anda bisa menambah, mengubah nama/warna, dan menghapus kategori. Klik jumlah transaksi untuk melihat transaksinya. Kategori yang masih dipakai transaksi atau anggaran perlu dikosongkan dulu sebelum dihapus.

**Pengaturan:** buka **Pengaturan** di sidebar (atau **Pengaturan akun** di modal profil) untuk mengubah nama, mengganti password, keluar dari semua perangkat, atau menghapus akun.

---

## 🔌 9. API Endpoint

Semua endpoint di bawah (kecuali register/login/logout) membutuhkan sesi login. Identitas pengguna diambil dari cookie sesi yang diverifikasi di server, bukan dari `userId` kiriman client. Semua query dibatasi ke pengguna tersebut. Data milik pengguna lain diperlakukan sebagai "tidak ditemukan" (`404`), dan error internal tidak pernah dikirim ke client.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | Autentikasi |
| `GET` | `/api/auth/me` | Profil pengguna aktif |
| `GET` | `/api/auth/session-expired?redirect=` | Menghapus cookie sesi yang sudah dicabut lalu mengarahkan ke `/login`; sesi yang masih valid tidak disentuh |
| `PUT` / `DELETE` | `/api/account` | Ubah nama (`{ name }`) / hapus akun beserta seluruh data (`{ password }`) |
| `PUT` | `/api/account/password` | Ganti password (`{ currentPassword, newPassword, confirmPassword }`); sesi lain dicabut |
| `DELETE` | `/api/account/sessions` | Logout dari semua perangkat |
| `GET` / `POST` | `/api/transactions` | Daftar (query: `search`, `type`, `categoryId`, `startDate`, `endDate`, `year`, `month`, `sort`, `page`, `limit` ≤ 100) / tambah |
| `GET` / `PUT` / `DELETE` | `/api/transactions/[id]` | Detail / ubah / hapus |
| `GET` | `/api/transactions/export` | **CSV** dengan filter yang sama seperti daftar (maks. 100.000 baris; `404` bila kosong) |
| `GET` / `POST` | `/api/categories` | Daftar (`?type=`) / tambah |
| `PUT` / `DELETE` | `/api/categories/[id]` | Ubah / hapus (ditolak bila dipakai transaksi atau anggaran) |
| `GET` | `/api/dashboard/summary` | Ringkasan seluruh transaksi + 5 transaksi terbaru |
| `GET` | `/api/analytics` | Statistik periode: `period` (`this_week`, `this_month`, `last_month`, `last_3_months`, `this_year`, `custom`), `start`, `end` |
| `GET` | `/api/reports` | Laporan: `startDate`, `endDate` (wajib, maks. 5 tahun), `periodType` (`week`/`month`/`year`/`custom`), `type`, `categoryId` |
| `GET` | `/api/reports/pdf` | Laporan **PDF**, parameter sama dengan `/api/reports` |
| `GET` / `POST` | `/api/budgets` | Anggaran + progres untuk `?month=&year=` (default bulan ini) / buat |
| `PUT` / `DELETE` | `/api/budgets/[id]` | Ubah / hapus anggaran (`409` bila duplikat) |

---

## 📁 10. Struktur Project

```text
ExpenseTracker/
├── prisma/
│   ├── schema.prisma          # User, Category, Transaction, Budget
│   ├── migrations/            # Migration Prisma
│   └── seed.js                # Akun demo + kategori default
├── .github/workflows/ci.yml   # CI: lint, typecheck, test, build
├── scripts/db.js              # PostgreSQL embedded (UTF-8) untuk development
├── tests/
│   ├── unit/                  # Unit test perhitungan, periode, CSV
│   ├── api.test.mjs           # Integrasi Tahap 2
│   ├── stage3.test.mjs        # Integrasi Tahap 3
│   └── account.test.mjs       # Integrasi Tahap 4
├── src/
│   ├── app/
│   │   ├── (auth)/            # /login, /register
│   │   ├── (dashboard)/       # /dashboard, /transactions, /categories, /reports, /budgets, /settings
│   │   ├── api/               # Route handlers
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── budgets/           # BudgetLedger, BudgetModal
│   │   ├── categories/        # CategoryModal
│   │   ├── charts/            # IncomeExpenseChart, ExpenseBreakdown, chartTheme
│   │   ├── dashboard/         # DashboardShell, PeriodStatement, PeriodFilter, TrendLine, RecentTransactions, ...
│   │   ├── layout/            # Navbar, Sidebar, Header
│   │   ├── reports/           # ReportTransactionsTable
│   │   ├── settings/          # SettingsPanel (profil, password, sesi, hapus akun)
│   │   ├── transactions/      # TransactionTable, TransactionFilters, TransactionModal
│   │   └── ui/                # Komponen UI reusable
│   ├── lib/
│   │   ├── analytics.ts       # Agregasi periode, deret waktu, breakdown, tren
│   │   ├── reports.ts         # Laporan & insight kategori
│   │   ├── pdfReport.ts       # Pembuat PDF (pdf-lib)
│   │   ├── budgets.ts         # Progres anggaran
│   │   ├── finance.ts         # Rumus keuangan murni (unit-tested)
│   │   ├── dates.ts           # Tanggal kalender & periode (unit-tested)
│   │   ├── csv.ts             # Penulis CSV aman (unit-tested)
│   │   ├── transactions.ts    # Validasi & filter transaksi bersama
│   │   ├── auth.ts / jwt.ts   # Sesi, pencabutan sesi & autentikasi
│   │   ├── account.ts         # Verifikasi ulang password untuk aksi sensitif
│   │   ├── rateLimit.ts       # Rate limiter di memori (unit-tested)
│   │   └── ...                # config, money, dbErrors, formatters, validations, prisma
│   ├── types/index.ts
│   └── proxy.ts               # Proteksi rute (Next.js 16 Proxy)
└── README.md
```

---

## 📜 11. Script npm

| Script | Deskripsi |
| :--- | :--- |
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm test` | Unit + integrasi (aplikasi harus berjalan) |
| `npm run test:unit` | Unit test saja |
| `npm run test:integration` | Test integrasi API saja |
| `npm run db:start` | PostgreSQL embedded untuk development |
| `npm run db:migrate` | Membuat/menerapkan migration (development) |
| `npm run db:deploy` | Menerapkan migration yang ada (produksi/CI) |
| `npm run db:push` | Sinkronisasi skema tanpa migration (development saja) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Prisma Studio |
| `npm run seed` | Seed akun demo |

---

## 🧭 12. Keterbatasan & Rencana Berikutnya

- **Belum ada test browser** (Playwright). Alur UI (klik, modal, unduhan di browser) belum diuji otomatis; yang diuji adalah API dan HTML yang dirender server. Menambahkan Playwright adalah langkah berikutnya yang disarankan.
- PDF memakai font standar Helvetica (WinAnsi). Karakter di luar Latin, seperti emoji atau aksara non-Latin, diganti `?` di PDF, tetapi tetap utuh di aplikasi dan CSV.
- Ekspor dibatasi 100.000 baris (CSV) dan 2.000 baris transaksi (PDF).
- Perbandingan "Bulan ini" memakai bulan penuh sebelumnya, sehingga di awal bulan angka bulan berjalan wajar terlihat lebih kecil.
- **Belum ada reset password lewat email** ("lupa password"), karena aplikasi belum punya layanan pengiriman email. Untuk saat ini password hanya bisa diganti saat sedang login.
- **Logout biasa** hanya menghapus cookie di browser tersebut. Jika token mungkin bocor, gunakan **Keluar dari semua perangkat** di Pengaturan, atau ganti password.
- CSP masih memakai `'unsafe-inline'` untuk script, karena Next.js membutuhkannya jika tidak memakai nonce per request.
- Ide lanjutan: akun/dompet dan transfer antar akun, transaksi dan anggaran berulang, import CSV mutasi bank, serta pengaturan zona waktu dan mata uang per pengguna.

---

## 🔒 13. Keamanan

- Password di-hash dengan bcrypt (10 salt rounds) dan tidak pernah disimpan sebagai plaintext. Panjang minimal 8 karakter.
- Login gagal, registrasi, dan tebakan password saat ini dibatasi (lihat Tahap 4). Waktu respons login sama untuk email yang terdaftar maupun tidak.
- Ganti password atau "logout semua perangkat" langsung mencabut semua token lama melalui `sessionVersion`.
- Aksi sensitif (ganti password, hapus akun) mewajibkan password saat ini.
- Token sesi ditandatangani HS256 dan disimpan di cookie HTTP-only. Di produksi, `JWT_SECRET` wajib diisi minimal 32 karakter.
- `src/proxy.ts` mengecek setiap rute terproteksi. Layout dashboard dan setiap endpoint API memverifikasi ulang sesi beserta keberadaan pengguna di database.
- Parameter `redirect` setelah login hanya menerima path relatif di domain yang sama (mencegah open redirect).
- Semua query dibatasi `userId` dari sesi. ID, filter, dan input divalidasi di server. Prisma dan raw query memakai parameter, sehingga aman dari SQL injection.
- Ekspor CSV dilindungi dari formula injection, dan respons API tidak di-cache.
