import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getArtworkById } from '../../../lib/artworks'
import { getCurrentUser } from '../../../lib/session'
import ArtworkLike from '../../artwork-like'
import homeStyles from '../../home.module.css'
import ShowcaseDetail from '../../showcase-detail'
import styles from './artwork.module.css'

export const metadata = { title: 'Detail Karya | ALTERIA' }

const uploadDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Makassar',
})
export default async function DetailKarya({ params }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()])
  const artwork = await getArtworkById(id, user?.id)

  if (!artwork) notFound()

  return (
    <ShowcaseDetail backHref="/galeri" backLabel="Kembali ke Galeri">
      <article className={styles.layout} aria-labelledby="judul-karya">
        <header className={styles.heading}>
          <p className={homeStyles.eyebrow}>{artwork.category}</p>
          <h1 id="judul-karya">{artwork.title}</h1>
          <p className={styles.byline}>{artwork.artist}{artwork.date && ` · ${artwork.date}`}</p>
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
          {(artwork.rights || artwork.sourceUrl) && (
            <figcaption className={styles.credit}>
              {artwork.rights && <span>{artwork.rights}</span>}
              {artwork.sourceUrl && <a href={artwork.sourceUrl}>Sumber karya</a>}
            </figcaption>
          )}
        </figure>

        <div className={styles.details}>
          <p className={styles.description}>{artwork.description}</p>

          {artwork.tags.length > 0 && (
            <ul className={styles.tags} aria-label="Tag karya">
              {[...new Set(artwork.tags)].map(tag => <li key={tag}>{tag}</li>)}
            </ul>
          )}

          <dl className={styles.metadata}>
            <div>
              <dt className={homeStyles.eyebrow}>Diunggah</dt>
              <dd><time dateTime={artwork.uploadedAt}>{uploadDate.format(new Date(artwork.uploadedAt))}</time></dd>
            </div>
            <div>
              <dt className={homeStyles.eyebrow}>Suka</dt>
              <dd><ArtworkLike artwork={artwork} canLike={Boolean(user)} /></dd>
            </div>
          </dl>
        </div>
      </article>
    </ShowcaseDetail>
  )
}
