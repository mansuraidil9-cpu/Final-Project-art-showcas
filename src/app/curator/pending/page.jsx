import { redirect } from 'next/navigation'
import AccountPanel from '../../account-panel'
import { deleteRejectedCurator } from '../../auth-actions'
import { dashboardPath, requireUser } from '../../../lib/session'
import styles from '../../auth.module.css'

export default async function CuratorPending() {
  const user = await requireUser()
  if (user.role !== 'curator' || user.curator_status === 'approved') {
    redirect(dashboardPath(user))
  }

  if (user.curator_status === 'rejected') {
    return (
      <AccountPanel title="Pendaftaran ditolak" description="Admin menolak pendaftaran Curator Anda.">
        <form action={deleteRejectedCurator} className={styles.form}>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirmed" value="yes" required />
            Saya paham penghapusan akun ini bersifat permanen.
          </label>
          <button className={`${styles.submit} ${styles.delete}`} type="submit">Hapus akun</button>
        </form>
      </AccountPanel>
    )
  }

  return (
    <AccountPanel
      title="Akun Anda sedang ditinjau"
      description="Anda bisa membuka dashboard Curator setelah Admin menyetujui akun ini."
    />
  )
}
