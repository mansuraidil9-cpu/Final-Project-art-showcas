import { pool } from './db.mjs'

export async function getArtworkCategories() {
  const { rows } = await pool.query('SELECT name FROM artwork_categories ORDER BY lower(name), name')
  return rows.map(row => row.name)
}
