import pg from "pg";

const { Pool } = pg;

function createPool() {
  const pool = new Pool();

  pool.on("error", (error) => {
    console.error("Koneksi PostgreSQL terputus.", error.code ?? "");
  });

  return pool;
}

export const pool = process.env.NODE_ENV === "development"
  ? (globalThis.alteriaPostgresPool ??= createPool())
  : createPool();
