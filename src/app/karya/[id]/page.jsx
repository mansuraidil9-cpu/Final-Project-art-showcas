import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getArtworkById, getArtworkComments } from '../../../lib/artworks'
import ActionForm from '@/app/dashboard/action-form'
import fieldStyles from '@/app/dashboard/member/member-artworks.module.css'
import { hasArtworkReport } from '@/lib/reports'
import { getCurrentUser } from '../../../lib/session'
import ArtworkByline from '../../artwork-byline'
import ArtworkFavorite from '../../artwork-favorite'
import ArtworkLike from '../../artwork-like'
import homeStyles from '../../home.module.css'
import ShowcaseDetail from '../../showcase-detail'
import ArtworkComments from './artwork-comments'
import ArtworkReportDetails from './artwork-report-details'
import { reportArtwork } from './report-action'
import styles from './artwork.module.css'

export const metadata = { title: 'Detail Karya | ALTERIA' }

const uploadDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Makassar',
})

export default async function DetailKarya({ params }) {
  const { id } = await params
  const user = await getCurrentUser()
  const memberId = user?.role === 'member' ? user.id : null
  const artwork = await getArtworkById(id, memberId)

  if (!artwork) notFound()

  const canInteract = memberId !== null && !artwork.isOwner
  const canReport = canInteract
  const [comments, reported] = await Promise.all([
    getArtworkComments(artwork.id, memberId),
    canReport ? hasArtworkReport(artwork.id, memberId) : false,
  ])

  return (
    <ShowcaseDetail backHref="/galeri" backLabel="Kembali ke Galeri" showFooter>
      <article className={styles.layout} aria-labelledby="judul-karya">
        <header className={styles.heading}>
          <p className={homeStyles.eyebrow}>{artwork.category}</p>
          <h1 id="judul-karya">{artwork.title}</h1>
          <ArtworkByline artwork={artwork} className={styles.byline} />
        </header>

        <figure className={styles.artwork}>
          <div className={styles.frame}>
            <Image
              src={artwork.imageSrc}
              alt={artwork.imageAlt}
              width={artwork.width}
              height={artwork.height}
              unoptimized={artwork.isUploaded}
              sizes="(max-width: 760px) 92vw, (max-width: 1480px) 54vw, 740px"
              preload
            />
          </div>
          {artwork.rights && <figcaption className={styles.credit}>{artwork.rights}</figcaption>}
        </figure>

        <div className={styles.details}>
          <p className={styles.description}>{artwork.description}</p>

          {artwork.tags.length > 0 && (
            <ul className={styles.tags} aria-label="Tag karya">
              {[...new Set(artwork.tags)].map(tag => <li key={tag}>{tag}</li>)}
            </ul>
          )}

          <div className={styles.metadata}>
            <dl className={styles.uploadDate}>
              <dt className={homeStyles.eyebrow}>Diunggah</dt>
              <dd><time dateTime={artwork.uploadedAt}>{uploadDate.format(new Date(artwork.uploadedAt))}</time></dd>
            </dl>
            <div className={styles.interactions}>
              <ArtworkLike artwork={artwork} canLike={canInteract} />
              {canInteract && <ArtworkFavorite artwork={artwork} />}
            </div>
          </div>
          {canReport && (reported ? (
            <p id="laporkan-karya" className={fieldStyles.hint + ' mt-4 scroll-mt-28'} role="status">Karya ini sudah kamu laporkan.</p>
          ) : (
            <ArtworkReportDetails>
              <summary className={fieldStyles.deleteLink}>Laporkan karya</summary>
              <ActionForm action={reportArtwork.bind(null, artwork.id)} submitLabel="Kirim laporan">
                <label className={fieldStyles.field}>
                  Alasan laporan
                  <textarea name="reason" rows={3} maxLength={500} required />
                </label>
              </ActionForm>
            </ArtworkReportDetails>
          ))}
        </div>
      </article>
      <ArtworkComments artworkId={artwork.id} comments={comments} canComment={canInteract} guest={!user} />
    </ShowcaseDetail>
  )
}
