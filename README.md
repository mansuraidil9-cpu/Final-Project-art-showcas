# ALTERIA

Galeri seni digital dengan empat peran. Guest melihat karya dan challenge. Member mengelola karya serta profil dan mengikuti challenge. Curator mengadakan challenge. Admin memverifikasi Curator dan mengelola platform.

## Menjalankan proyek

1. Gunakan Node.js 20.9 atau lebih baru dan PostgreSQL. Jalankan `npm ci` dari folder proyek.
2. Buat database bernama `alteria`. Buka **Query Tool** pada database tersebut di pgAdmin, lalu jalankan seluruh isi `database/schema.sql`. Jika sudah punya database ALTERIA, jalankan ulang file yang sama untuk memperbarui skema sambil mempertahankan data.
3. Buat `.env.local` di samping `package.json` dan sesuaikan pengaturannya.

   ```dotenv
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=alteria
   PGUSER=postgres
   PGPASSWORD="GANTI_DENGAN_PASSWORD_POSTGRESQL"
   ```

   Untuk tanda dolar di kata sandi, tulis tanda itu sebagai `\$` agar Next.js membacanya sebagai karakter biasa.
4. Jalankan `npm run dev`, lalu buka [localhost:3000](http://localhost:3000).

Untuk menambahkan data contoh, jalankan `database/seed-artworks.sql` dan `database/seed-challenge.sql` setelah skema.

## Akun Admin

Isi pengaturan berikut sementara di `.env.local` dengan email dan kata sandi pilihanmu.

```dotenv
ALTERIA_ADMIN_NAME="Admin ALTERIA"
ALTERIA_ADMIN_EMAIL=admin@example.test
ALTERIA_ADMIN_PASSWORD="GANTI_DENGAN_PASSWORD_ADMIN"
```

Jalankan `node scripts/create-admin.mjs`, hapus `ALTERIA_ADMIN_PASSWORD` dari file, lalu masuk dari halaman **Masuk**.

## Alur penggunaan

- **Member** membuka Dashboard untuk mengunggah karya, melihat favorit, mengatur profil publik atau akun, dan melihat submisi. Gambar karya, foto profil, dan banner menerima JPEG, PNG, atau WebP hingga 5 MB. Aplikasi menyimpannya sebagai WebP di PostgreSQL.
- **Curator** mendaftar dari halaman **Daftar**. Setelah Admin menyetujui akun, buka **Dashboard Curator → Buat challenge**. Jadwal diisi dalam WITA. Selama challenge aktif, Member dapat mengirim satu karya miliknya dan menariknya kembali sebelum tenggat.
- **Pemenang** diumumkan dari halaman **Kelola** milik Curator setelah challenge selesai. Pilih maksimal tiga karya, masing-masing untuk satu peringkat. Submisi dan hasil tampil di halaman publik Challenge.
- **Admin** membuka Dashboard untuk melihat statistik, memverifikasi Curator, memfilter pengguna, dan mengelola kategori. Jika kategori masih dipakai, pilih kategori pengganti saat menghapusnya.
- **Moderasi** dimulai dari tombol **Laporkan karya** di Detail Karya untuk unggahan Member lain. Admin dapat menolak laporan atau menghapus karya melalui **Buka moderasi**.

Jalankan `npm run lint` dan `npm run build` untuk memeriksa proyek. Kredit gambar contoh tersedia di [credits.json](public/alteria/credits.json).
