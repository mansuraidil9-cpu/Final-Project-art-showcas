'use server'

import { revalidatePath } from 'next/cache'
import { setArtworkLike } from '../lib/artworks'
import { isDatabaseId } from '../lib/db.mjs'
import { requireUser } from '../lib/session'

export async function updateArtworkLike(id, liked) {
  const user = await requireUser()
  if (!isDatabaseId(id) || typeof liked !== 'boolean') return { error: 'Karya tidak ditemukan.' }

  try {
    await setArtworkLike(id, user.id, liked)
  } catch (error) {
    console.error('Suka karya gagal disimpan.', error.code ?? error.name)
    return { error: 'Gagal menyimpan suka. Coba lagi.' }
  }

  revalidatePath('/')
  revalidatePath('/galeri')
  revalidatePath(`/karya/${id}`)
  return null
}
