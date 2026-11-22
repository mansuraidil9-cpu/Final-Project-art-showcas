'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db.mjs'
import { requireUser } from '@/lib/session'

export async function applyForCurator(expectedStatus) {
  const user = await requireUser('member')

  try {
    await pool.query(
      `UPDATE users
       SET curator_status = 'pending', curator_applied_at = clock_timestamp()
       WHERE id = $1 AND role = 'member'
         AND (curator_status IS NULL OR curator_status = 'rejected')
         AND curator_status IS NOT DISTINCT FROM $2`,
      [user.id, expectedStatus],
    )
  } catch (error) {
    console.error('Pengajuan akses Curator gagal', error.code ?? error.name)
    return { error: 'Pengajuan belum terkirim. Coba lagi sebentar.' }
  }

  revalidatePath('/dashboard/member')
  revalidatePath('/dashboard/admin')
  return null
}
