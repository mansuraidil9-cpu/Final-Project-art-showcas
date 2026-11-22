import { pool } from '@/lib/db.mjs'
import { getCurrentUser } from '@/lib/session'
import { webpResponse } from '@/lib/uploads'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'admin' || !user.hasAvatar) return webpResponse(null)

  const { rows } = await pool.query(
    "SELECT avatar_data FROM users WHERE id = $1 AND role = 'admin'", [user.id],
  )
  return webpResponse(rows[0]?.avatar_data)
}
