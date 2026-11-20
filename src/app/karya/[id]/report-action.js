'use server'

import { revalidatePath } from 'next/cache'
import { isDatabaseId } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { createArtworkReport } from '@/lib/reports'
import { requireUser } from '@/lib/session'

export async function reportArtwork(id, _previous, formData) {
  const user = await requireUser('member')
  const reason = readText(formData, 'reason')
  if (!isDatabaseId(id) || !reason || reason.length > 500) {
    return { error: 'Isi alasan laporan dengan maksimal 500 karakter.' }
  }

  try {
    if (!await createArtworkReport(id, user.id, reason)) {
      return { error: 'Karya ini sudah kamu laporkan atau tidak dapat dilaporkan.' }
    }
  } catch (error) {
    console.error('Laporan gagal disimpan.', error.code ?? error.name)
    return { error: 'Laporan belum bisa dikirim. Coba lagi.' }
  }
  revalidatePath(`/karya/${id}`)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/moderasi')
  return null
}
