import { pool } from './db.mjs'

export async function getPlatformStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT count(*) FROM users WHERE role = 'admin')::integer AS admins,
      (SELECT count(*) FROM users WHERE role = 'member')::integer AS members,
      (SELECT count(*) FROM users WHERE role = 'curator')::integer AS curators,
      (SELECT count(*) FROM artworks)::integer AS artworks,
      (SELECT count(*) FROM artwork_reports WHERE status = 'pending')::integer AS reports,
      (SELECT count(*) FROM challenges WHERE starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP)::integer AS challenges`)
  return rows[0]
}

export async function getPlatformUsers(role) {
  const { rows } = await pool.query(`
    SELECT id::text, display_name, email, role, curator_status
    FROM users WHERE ($1::text IS NULL OR role = $1) ORDER BY created_at DESC, id DESC`, [role])
  return rows
}
