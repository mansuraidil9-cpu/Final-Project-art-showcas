'use server'

import { revalidatePath } from 'next/cache'
import { isDatabaseId, pool } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'

export async function reviewCurator(_previous, formData) {
  await requireUser('admin')

  if (!(formData instanceof FormData)) {
    return { error: true, text: 'Permintaan verifikasi tidak valid.' }
  }

  const id = formData.get('userId')
  const decision = formData.get('decision')
  const applicationVersion = formData.get('applicationVersion')

  if (
    !isDatabaseId(id) ||
    typeof applicationVersion !== 'string' ||
    (decision !== 'approved' && decision !== 'rejected')
  ) {
    return { error: true, text: 'Permintaan verifikasi tidak valid.' }
  }

  let rowCount
  try {
    const result = await pool.query(
      `UPDATE users
       SET curator_status = $1
       WHERE id = $2 AND role IN ('member', 'curator') AND curator_status = 'pending'
         AND curator_applied_at::text IS NOT DISTINCT FROM NULLIF($3, '')`,
      [decision, id, applicationVersion],
    )
    rowCount = result.rowCount
  } catch (error) {
    console.error('Verifikasi Curator gagal', error.code ?? error.name)
    return { error: true, text: 'Keputusan belum tersimpan. Coba lagi sebentar.' }
  }

  revalidatePath('/', 'layout')
  if (rowCount === 0) return { error: true, text: 'Pengajuan ini sudah berubah atau sudah diproses.' }

  return {
    error: false,
    text: decision === 'approved' ? 'Pengajuan Curator disetujui.' : 'Pengajuan Curator ditolak.',
  }
}
