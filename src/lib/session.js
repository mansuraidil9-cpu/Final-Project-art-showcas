import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { pool } from './db.mjs'

const cookieName = 'alteria_session'
const sessionSeconds = 7 * 24 * 60 * 60

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function getSessionHash(cookieStore) {
  const token = cookieStore.get(cookieName)?.value
  return token && /^[a-f0-9]{64}$/.test(token) ? hashToken(token) : null
}

export function generateSession() {
  const token = randomBytes(32).toString('hex')
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + sessionSeconds * 1000),
  }
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies()
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionSeconds,
  })
}

export async function getCurrentUser() {
  const hash = getSessionHash(await cookies())
  if (!hash) return null

  const { rows } = await pool.query(
    `SELECT u.id, u.display_name, u.email, u.role, u.curator_status
     FROM sessions AS s
     JOIN users AS u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [hash],
  )
  return rows[0] ?? null
}

export function dashboardPath(user) {
  if (user.role === 'curator' && user.curator_status !== 'approved') {
    return '/curator/pending'
  }

  return `/dashboard/${user.role}`
}

export async function requireUser(role) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (role && dashboardPath(user) !== `/dashboard/${role}`) {
    redirect(dashboardPath(user))
  }
  return user
}

export async function clearSession() {
  const cookieStore = await cookies()
  const hash = getSessionHash(cookieStore)
  if (hash) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hash])
  cookieStore.delete(cookieName)
}
