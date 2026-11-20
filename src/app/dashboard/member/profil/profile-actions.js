'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { pool, transaction } from '@/lib/db.mjs'
import { isValidEmail, readText } from '@/lib/form-fields'
import { hashPassword, verifyPassword } from '@/lib/password.mjs'
import { clearSession, requireUser } from '@/lib/session'
import { readImageUpload } from '@/lib/uploads'

function parseLinks(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length > 5) return null

  try {
    const links = lines.map(line => {
      const url = new URL(line)
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('Tautan profil tidak valid.')
      }
      return url.href
    })
    return [...new Set(links)]
  } catch {
    return null
  }
}

export async function saveProfile(_previous, formData) {
  const user = await requireUser('member')
  const name = readText(formData, 'name')
  const bio = readText(formData, 'bio')
  const linksText = readText(formData, 'links')
  const links = parseLinks(linksText)

  if (!name || name.length > 120) return { error: 'Isi nama tampilan dengan maksimal 120 karakter.' }
  if (bio.length > 500) return { error: 'Bio maksimal 500 karakter.' }
  if (!links || linksText.length > 2000) return { error: 'Isi maksimal lima tautan web HTTP atau HTTPS, satu per baris.' }

  const { image, error: imageError } = await readImageUpload(formData, 'avatar', 'profil', { maxDimension: 512 })
  if (imageError) return { error: imageError }
  try {
    const { rowCount } = await pool.query(`
      UPDATE users SET display_name = $2, bio = $3, profile_links = $4,
        avatar_data = COALESCE($5, avatar_data)
      WHERE id = $1 AND role = 'member'`, [user.id, name, bio, links, image?.data ?? null])
    if (!rowCount) return { error: 'Profil tidak ditemukan.' }
  } catch (error) {
    console.error('Profil gagal disimpan.', error.code ?? error.name)
    return { error: 'Profil belum bisa disimpan. Coba lagi.' }
  }
  revalidatePath('/', 'layout')
  return { success: 'Profil publik berhasil diperbarui.' }
}

export async function saveAccount(_previous, formData) {
  const user = await requireUser('member')
  const email = readText(formData, 'email').toLowerCase()
  const current = readText(formData, 'currentPassword', { trim: false })
  const next = readText(formData, 'newPassword', { trim: false })
  const confirmation = readText(formData, 'confirmation', { trim: false })

  if (!isValidEmail(email)) return { error: 'Masukkan alamat email yang valid.' }
  if (next || confirmation) {
    if (next.length < 8 || next.length > 128 || next !== confirmation) {
      return { error: 'Kata sandi baru harus berisi 8 sampai 128 karakter dan sama dengan konfirmasi.' }
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
      await client.query('UPDATE users SET email = $2, password_hash = $3 WHERE id = $1', [user.id, email, newHash])
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

  revalidatePath('/dashboard/member/profil')
  redirect('/dashboard/member/profil?hasil=akun')
}
