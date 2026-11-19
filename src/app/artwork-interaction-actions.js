'use server'

import { revalidatePath } from 'next/cache'
import { maxArtworkCommentLength } from '../lib/artwork-fields'
import {
  addArtworkComment,
  deleteArtworkComment,
  setArtworkFavorite,
  setArtworkLike,
} from '../lib/artworks'
import { requireUser } from '../lib/session'

export async function setLike(artworkId, desired) {
  const user = await requireUser('member')

  try {
    if (!await setArtworkLike(artworkId, user.id, desired)) {
      return { error: 'Suka tidak tersedia untuk karya ini.' }
    }
  } catch (error) {
    console.error('Suka gagal diperbarui.', error.code ?? error.name)
    return { error: 'Suka belum bisa diperbarui. Coba lagi.' }
  }

  revalidatePath('/')
  revalidatePath('/galeri')
  revalidatePath(`/karya/${artworkId}`)
  return null
}

export async function setFavorite(artworkId, desired) {
  const user = await requireUser('member')

  try {
    if (!await setArtworkFavorite(artworkId, user.id, desired)) {
      return { error: 'Karya ini tidak bisa disimpan ke Favorit.' }
    }
  } catch (error) {
    console.error('Favorit gagal diperbarui.', error.code ?? error.name)
    return { error: 'Favorit belum bisa diperbarui. Coba lagi.' }
  }

  revalidatePath('/')
  revalidatePath('/galeri')
  revalidatePath(`/karya/${artworkId}`)
  revalidatePath('/dashboard/member')
  return null
}

export async function addComment(artworkId, formData) {
  const user = await requireUser('member')
  const field = formData.get('body')
  const body = typeof field === 'string' ? field.trim() : ''

  if (!body) return { error: 'Tulis komentar terlebih dahulu.' }
  if ([...body].length > maxArtworkCommentLength) {
    return { error: 'Komentar maksimal 1.000 karakter.' }
  }
  if (body.includes('\0')) return { error: 'Komentar berisi karakter yang tidak didukung.' }

  try {
    if (!await addArtworkComment(artworkId, user.id, body)) {
      return { error: 'Karya ini tidak bisa dikomentari.' }
    }
  } catch (error) {
    console.error('Komentar gagal dikirim.', error.code ?? error.name)
    return { error: 'Komentar belum terkirim. Coba lagi.' }
  }

  revalidatePath(`/karya/${artworkId}`)
  return null
}

export async function deleteComment(artworkId, commentId) {
  const user = await requireUser('member')

  try {
    if (!await deleteArtworkComment(artworkId, commentId, user.id)) {
      return { error: 'Komentar ini tidak bisa dihapus.' }
    }
  } catch (error) {
    console.error('Komentar gagal dihapus.', error.code ?? error.name)
    return { error: 'Komentar belum bisa dihapus. Coba lagi.' }
  }

  revalidatePath(`/karya/${artworkId}`)
  return null
}
