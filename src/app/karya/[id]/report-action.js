'use server'

import { revalidatePath } from 'next/cache'
import { isDatabaseId } from '@/lib/db.mjs'
import { readText } from '@/lib/form-fields'
import { buildReportReason } from '@/lib/report-options.mjs'
import { createArtworkReport } from '@/lib/reports'
import { requireUser } from '@/lib/session'

async function saveReport(id, reason) {
  const user = await requireUser('member')
  if (!isDatabaseId(id) || !reason || reason.length > 500 || reason.includes('\0')) {
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
  revalidatePath('/galeri')
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/moderasi')
  return { success: true }
}

export async function reportArtwork(id, _previous, formData) {
  const result = await saveReport(id, readText(formData, 'reason'))
  return result?.success ? null : result
}

export async function reportArtworkFromMenu(id, _previous, formData) {
  const reason = buildReportReason(readText(formData, 'reportType'), readText(formData, 'details'))
  if (!reason) {
    return { error: 'Pilih alasan laporan. Untuk alasan lainnya, tulis minimal 5 karakter (maksimal 300).' }
  }
  return saveReport(id, reason)
}
