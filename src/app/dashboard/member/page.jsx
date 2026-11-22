import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '../../account-panel'
import ArtworkFavorite from '../../artwork-favorite'
import { getMemberArtworks, getMemberFavorites } from '../../../lib/artworks'
import { getMemberChallengeSubmissions } from '@/lib/challenges'
import { requireUser } from '../../../lib/session'
import ActionForm from '../action-form'
import ArtworkDelete from './artwork-delete'
import { applyForCurator } from './curator-application'
import styles from './member-artworks.module.css'

export const metadata = { title: 'Dashboard Member | ALTERIA' }

const notices = new Map([
  ['diunggah', 'Karya berhasil diunggah.'],
  ['diedit', 'Perubahan karya berhasil disimpan.'],
  ['dihapus', 'Karya berhasil dihapus.'],
])

function CuratorApplication({ status }) {
  const isRejected = status === 'rejected'

  return (
    <section className={styles.section} aria-labelledby="akses-curator">
      <header className={styles.sectionHeader}>
        <h2 id="akses-curator">Akses Curator</h2>
      </header>
      {status === null && (
        <p className={styles.hint}>Ajukan akses untuk membuat challenge dan meninjau karya peserta.</p>
      )}
      {status === 'pending' && (
        <p className={styles.notice} role="status">Pengajuanmu sedang ditinjau Admin.</p>
      )}
      {isRejected && (
        <p className={styles.error}>Pengajuanmu ditolak. Kamu bisa mengajukan lagi.</p>
      )}
      {(status === null || isRejected) && (
        <ActionForm
          action={applyForCurator.bind(null, status)}
          submitLabel={isRejected ? 'Ajukan ulang akses Curator' : 'Ajukan akses Curator'}
        />
      )}
      {status === 'approved' && (
        <Link className={styles.primaryButton} href="/dashboard/curator">Buka Dashboard Curator</Link>
      )}
    </section>
  )
}

function ArtworkCards({ artworks, saved = false }) {
  return (
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
              {saved ? <ArtworkFavorite artwork={artwork} variant="dashboard" /> : (
                <>
                  <Link
                    href={`/dashboard/member/karya/${artwork.id}/edit`}
                    aria-label={`Edit ${artwork.title}`}
                  >
                    Edit
                  </Link>
                  <ArtworkDelete id={artwork.id} title={artwork.title} />
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function MemberDashboard({ searchParams }) {
  const user = await requireUser('member')
  const notice = notices.get((await searchParams)?.hasil)
  const [artworks, favorites, submissions] = await Promise.all([
    getMemberArtworks(user.id).catch(error => {
      console.error('Karya Member gagal dimuat.', error.code ?? error.name)
      return null
    }),
    getMemberFavorites(user.id).catch(error => {
      console.error('Karya favorit gagal dimuat.', error.code ?? error.name)
      return null
    }),
    getMemberChallengeSubmissions(user.id),
  ])

  return (
    <AccountPanel title="Dashboard Member" description={`Halo, ${user.display_name}.`} wide>
      <div className={styles.formActions}>
        <Link href="/dashboard/member/profil">Edit profil dan akun</Link>
      </div>
      <CuratorApplication status={user.curator_status} />
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

        {artworks?.length > 0 && <ArtworkCards artworks={artworks} />}
      </section>

      <section className={styles.section} aria-labelledby="karya-favorit">
        <header className={styles.sectionHeader}>
          <h2 id="karya-favorit">Karya Favorit</h2>
        </header>

        {favorites === null && <p className={styles.error} role="alert">Karya favorit belum bisa dimuat.</p>}
        {favorites && <p className="sr-only" role="status">{favorites.length} karya favorit</p>}
        {favorites?.length === 0 && (
          <p className={styles.empty}>Belum ada karya favorit. <Link href="/galeri">Jelajahi galeri</Link>.</p>
        )}
        {favorites?.length > 0 && <ArtworkCards artworks={favorites} saved />}
      </section>
      <section className={styles.section} aria-labelledby="submisi-member">
        <header className={styles.sectionHeader}><h2 id="submisi-member">Submisi Challenge</h2></header>
        {submissions.length === 0 ? (
          <p className={styles.empty}>Belum ada karya yang dikirim. <Link href="/challenge">Lihat challenge</Link>.</p>
        ) : (
          <ul className={styles.artworks}>
            {submissions.map(item => (
              <li key={item.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <p>{item.withdrawn ? 'Ditarik' : item.rank ? `Juara ${item.rank}` : `Tenggat ${item.deadlineLabel}`}</p>
                  <h3>{item.title}</h3>
                  <div className={styles.cardActions}><Link href={`/challenge/${item.challengeId}`}>{item.challengeTitle}</Link></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountPanel>
  )
}
