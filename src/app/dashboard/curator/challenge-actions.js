'use server'

import { redirect } from 'next/navigation'
import {
  createCuratorChallenge, deleteCuratorChallenge, publishChallengeWinners, updateCuratorChallenge,
} from '@/lib/challenges'
import { parseChallengeDateInput } from '@/lib/challenge-dates'
import { isDatabaseId } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { requireUser } from '@/lib/session'
import { readImageUpload } from '@/lib/uploads'
import { refreshChallengePages } from '@/app/challenge/revalidate-challenge'

export async function saveChallenge(id, _previous, formData) {
  const user = await requireUser('curator')
  const creating = id === null
  if (!creating && !isDatabaseId(id)) return { error: 'Challenge tidak ditemukan.' }

  const title = readText(formData, 'title')
  const description = readText(formData, 'description')
  const rules = readText(formData, 'rules').split(/\r?\n/).map(rule => rule.trim()).filter(Boolean)
  const prize = readText(formData, 'prize')
  const startsAt = parseChallengeDateInput(readText(formData, 'startsAt'))
  const endsAt = parseChallengeDateInput(readText(formData, 'endsAt'))

  if (!title || !description || !rules.length || !prize) return { error: 'Isi judul, deskripsi, aturan, dan hadiah.' }
  if (title.length > 120 || description.length > 2000 || rules.join('\n').length > 3000 || prize.length > 1000) {
    return { error: 'Periksa batas panjang judul, deskripsi, aturan, dan hadiah.' }
  }
  if (!startsAt || !endsAt || endsAt <= startsAt) {
    return { error: 'Tanggal selesai harus setelah tanggal mulai. Gunakan waktu WITA.' }
  }
  const { image, error: imageError } = await readImageUpload(formData, 'banner', 'challenge', { required: creating })
  if (imageError) return { error: imageError }

  const fields = { title, description, rules, prize, startsAt, endsAt }
  let savedId
  try {
    savedId = creating
      ? await createCuratorChallenge(user.id, fields, image)
      : await updateCuratorChallenge(id, user.id, fields, image) ? id : null
  } catch (error) {
    console.error('Challenge gagal disimpan.', error.code ?? error.name)
    return { error: 'Challenge belum bisa disimpan. Coba lagi.' }
  }
  if (!savedId) return { error: 'Challenge tidak bisa disimpan. Perubahan terkunci setelah hasil juara diumumkan.' }

  refreshChallengePages(savedId)
  redirect(`/dashboard/curator?hasil=${creating ? 'dibuat' : 'diedit'}`)
}

export async function removeChallenge(id, _previous, formData) {
  const user = await requireUser('curator')
  if (!isDatabaseId(id) || formData.get('confirmed') !== 'yes') return { error: 'Konfirmasi penghapusan terlebih dahulu.' }

  try {
    if (!await deleteCuratorChallenge(id, user.id)) {
      return { error: 'Challenge tidak ditemukan atau hasil juaranya sudah diumumkan dan terkunci.' }
    }
  } catch (error) {
    console.error('Challenge gagal dihapus.', error.code ?? error.name)
    return { error: 'Challenge belum bisa dihapus. Coba lagi.' }
  }
  refreshChallengePages(id)
  redirect('/dashboard/curator?hasil=dihapus')
}

export async function announceWinners(id, _previous, formData) {
  const user = await requireUser('curator')
  if (!isDatabaseId(id)) return { error: 'Challenge tidak ditemukan.' }

  const winners = [1, 2, 3]
    .map(rank => ({ rank, submissionId: readText(formData, `rank-${rank}`) }))
    .filter(winner => winner.submissionId)

  try {
    if (!await publishChallengeWinners(id, user.id, winners)) {
      return { error: 'Pilih minimal satu karya berbeda setelah tenggat. Pengumuman juara hanya dapat dilakukan sekali.' }
    }
  } catch (error) {
    console.error('Pemenang gagal diumumkan.', error.code ?? error.name)
    return { error: 'Pemenang belum bisa diumumkan. Coba lagi.' }
  }
  refreshChallengePages(id)
  return { success: 'Pemenang sudah tampil di halaman publik Challenge.' }
}
