'use server'

import { revalidatePath } from 'next/cache'
import { isDatabaseId } from '@/lib/db.mjs'
import { resolveArtworkReports } from '@/lib/reports'
import { requireUser } from '@/lib/session'

export async function moderateReports(id, decision, _previous, formData) {
  await requireUser('admin')
  if (!isDatabaseId(id) || !['dismiss', 'remove'].includes(decision)) return { error: 'Keputusan moderasi tidak valid.' }
  if (decision === 'remove' && formData.get('confirmed') !== 'yes') return { error: 'Konfirmasi penghapusan karya.' }

  try {
    if (!await resolveArtworkReports(id, decision === 'remove')) return { error: 'Laporan sudah diproses.' }
  } catch (error) {
    console.error('Moderasi laporan gagal.', error.code ?? error.name)
    return { error: 'Keputusan belum bisa disimpan. Coba lagi.' }
  }
  revalidatePath('/', 'layout')
  return null
}
