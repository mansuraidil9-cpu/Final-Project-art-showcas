This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database ALTERIA

1. Jalankan `npm ci` dari folder proyek.
2. Buat atau buka database `alteria` di pgAdmin. Buka **Query Tool** pada database itu, lalu jalankan file `database/schema.sql`.
3. Isi `.env.local` di samping `package.json` dengan pengaturan PostgreSQL lokalmu.

   ```dotenv
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=alteria
   PGUSER=postgres
   PGPASSWORD="GANTI_DENGAN_PASSWORD_POSTGRESQL"
   ```

4. Jalankan ulang `npm run dev`. Dari halaman **Daftar**, buat akun Member atau Curator. Akun Curator baru menunggu persetujuan Admin sebelum dashboard bisa dibuka.

Kalau password berisi tanda dolar, tulis tanda itu sebagai `\$` di `.env.local` supaya terbaca sebagai karakter biasa.

### Menambahkan karya dan challenge contoh

Jika database sudah dibuat sebelum fitur Galeri dan Challenge, jalankan kembali `database/schema.sql` di **Query Tool**. Setelah itu, jalankan skrip berikut di database `alteria`.

1. `database/seed-artworks.sql` menambahkan enam karya contoh ke Galeri. Pada database baru, `/karya/2` membuka **Wheat Field with Cypresses**.
2. `database/seed-challenge.sql` menambahkan **Kota Setelah Hujan**, yang tampil di bagian challenge aktif hingga 30 November 2026 pukul 23.59 WITA. Pada database baru, `/challenge/1` membuka detailnya, termasuk setelah tenggat.

Kedua skrip bisa dijalankan ulang tanpa mengganti data yang sudah ada.

### Menyukai karya

Jika database sudah ada, jalankan kembali `database/schema.sql` di **Query Tool** pada database `alteria`. Setelah masuk, klik tombol hati di halaman detail karya untuk menyukai karya. Klik lagi untuk membatalkan suka. Setiap akun dapat memberi satu suka per karya.

### Kelola Karya Member

Jika database sudah ada, jalankan kembali `database/schema.sql` untuk menambahkan kolom penyimpanan karya Member. Masuk sebagai Member, lalu buka **Dashboard → Unggah karya**. Pilih satu gambar JPEG, PNG, atau WebP hingga 5 MB. Aplikasi menyimpan gambar dalam format WebP di PostgreSQL dan menampilkannya di Galeri. Dari dashboard, Member bisa mengubah judul, deskripsi, kategori, dan tag, atau menghapus karya miliknya.

### Membuat akun Admin

Tambahkan pengaturan berikut sementara ke `.env.local` dan isi dengan email serta kata sandi yang kamu pilih.

```dotenv
ALTERIA_ADMIN_NAME="Admin ALTERIA"
ALTERIA_ADMIN_EMAIL=admin@example.test
ALTERIA_ADMIN_PASSWORD="GANTI_DENGAN_PASSWORD_ADMIN"
```

Jalankan perintah ini dari folder proyek.

```powershell
node scripts/create-admin.mjs
```

Setelah akun dibuat, hapus variabel `ALTERIA_ADMIN_PASSWORD` dari file dan gunakan halaman **Masuk**. File `.env.local` tetap berada di komputer yang menjalankan aplikasi.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
