'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'

export async function reviewCurator(_previous, formData) {
  await requireUser('admin')

  const id = formData instanceof FormData ? formData.get('userId') : null
  const decision = formData instanceof FormData ? formData.get('decision') : null

  if (
    typeof id !== 'string' ||
    !/^[1-9]\d{0,18}$/.test(id) ||
    BigInt(id) > 9223372036854775807n ||
    (decision !== 'approved' && decision !== 'rejected')
  ) {
    return { error: true, text: 'Permintaan verifikasi tidak valid.' }
  }

  let rowCount
  try {
    const result = await pool.query(
      `UPDATE users
       SET curator_status = $1
       WHERE id = $2 AND role = 'curator' AND curator_status = 'pending'`,
      [decision, id],
    )
    rowCount = result.rowCount
  } catch (error) {
    console.error('Verifikasi Curator gagal', error.code ?? error.name)
    return { error: true, text: 'Keputusan belum tersimpan. Coba lagi sebentar.' }
  }

  revalidatePath('/dashboard/admin')
  if (rowCount === 0) return { error: true, text: 'Pendaftaran ini sudah diproses atau sudah dihapus.' }

  return {
    error: false,
    text: decision === 'approved' ? 'Pendaftaran Curator disetujui.' : 'Pendaftaran Curator ditolak.',
  }
}
