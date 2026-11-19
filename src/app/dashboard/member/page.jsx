import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '../../account-panel'
import { getMemberArtworks } from '../../../lib/artworks'
import { requireUser } from '../../../lib/session'
import ArtworkDelete from './artwork-delete'
import styles from './member-artworks.module.css'

export const metadata = { title: 'Dashboard Member | ALTERIA' }

const notices = new Map([
  ['diunggah', 'Karya berhasil diunggah.'],
  ['diedit', 'Perubahan karya berhasil disimpan.'],
  ['dihapus', 'Karya berhasil dihapus.'],
])

export default async function MemberDashboard({ searchParams }) {
  const user = await requireUser('member')
  const notice = notices.get((await searchParams)?.hasil)
  const artworks = await getMemberArtworks(user.id).catch(error => {
    console.error('Karya Member gagal dimuat.', error.code ?? error.name)
    return null
  })

  return (
    <AccountPanel title="Dashboard Member" description={`Halo, ${user.display_name}.`} wide>
      <section className={styles.section} aria-labelledby="kelola-karya">
        <header className={styles.sectionHeader}>
          <h2 id="kelola-karya">Kelola Karya</h2>
          <Link className={styles.primaryButton} href="/dashboard/member/karya/baru">
            Unggah karya
          </Link>
        </header>

        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {artworks === null && <p className={styles.error} role="alert">Karya belum bisa dimuat.</p>}
        {artworks?.length === 0 && (
          <p className={styles.empty}>Belum ada karya di galeri. Unggah karya pertamamu.</p>
        )}

        {artworks?.length > 0 && (
          <ul className={styles.artworks}>
            {artworks.map(artwork => (
              <li className={styles.card} key={artwork.id}>
                <div className={styles.thumbnail}>
                  <Image
                    src={artwork.imageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 575px) 92vw, (max-width: 850px) 46vw, 18rem"
                    unoptimized={artwork.isUploaded}
                  />
                </div>
                <div className={styles.cardBody}>
                  <p>{artwork.category}</p>
                  <h3>{artwork.title}</h3>
                  <div className={styles.cardActions}>
                    <Link href={`/karya/${artwork.id}`} aria-label={`Lihat ${artwork.title}`}>
                      Lihat
                    </Link>
                    <Link
                      href={`/dashboard/member/karya/${artwork.id}/edit`}
                      aria-label={`Edit ${artwork.title}`}
                    >
                      Edit
                    </Link>
                    <ArtworkDelete id={artwork.id} title={artwork.title} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountPanel>
  )
}
