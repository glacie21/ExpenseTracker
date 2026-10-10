# 💰 Expense Tracker

Aplikasi web untuk mencatat dan memantau kondisi keuangan pribadi: pemasukan, pengeluaran, kategori, dan ringkasan saldo. Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, dan **Prisma ORM**.

| Tahap | Cakupan | Status |
| :--- | :--- | :--- |
| **Tahap 1** | Fondasi, autentikasi, database, layout dashboard | ✅ Selesai |
| **Tahap 2** | Transaksi, kategori, dashboard keuangan, search & filter | ✅ Selesai |
| Tahap 3 | Budgeting, export laporan, grafik analitik lanjutan | Belum dikerjakan |

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
| **Icons** | [Lucide React](https://lucide.dev/) | Icon set |
| **Testing** | `node:test` (bawaan Node.js) | Test end-to-end API |

---

## 🚀 2. Fitur

### Tahap 1 — Fondasi & Autentikasi
- **Landing page** responsif dengan navbar, hero, dan ringkasan fitur.
- **Registrasi** (`/register`): validasi nama, email, password (min. 6 karakter), konfirmasi password, dan cek email duplikat. Password di-hash dengan **bcrypt** (10 salt rounds).
- **Login** (`/login`): opsi *Remember Me* (sesi 30 hari vs 1 hari) dan tombol **"Gunakan Akun Demo"**.
- **Sesi**: JWT (HS256) di cookie HTTP-only `expense_tracker_session` (`SameSite=Lax`, `Secure` di produksi).
- **Proteksi rute** via `src/proxy.ts`: `/dashboard`, `/transactions`, `/categories` hanya untuk pengguna login. Pengguna yang sudah login diarahkan dari `/login`/`/register` ke `/dashboard`.
- **Logout** yang menghapus cookie sesi di server.
- **Komponen UI reusable** (`src/components/ui`): `Button`, `Input`, `Card`, `Modal`, `ConfirmDialog`, `Alert`, `Avatar`, `Badge`.

### Tahap 2 — Core Features
- **Dashboard keuangan** (`/dashboard`) dengan data aktual dari database:
  - Kartu **Total Balance**, **Total Income**, **Total Expense**, **Net Savings** (pengguna baru mulai dari `Rp0`).
  - **5 transaksi terbaru** dengan tombol **View All**.
  - **Quick actions**: Add Income, Add Expense, View Transactions.
  - Loading skeleton, empty state, dan error state.
- **Manajemen transaksi** (`/transactions`):
  - Tabel berisi tanggal, nama, kategori, tipe (badge), nominal (hijau untuk pemasukan, merah untuk pengeluaran), dan aksi.
  - Tambah/edit lewat modal: tipe, judul, nominal, kategori, tanggal, deskripsi opsional. Ada validasi, loading state, dan pencegahan submit ganda.
  - Hapus dengan dialog konfirmasi.
  - **Search** berdasarkan nama/deskripsi (dengan debounce).
  - **Filter**: tipe (All/Income/Expense), kategori, rentang tanggal, tahun, dan bulan.
  - **Sorting** terbaru/terlama dan **pagination di server** (10 per halaman).
  - Filter tersimpan di URL, jadi tetap ada saat reload dan saat berpindah halaman.
- **Manajemen kategori** (`/categories`):
  - Lihat kategori per tab (Semua/Income/Expense), lengkap dengan jumlah transaksinya.
  - Tambah, ubah nama dan warna, hapus.
  - **13 kategori default** dibuat otomatis per pengguna, tanpa duplikasi.
  - Kategori yang masih dipakai **tidak bisa dihapus**. Pengguna diarahkan ke daftar transaksinya (tautan "Lihat transaksi") untuk memindahkannya lebih dulu. Transaksi tidak pernah ikut terhapus.

**Definisi perhitungan:** Total Income = jumlah semua pemasukan; Total Expense = jumlah semua pengeluaran; **Total Balance = Net Savings = Total Income − Total Expense**. Total Balance adalah saldo bersih dari transaksi yang tercatat, **bukan saldo rekening bank aktual**.

---

## 🗄️ 3. Database Schema

Didefinisikan di [`prisma/schema.prisma`](prisma/schema.prisma). Migration: `prisma/migrations/20261009154848_init_phase2`.

| Model | Field utama | Catatan |
| :--- | :--- | :--- |
| `User` (`users`) | `id`, `name`, `email` (unik), `password` | Dari Tahap 1 |
| `Category` (`categories`) | `id`, `userId`, `name`, `type`, `color` | Unik per `(userId, name, type)`; ikut terhapus jika user dihapus |
| `Transaction` (`transactions`) | `id`, `userId`, `categoryId`, `type`, `amount`, `title`, `description?`, `date` | `amount` = `Decimal(15,2)`; relasi ke kategori `onDelete: Restrict` |

- `type` memakai enum `TransactionType` (`INCOME` | `EXPENSE`).
- Nominal disimpan sebagai **Decimal**, bukan floating-point. Total dihitung dengan agregasi PostgreSQL dan aritmetika Decimal.
- `date` adalah **tanggal kalender** yang disimpan sebagai pukul 00:00 UTC dan selalu diformat dalam UTC, sehingga transaksi tidak bergeser ke hari sebelum/sesudahnya di zona waktu mana pun.
- Index: `(userId, date)`, `(userId, type)`, `categoryId`.

---

## ⚙️ 4. Instalasi & Menjalankan Aplikasi

### Prasyarat
- Node.js v20+ dan npm
- PostgreSQL (lokal, Docker, atau cloud). Bisa juga memakai PostgreSQL bawaan project lewat `npm run db:start`.

### Langkah

1. **Install dependensi**
   ```bash
   npm install
   ```

2. **Siapkan environment**: salin `.env.example` ke `.env`, lalu isi:
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker?schema=public"
   JWT_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
   ```
   Untuk PostgreSQL bawaan (`npm run db:start`), kredensialnya `postgres:postgres` di port `5432`.

3. **(Opsional) Jalankan PostgreSQL bawaan** di terminal terpisah:
   ```bash
   npm run db:start
   ```
   Data disimpan di `.db-data/` dan dipakai ulang di setiap start.

4. **Jalankan migration**
   ```bash
   # Development: menerapkan migration yang belum dijalankan
   npm run db:migrate

   # Produksi / CI: hanya menerapkan migration yang ada
   npx prisma migrate deploy
   ```
   Migration Tahap 2 hanya menambah tabel dan tidak menghapus data. **Jangan** menjalankan `prisma migrate reset` pada database berisi data, karena perintah itu menghapus seluruh isi database.

5. **(Opsional) Seed akun demo**
   ```bash
   npm run seed
   ```
   Membuat/memperbarui akun demo beserta 13 kategori default (tidak membuat transaksi dummy):
   - Email: `demo@example.com`
   - Password: `Password123!`

6. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

---

## 🧪 5. Testing

Test end-to-end API ada di [`tests/api.test.mjs`](tests/api.test.mjs) dan memakai test runner bawaan Node.js. Test berjalan terhadap aplikasi dan database sungguhan. Setiap run membuat pengguna uji baru dan menghapusnya di akhir.

```bash
# 1. Pastikan database berjalan dan migration sudah diterapkan
# 2. Jalankan aplikasi (dev atau produksi)
npm run dev            # atau: npm run build && npm start
# 3. Di terminal lain
npm test               # BASE_URL default: http://localhost:3000
```

Skenario yang diuji:
- Tambah pemasukan, tambah pengeluaran, edit, dan hapus transaksi milik sendiri.
- Search, filter (tipe, kategori, rentang tanggal, bulan/tahun), sorting, dan pagination.
- Pengguna tidak dapat membaca, mengedit, atau menghapus transaksi dan kategori milik pengguna lain.
- Nominal nol, negatif, atau tidak valid ditolak; kategori tidak valid, kategori milik pengguna lain, atau kategori dengan tipe berbeda ditolak.
- Ringkasan dashboard berubah sesuai transaksi.
- Data tetap ada setelah reload.
- Pengguna yang belum login mendapat `401` (API) atau diarahkan ke `/login` (halaman).
- Kategori default tanpa duplikasi; kategori yang masih dipakai tidak bisa dihapus.

Pemeriksaan lain:
```bash
npm run lint
npm run typecheck
npm run build
```

---

## 📖 6. Panduan Penggunaan

**Mencatat transaksi**
1. Buka **Dashboard**, lalu klik **Add Income** atau **Add Expense**. Bisa juga dari **Transactions → Add Transaction**.
2. Pilih tipe, isi judul, nominal (lebih dari 0, maksimal 2 angka desimal), kategori yang sesuai tipe, tanggal, dan deskripsi bila perlu.
3. Klik **Tambah Transaksi**. Daftar dan ringkasan langsung diperbarui.

**Mengedit / menghapus transaksi:** di tabel **Transactions**, klik ikon pensil untuk mengedit atau ikon tempat sampah untuk menghapus (ada konfirmasi).

**Mencari & memfilter:** gunakan kolom pencarian, tombol tipe, pilihan kategori, rentang tanggal, tahun/bulan, dan urutan. Tombol **Reset** mengembalikan semua filter.

**Mengelola kategori:** buka **Categories** untuk menambah kategori, mengubah nama/warna, atau menghapus kategori. Tipe kategori tidak dapat diubah setelah dibuat. Untuk menghapus kategori yang masih dipakai, klik **Lihat transaksi**, pindahkan transaksinya ke kategori lain lewat edit, lalu hapus kategorinya.

---

## 🔌 7. API Endpoint

Semua endpoint di bawah membutuhkan sesi login. Identitas pengguna diambil dari cookie sesi yang diverifikasi di server, bukan dari `userId` kiriman client. Semua query dibatasi ke pengguna tersebut.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | Autentikasi (tanpa sesi) |
| `GET` | `/api/auth/me` | Profil pengguna aktif |
| `GET` | `/api/transactions` | Daftar transaksi. Query: `search`, `type`, `categoryId`, `startDate`, `endDate` (YYYY-MM-DD), `year`, `month`, `sort` (`newest`/`oldest`), `page`, `limit` (maks. 100) |
| `POST` | `/api/transactions` | Tambah transaksi |
| `GET` / `PUT` / `DELETE` | `/api/transactions/[id]` | Detail / ubah / hapus transaksi |
| `GET` | `/api/categories` | Daftar kategori (`?type=INCOME\|EXPENSE`), sekaligus membuat kategori default bila belum ada |
| `POST` | `/api/categories` | Tambah kategori |
| `PUT` / `DELETE` | `/api/categories/[id]` | Ubah nama/warna / hapus kategori (ditolak bila masih dipakai) |
| `GET` | `/api/dashboard/summary` | Ringkasan keuangan + 5 transaksi terbaru |

Transaksi/kategori milik pengguna lain diperlakukan sebagai "tidak ditemukan" (`404`). Error database tidak pernah ditampilkan ke pengguna.

---

## 📁 8. Struktur Project

```text
ExpenseTracker/
├── prisma/
│   ├── schema.prisma          # User, Category, Transaction
│   ├── migrations/            # Migration Prisma
│   └── seed.js                # Akun demo + kategori default
├── scripts/db.js              # PostgreSQL embedded untuk development
├── tests/api.test.mjs         # Test end-to-end API
├── src/
│   ├── app/
│   │   ├── (auth)/            # /login, /register
│   │   ├── (dashboard)/       # /dashboard, /transactions, /categories (+ layout terproteksi)
│   │   ├── api/               # Route handlers (auth, transactions, categories, dashboard)
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── categories/        # CategoryModal
│   │   ├── dashboard/         # DashboardShell, StatCard, RecentTransactions, EmptyState, UserProfileModal
│   │   ├── layout/            # Navbar, Sidebar, Header
│   │   ├── transactions/      # TransactionTable, TransactionFilters, TransactionModal
│   │   └── ui/                # Komponen UI reusable
│   ├── lib/
│   │   ├── auth.ts            # Hash password, sign JWT, getCurrentUser
│   │   ├── jwt.ts             # Verifikasi sesi (edge-safe), validasi redirect
│   │   ├── categories.ts      # Kategori default per pengguna
│   │   ├── transactions.ts    # Parsing & validasi kepemilikan transaksi
│   │   ├── dashboard.ts       # Agregasi ringkasan keuangan
│   │   ├── dates.ts           # Penanganan tanggal kalender (UTC)
│   │   ├── formatters.ts      # Format Rupiah & tanggal
│   │   ├── validations.ts     # Validasi input server & client
│   │   └── prisma.ts          # PrismaClient singleton
│   ├── types/index.ts
│   └── proxy.ts               # Proteksi rute (Next.js 16 Proxy)
└── README.md
```

---

## 📜 9. Script npm

| Script | Deskripsi |
| :--- | :--- |
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm test` | Test end-to-end API (aplikasi harus berjalan) |
| `npm run db:start` | PostgreSQL embedded untuk development |
| `npm run db:migrate` | Membuat/menerapkan migration (development) |
| `npm run db:push` | Sinkronisasi skema tanpa migration |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Prisma Studio |
| `npm run seed` | Seed akun demo |

---

## 🔒 10. Keamanan

- Password tidak pernah disimpan sebagai plaintext (bcrypt, 10 salt rounds).
- Token sesi ditandatangani HS256 dan disimpan di cookie HTTP-only. **Set `JWT_SECRET` yang kuat di produksi.**
- `src/proxy.ts` melakukan pengecekan awal di setiap rute terproteksi. Layout dashboard dan setiap endpoint API memverifikasi ulang sesi beserta keberadaan pengguna di database.
- Parameter `redirect` setelah login hanya menerima path relatif di domain yang sama (mencegah open redirect).
- Semua query Prisma dibatasi `userId` dari sesi. ID dan input divalidasi di server. Prisma memakai query berparameter, sehingga aman dari SQL injection.
