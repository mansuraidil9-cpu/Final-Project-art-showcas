import nextEnv from "@next/env";
import { pool } from "../src/lib/db.mjs";
import { hashPassword } from "../src/lib/password.mjs";

nextEnv.loadEnvConfig(process.cwd(), true);

function reportError(message) {
  console.error(message);
  process.exitCode = 1;
}

async function createAdmin() {
  const email = (process.env.ALTERIA_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ALTERIA_ADMIN_PASSWORD ?? "";
  const displayName = (process.env.ALTERIA_ADMIN_NAME ?? "Admin").trim();

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reportError("Isi ALTERIA_ADMIN_EMAIL dengan alamat email yang valid.");
  }

  if (password.length < 8 || password.length > 128) {
    return reportError("Isi ALTERIA_ADMIN_PASSWORD dengan 8 sampai 128 karakter.");
  }

  if (!displayName || displayName.length > 120) {
    return reportError("Isi ALTERIA_ADMIN_NAME dengan nama sepanjang 1 sampai 120 karakter.");
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (display_name, email, password_hash, role, curator_status)
     VALUES ($1, $2, $3, 'admin', NULL)
     ON CONFLICT (lower(email)) DO NOTHING`,
    [displayName, email, passwordHash],
  );

  if (result.rowCount === 0) {
    return reportError("Email ini sudah terdaftar. Gunakan email lain untuk akun Admin.");
  }

  console.log("Akun Admin ALTERIA berhasil dibuat.");
}

try {
  await createAdmin();
} catch {
  reportError("Gagal membuat akun Admin. Periksa koneksi PostgreSQL dan skema database.");
} finally {
  await pool.end();
}
