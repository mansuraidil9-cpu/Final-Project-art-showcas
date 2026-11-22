'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db.mjs'
import { requireUser } from '@/lib/session'
import { readImageUpload } from '@/lib/uploads'

export async function saveAdminAvatar(_previous, formData) {
  const user = await requireUser('admin')
  if (!(formData instanceof FormData)) return { error: 'Pilih file gambar.' }

  const { image, error } = await readImageUpload(formData, 'avatar', 'profil', {
    required: true,
    maxDimension: 512,
  })
  if (error) return { error }

  try {
    const { rowCount } = await pool.query(
      "UPDATE users SET avatar_data = $2 WHERE id = $1 AND role = 'admin'",
      [user.id, image.data],
    )
    if (!rowCount) return { error: 'Profil Admin tidak ditemukan.' }
  } catch (error) {
    console.error('Foto profil Admin gagal disimpan.', error.code ?? error.name)
    return { error: 'Foto profil belum bisa disimpan. Coba lagi.' }
  }

  revalidatePath('/', 'layout')
  return { success: 'Foto profil berhasil disimpan.' }
}
