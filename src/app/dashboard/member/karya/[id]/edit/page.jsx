import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccountPanel from '@/app/account-panel'
import { getMemberArtwork } from '@/lib/artworks'
import { requireUser } from '@/lib/session'
import ArtworkForm from '../../../artwork-form'
import styles from '../../../member-artworks.module.css'

export const metadata = { title: 'Edit Karya | ALTERIA' }

export default async function EditArtworkPage({ params }) {
  const user = await requireUser('member')
  const { id } = await params
  const artwork = await getMemberArtwork(id, user.id).catch(error => {
    console.error('Karya Member gagal dimuat.', error.code ?? error.name)
    return undefined
  })

  if (artwork === null) notFound()

  return (
    <AccountPanel title="Edit Karya" description="Perbarui informasi karya di galeri." wide>
      {artwork ? <ArtworkForm artwork={artwork} /> : (
        <div className={styles.form}>
          <p className={styles.error} role="alert">Karya belum bisa dimuat.</p>
          <div className={styles.formActions}>
            <Link href="/dashboard/member">Kembali ke Kelola Karya</Link>
          </div>
        </div>
      )}
    </AccountPanel>
  )
}
