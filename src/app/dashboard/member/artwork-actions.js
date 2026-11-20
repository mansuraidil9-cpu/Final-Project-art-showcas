'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  maxArtworkDescriptionLength,
  maxArtworkTitleLength,
} from '../../../lib/artwork-fields'
import { createMemberArtwork, deleteMemberArtwork, updateMemberArtwork } from '../../../lib/artworks'
import { getArtworkCategories } from '../../../lib/categories'
import { readText } from '../../../lib/form-fields'
import { readImageUpload } from '../../../lib/uploads'
import { isDatabaseId } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'

function refreshArtworkPages(id, ownerId) {
  revalidatePath('/')
  revalidatePath('/galeri')
  revalidatePath(`/karya/${id}`)
  revalidatePath('/dashboard/member')
  revalidatePath(`/kreator/${ownerId}`)
  revalidatePath('/challenge/[id]', 'page')
  revalidatePath('/dashboard/curator/challenge/[id]', 'page')
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/moderasi')
}

export async function saveArtwork(id, _previousState, formData) {
  const user = await requireUser('member')
  const creating = id === null

  if (!creating && !isDatabaseId(id)) return { error: 'Karya tidak ditemukan.' }

  const title = readText(formData, 'title')
  const description = readText(formData, 'description')
  const category = readText(formData, 'category')
  const tags = [...new Set(readText(formData, 'tags').split(',').map(tag => tag.trim()).filter(Boolean))]

  if (!title || title.length > maxArtworkTitleLength) {
    return { error: `Isi judul karya dengan maksimal ${maxArtworkTitleLength} karakter.` }
  }
  if (!description || description.length > maxArtworkDescriptionLength) {
    return { error: `Isi deskripsi dengan maksimal ${maxArtworkDescriptionLength} karakter.` }
  }
  if (!tags.length || tags.length > 10 || tags.some(tag => tag.length > 32)) {
    return { error: 'Isi 1–10 tag, maksimal 32 karakter per tag, dipisahkan dengan koma.' }
  }

  let image
  if (creating) {
    const upload = await readImageUpload(formData, 'image', 'karya', { required: true })
    if (upload.error) return { error: upload.error }
    image = upload.image
  }

  const fields = { title, description, category, tags }
  let savedId
  try {
    const categories = await getArtworkCategories()
    if (!categories.includes(category)) return { error: 'Pilih kategori karya yang tersedia.' }
    savedId = creating
      ? await createMemberArtwork(user.id, fields, image)
      : await updateMemberArtwork(id, user.id, fields)
  } catch (error) {
    if (error.constraint === 'artworks_category_fkey') return { error: 'Kategori sudah berubah. Muat ulang halaman.' }
    console.error('Karya gagal disimpan.', error.code ?? error.name)
    return { error: 'Karya belum bisa disimpan. Coba lagi.' }
  }

  if (!savedId) return { error: 'Karya tidak ditemukan atau tidak bisa disimpan.' }

  refreshArtworkPages(savedId, user.id)
  redirect(creating ? '/dashboard/member?hasil=diunggah' : '/dashboard/member?hasil=diedit')
}

export async function deleteArtwork(id) {
  const user = await requireUser('member')
  if (!isDatabaseId(id)) return { error: 'Karya tidak ditemukan.' }

  try {
    if (!await deleteMemberArtwork(id, user.id)) return { error: 'Karya tidak ditemukan atau tidak bisa dihapus.' }
  } catch (error) {
    console.error('Karya gagal dihapus.', error.code ?? error.name)
    return { error: 'Karya belum bisa dihapus. Coba lagi.' }
  }

  refreshArtworkPages(id, user.id)
  redirect('/dashboard/member?hasil=dihapus')
}
