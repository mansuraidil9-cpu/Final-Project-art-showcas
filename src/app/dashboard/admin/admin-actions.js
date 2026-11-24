'use server'

import { revalidatePath } from 'next/cache'
import { isDatabaseId, pool, transaction } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { requireUser } from '@/lib/session'

function refreshAdminAndPublicPages() {
  revalidatePath('/', 'layout')
}

export async function removeUser(id, _previous, formData) {
  const admin = await requireUser('admin')
  if (!isDatabaseId(id) || formData.get('confirmed') !== 'yes') return { error: 'Konfirmasi penghapusan akun.' }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM users u
       WHERE u.id = $1 AND u.id <> $2 AND u.role IN ('member', 'curator')
       AND NOT EXISTS (
         SELECT 1 FROM challenges c
         WHERE c.owner_id = u.id AND c.winners_published_at IS NOT NULL
       )`,
      [id, admin.id],
    )
    if (!rowCount) return { error: 'Akun tidak ditemukan atau memiliki challenge dengan hasil final yang wajib diarsipkan.' }
  } catch (error) {
    console.error('Pengguna gagal dihapus.', error.code ?? error.name)
    return { error: 'Akun belum bisa dihapus.' }
  }
  refreshAdminAndPublicPages()
  return null
}

export async function saveCategory(oldName, _previous, formData) {
  await requireUser('admin')
  const name = readText(formData, 'name')
  if (!name || name.length > 80) return { error: 'Isi nama kategori dengan maksimal 80 karakter.' }

  try {
    const { rowCount } = oldName === null
      ? await pool.query('INSERT INTO artwork_categories(name) VALUES ($1)', [name])
      : await pool.query('UPDATE artwork_categories SET name = $1 WHERE name = $2', [name, oldName])
    if (!rowCount) return { error: 'Kategori tidak ditemukan.' }
  } catch (error) {
    if (error.code === '23505') return { error: 'Nama kategori sudah digunakan.' }
    console.error('Kategori gagal disimpan.', error.code ?? error.name)
    return { error: 'Kategori belum bisa disimpan.' }
  }
  refreshAdminAndPublicPages()
  return { success: 'Kategori tersimpan.' }
}

export async function removeCategory(name, _previous, formData) {
  await requireUser('admin')
  const replacement = readText(formData, 'replacement')
  if (replacement === name) return { error: 'Pilih kategori pengganti yang berbeda.' }

  try {
    const removed = await transaction(async client => {
      if (replacement) {
        const { rowCount } = await client.query(
          'SELECT name FROM artwork_categories WHERE name = ANY($1::text[]) ORDER BY name FOR UPDATE',
          [[name, replacement]],
        )
        if (rowCount !== 2) return false
        await client.query('UPDATE artworks SET category = $2 WHERE category = $1', [name, replacement])
      }
      const { rowCount } = await client.query('DELETE FROM artwork_categories WHERE name = $1', [name])
      return rowCount === 1
    })
    if (!removed) return { error: 'Kategori tidak ditemukan.' }
  } catch (error) {
    if (error.constraint === 'artworks_category_fkey') {
      return { error: 'Pilih kategori pengganti untuk karya yang menggunakan kategori ini.' }
    }
    console.error('Kategori gagal dihapus.', error.code ?? error.name)
    return { error: 'Kategori belum bisa dihapus.' }
  }
  refreshAdminAndPublicPages()
  return null
}
