'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isValidEmail, normalizeEmail } from '@/lib/account-validation.mjs'
import { pool, transaction } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { hashPassword, isValidNewPassword, verifyPassword } from '@/lib/password.mjs'
import { clearSession, requireUser } from '@/lib/session'

export async function saveAccount(_previous, formData) {
  const user = await requireUser('member')
  const enteredEmail = normalizeEmail(readText(formData, 'email', { trim: false }))
  const newEmail = enteredEmail === normalizeEmail(user.email) ? null : enteredEmail
  const current = formData.get('currentPassword')
  const next = formData.get('newPassword') ?? ''
  const confirmation = formData.get('confirmation') ?? ''

  if (newEmail !== null && !isValidEmail(newEmail)) return { error: 'Masukkan alamat email yang valid.' }
  if (next || confirmation) {
    if (!isValidNewPassword(next) || next !== confirmation) {
      return { error: 'Kata sandi baru harus berisi 8 sampai 128 karakter tanpa spasi atau karakter tak terlihat, dan sama dengan konfirmasi.' }
    }
  }

  try {
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1 AND role = 'member'", [user.id],
    )
    const oldHash = rows[0]?.password_hash
    if (!await verifyPassword(current, oldHash)) return { error: 'Kata sandi saat ini salah.' }

    const newHash = next ? await hashPassword(next) : oldHash
    const saved = await transaction(async client => {
      const locked = await client.query(
        "SELECT id FROM users WHERE id = $1 AND password_hash = $2 AND role = 'member' FOR UPDATE",
        [user.id, oldHash],
      )
      if (!locked.rowCount) return false
      await client.query('UPDATE users SET email = COALESCE($2, email), password_hash = $3 WHERE id = $1', [user.id, newEmail, newHash])
      if (next) await client.query('DELETE FROM sessions WHERE user_id = $1', [user.id])
      return true
    })
    if (!saved) return { error: 'Akun sudah berubah. Coba lagi dengan kata sandi terbaru.' }
  } catch (error) {
    if (error.constraint === 'users_email_lower_unique') return { error: 'Email sudah digunakan akun lain.' }
    console.error('Akun gagal diperbarui.', error.code ?? error.name)
    return { error: 'Perubahan akun belum bisa disimpan.' }
  }

  if (next) {
    await clearSession()
    redirect('/login')
  }

  revalidatePath('/dashboard/member/akun')
  redirect('/dashboard/member/akun?hasil=akun')
}
