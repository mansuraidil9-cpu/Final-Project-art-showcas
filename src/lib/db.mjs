import pg from "pg";

const { Pool } = pg;
const maxDatabaseId = 9223372036854775807n;
const databaseIdPattern = /^[1-9][0-9]{0,18}$/;

export function isDatabaseId(id) {
  return typeof id === "string" && databaseIdPattern.test(id) && BigInt(id) <= maxDatabaseId;
}

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

export async function transaction(change) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await change(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
