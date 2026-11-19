'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sharp from 'sharp'
import {
  artworkCategories,
  maxArtworkDescriptionLength,
  maxArtworkImageBytes,
  maxArtworkTitleLength,
} from '../../../lib/artwork-fields'
import { createMemberArtwork, deleteMemberArtwork, updateMemberArtwork } from '../../../lib/artworks'
import { isDatabaseId } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'

const uploadFormats = new Set(['jpeg', 'png', 'webp'])

function readText(formData, key) {
  const value = formData.get(key)
  return typeof value === 'string' && !value.includes('\0') ? value.trim() : ''
}

async function normalizeImage(file) {
  const image = sharp(Buffer.from(await file.arrayBuffer()), {
    failOn: 'error',
    limitInputPixels: 24_000_000,
  })

  const metadata = await image.metadata()
  if (!uploadFormats.has(metadata.format) || metadata.pages > 1) {
    throw new Error('Format gambar tidak didukung.')
  }

  const { data, info } = await image
    .rotate()
    .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true })

  return { src: `/media/karya/${randomUUID()}.webp`, data, width: info.width, height: info.height }
}

function refreshArtworkPages(id) {
  revalidatePath('/')
  revalidatePath('/galeri')
  revalidatePath(`/karya/${id}`)
  revalidatePath('/dashboard/member')
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
  if (!artworkCategories.includes(category)) return { error: 'Pilih kategori karya yang tersedia.' }
  if (!tags.length || tags.length > 10 || tags.some(tag => tag.length > 32)) {
    return { error: 'Isi 1–10 tag, maksimal 32 karakter per tag, dipisahkan dengan koma.' }
  }

  let image
  if (creating) {
    const file = formData.get('image')
    if (!(file instanceof File) || file.size === 0) return { error: 'Pilih gambar karya.' }
    if (file.size > maxArtworkImageBytes) return { error: 'Ukuran gambar maksimal 5 MB.' }

    try {
      image = await normalizeImage(file)
    } catch {
      return { error: 'Pilih gambar JPEG, PNG, atau WebP yang bisa dibuka dan berukuran maksimal 24 megapiksel.' }
    }
  }

  const fields = { title, description, category, tags }
  let savedId
  try {
    savedId = creating
      ? await createMemberArtwork(user.id, fields, image)
      : await updateMemberArtwork(id, user.id, fields)
  } catch (error) {
    console.error('Karya gagal disimpan.', error.code ?? error.name)
    return { error: 'Karya belum bisa disimpan. Coba lagi.' }
  }

  if (!savedId) return { error: 'Karya tidak ditemukan atau tidak bisa disimpan.' }

  refreshArtworkPages(savedId)
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

  refreshArtworkPages(id)
  redirect('/dashboard/member?hasil=dihapus')
}
