'use server'

import { submitChallengeArtwork, withdrawChallengeSubmission } from '@/lib/challenges'
import { isDatabaseId } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { requireUser } from '@/lib/session'
import { refreshChallengePages } from './revalidate-challenge'

export async function submitArtwork(id, _previous, formData) {
  const user = await requireUser('member')
  const artworkId = readText(formData, 'artworkId')
  if (!isDatabaseId(id) || !isDatabaseId(artworkId)) return { error: 'Pilih karya yang ingin diikutkan.' }

  try {
    if (!await submitChallengeArtwork(id, user.id, artworkId)) {
      return { error: 'Pengiriman ditolak. Challenge harus aktif dan kamu hanya bisa mengirim satu karya milikmu.' }
    }
  } catch (error) {
    console.error('Submisi gagal disimpan.', error.code ?? error.name)
    return { error: 'Karya belum bisa dikirim. Coba lagi.' }
  }
  refreshChallengePages(id)
  return null
}

export async function withdrawArtwork(id) {
  const user = await requireUser('member')
  if (!isDatabaseId(id)) return { error: 'Challenge tidak ditemukan.' }

  try {
    if (!await withdrawChallengeSubmission(id, user.id)) {
      return { error: 'Submisi hanya bisa ditarik sebelum tenggat.' }
    }
  } catch (error) {
    console.error('Submisi gagal ditarik.', error.code ?? error.name)
    return { error: 'Submisi belum bisa ditarik. Coba lagi.' }
  }
  refreshChallengePages(id)
  return null
}
