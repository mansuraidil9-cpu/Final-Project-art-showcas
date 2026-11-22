'use server'

import { redirect } from 'next/navigation'
import { pool } from '../lib/db.mjs'
import { isValidDisplayName, isValidEmail, normalizeEmail } from '../lib/account-validation.mjs'
import { hashPassword, isValidNewPassword, verifyPassword } from '../lib/password.mjs'
import { clearSession, dashboardPath, generateSession, requireUser, setSessionCookie } from '../lib/session'

const loginEmailPattern = /^[^\s@\0]+@[^\s@\0]+\.[^\s@\0]+$/

function textField(formData, name) {
  if (!(formData instanceof FormData)) return ''
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function signUp(_previousState, formData) {
  const displayName = textField(formData, 'displayName').trim()
  const email = normalizeEmail(textField(formData, 'email'))
  const password = textField(formData, 'password')
  const confirmation = textField(formData, 'confirmation')
  const values = {
    displayName: displayName.slice(0, 120),
    email: email.slice(0, 254),
  }

  if (!isValidDisplayName(displayName)) {
    return { error: 'Isi nama tampilan yang terlihat dalam satu baris, maksimal 120 karakter.', values }
  }
  if (!isValidEmail(email)) return { error: 'Masukkan alamat email yang valid.', values }
  if (!isValidNewPassword(password)) {
    return { error: 'Kata sandi harus berisi 8 sampai 128 karakter tanpa spasi atau karakter tak terlihat.', values }
  }
  if (password !== confirmation) {
    return { error: 'Konfirmasi kata sandi harus sama dengan kata sandi.', values }
  }

  const session = generateSession()
  try {
    const passwordHash = await hashPassword(password)
    await pool.query(
      `WITH new_user AS (
         INSERT INTO users (display_name, email, password_hash, role)
         VALUES ($1, $2, $3, 'member')
         RETURNING id
       )
       INSERT INTO sessions (token_hash, user_id, expires_at)
       SELECT $4, id, $5 FROM new_user`,
      [displayName, email, passwordHash, session.hash, session.expiresAt],
    )
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'users_email_lower_unique') {
      return { error: 'Email sudah terdaftar. Gunakan halaman Masuk.', values }
    }
    console.error('Pendaftaran ALTERIA gagal', error.code ?? error.name)
    return { error: 'Akun belum bisa dibuat. Coba lagi sebentar.', values }
  }

  await setSessionCookie(session.token)
  redirect('/dashboard/member')
}

export async function signIn(_previousState, formData) {
  const email = normalizeEmail(textField(formData, 'email'))
  const password = textField(formData, 'password')
  const values = { email: email.slice(0, 254) }
  const invalidLogin = { error: 'Email atau kata sandi tidak cocok.', values }

  if (email.length > 254 || !loginEmailPattern.test(email) || !password || password.length > 128) return invalidLogin

  const session = generateSession()
  let user
  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash, role, curator_status
       FROM users
       WHERE lower(email) = $1`,
      [email],
    )
    user = rows[0]

    if (!(await verifyPassword(password, user?.password_hash)) || !user) return invalidLogin

    const { rowCount } = await pool.query(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       SELECT $1, id, $3 FROM users WHERE id = $2 AND password_hash = $4 FOR SHARE`,
      [session.hash, user.id, session.expiresAt, user.password_hash],
    )
    if (!rowCount) return invalidLogin
  } catch (error) {
    console.error('Login ALTERIA gagal', error.code ?? error.name)
    return { error: 'Masuk belum bisa diproses. Coba lagi sebentar.', values }
  }

  await setSessionCookie(session.token)
  redirect(dashboardPath(user))
}

export async function signOut() {
  await clearSession()
  redirect('/login')
}

export async function deleteRejectedCurator(formData) {
  const user = await requireUser()
  if (user.role !== 'curator' || user.curator_status !== 'rejected') {
    redirect(dashboardPath(user))
  }
  if (textField(formData, 'confirmed') !== 'yes') redirect('/curator/pending')

  const { rowCount } = await pool.query(
    `DELETE FROM users
     WHERE id = $1 AND role = 'curator' AND curator_status = 'rejected'`,
    [user.id],
  )
  if (rowCount === 0) redirect('/curator/pending')

  await clearSession()
  redirect('/register')
}
