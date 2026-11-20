import { isDatabaseId, pool } from '@/lib/db.mjs'
import { webpResponse } from '@/lib/uploads'

export async function GET(_request, { params }) {
  const { id } = await params
  if (!isDatabaseId(id)) return webpResponse(null)

  const { rows } = await pool.query(
    "SELECT avatar_data FROM users WHERE id = $1 AND role = 'member'", [id],
  )
  return webpResponse(rows[0]?.avatar_data)
}
