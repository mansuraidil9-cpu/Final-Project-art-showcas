import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import styles from '@/app/dashboard/member/member-artworks.module.css'
import { getPendingArtworkReports } from '@/lib/reports'
import { requireUser } from '@/lib/session'
import { moderateReports } from './report-actions'

export default async function ModerationPage() {
  await requireUser('admin')
  const queue = await getPendingArtworkReports()

  return (
    <AccountPanel title="Moderasi Karya" wide>
      <div className={styles.formActions}><Link href="/dashboard/admin">Kembali ke Dashboard Admin</Link></div>
      {queue.length === 0 ? <p className={styles.empty}>Tidak ada laporan yang menunggu.</p> : (
        <ul className={styles.artworks}>
          {queue.map(item => (
            <li key={item.id} className={`${styles.card} ${styles.cardBody} grid gap-3`}>
              <div>
                <p className={styles.hint}>{item.total} laporan · {item.artist}</p>
                <h3>{item.title}</h3>
                <div className={styles.cardActions}><Link href={`/karya/${item.id}`}>Tinjau karya</Link></div>
              </div>
              <ul aria-label="Alasan laporan" className="list-disc ps-5 text-sm">
                {item.reports.map(report => <li key={report.id}>{report.reason}</li>)}
              </ul>
              <ActionForm action={moderateReports.bind(null, item.id, 'dismiss')} submitLabel="Tolak laporan" />
              <details className="text-sm">
                <summary className={styles.deleteLink}>Hapus karya</summary>
                <ActionForm action={moderateReports.bind(null, item.id, 'remove')} submitLabel="Hapus karya ini" danger>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" name="confirmed" value="yes" required />
                    Saya telah meninjau dan ingin menghapus karya ini.
                  </label>
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
      )}
    </AccountPanel>
  )
}
