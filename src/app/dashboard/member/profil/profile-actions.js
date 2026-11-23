'use server'

import { revalidatePath } from 'next/cache'
import { isValidDisplayName } from '@/lib/account-validation.mjs'
import { pool } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { requireUser } from '@/lib/session'
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
  const removeAvatar = formData.get('removeAvatar') === 'yes'

  if (!isValidDisplayName(name)) return { error: 'Isi nama tampilan yang terlihat dan maksimal 120 karakter.' }
  if (bio.length > 500) return { error: 'Bio maksimal 500 karakter.' }
  if (!links || linksText.length > 2000) return { error: 'Isi maksimal lima tautan web HTTP atau HTTPS, satu per baris.' }

  const { image, error: imageError } = removeAvatar
    ? { image: null, error: null }
    : await readImageUpload(formData, 'avatar', 'profil', { maxDimension: 512 })
  if (imageError) return { error: imageError }
  try {
    const { rowCount } = await pool.query(`
      UPDATE users SET display_name = $2, bio = $3, profile_links = $4,
        avatar_data = CASE WHEN $6::boolean THEN NULL ELSE COALESCE($5, avatar_data) END
      WHERE id = $1 AND role = 'member'`, [user.id, name, bio, links, image?.data ?? null, removeAvatar])
    if (!rowCount) return { error: 'Profil tidak ditemukan.' }
  } catch (error) {
    console.error('Profil gagal disimpan.', error.code ?? error.name)
    return { error: 'Profil belum bisa disimpan. Coba lagi.' }
  }
  revalidatePath('/', 'layout')
  return { success: 'Profil publik berhasil diperbarui.' }
}
