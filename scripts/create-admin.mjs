import nextEnv from "@next/env";
import { isValidDisplayName, isValidEmail, normalizeEmail } from "../src/lib/account-validation.mjs";
import { pool } from "../src/lib/db.mjs";
import { hashPassword, isValidNewPassword } from "../src/lib/password.mjs";

nextEnv.loadEnvConfig(process.cwd(), true);

function reportError(message) {
  console.error(message);
  process.exitCode = 1;
}

async function createAdmin() {
  const email = normalizeEmail(process.env.ALTERIA_ADMIN_EMAIL ?? "");
  const password = process.env.ALTERIA_ADMIN_PASSWORD ?? "";
  const displayName = (process.env.ALTERIA_ADMIN_NAME ?? "Admin").trim();

  if (!isValidEmail(email)) {
    return reportError("Isi ALTERIA_ADMIN_EMAIL dengan alamat email yang valid.");
  }

  if (!isValidNewPassword(password)) {
    return reportError("Isi ALTERIA_ADMIN_PASSWORD dengan 8 sampai 128 karakter tanpa spasi atau karakter tak terlihat.");
  }

  if (!isValidDisplayName(displayName)) {
    return reportError("Isi ALTERIA_ADMIN_NAME dengan nama yang terlihat dan maksimal 120 karakter.");
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
