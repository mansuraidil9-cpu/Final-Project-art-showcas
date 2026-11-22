import { pool } from './db.mjs'

const curatorAccounts = `(role = 'curator' OR (role = 'member' AND curator_status = 'approved'))`

export async function getPlatformStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT count(*) FROM users WHERE role = 'admin')::integer AS admins,
      (SELECT count(*) FROM users WHERE role = 'member')::integer AS members,
      (SELECT count(*) FROM users WHERE ${curatorAccounts})::integer AS curators,
      (SELECT count(*) FROM artworks)::integer AS artworks,
      (SELECT count(*) FROM artwork_reports WHERE status = 'pending')::integer AS reports,
      (SELECT count(*) FROM challenges WHERE starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP)::integer AS challenges`)
  return rows[0]
}

export async function getPlatformUsers(role) {
  const { rows } = await pool.query(`
    SELECT id::text, display_name, email, role, curator_status
    FROM users
    WHERE CASE WHEN $1::text = 'curator' THEN ${curatorAccounts}
               ELSE $1 IS NULL OR role = $1 END
    ORDER BY created_at DESC, id DESC`, [role])
  return rows
}
