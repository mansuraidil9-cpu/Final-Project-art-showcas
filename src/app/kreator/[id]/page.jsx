import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMemberArtworks, getPublicCreator } from '../../../lib/artworks'
import { roleLabels } from '../../../lib/user-roles'
import homeStyles from '../../home.module.css'
import ShowcaseDetail from '../../showcase-detail'
import styles from './profile.module.css'

export const metadata = { title: 'Profil Kreator | ALTERIA' }

export default async function ProfilKreator({ params }) {
  const { id } = await params
  const creator = await getPublicCreator(id)
  if (!creator) notFound()

  const artworks = await getMemberArtworks(creator.id)

  return (
    <ShowcaseDetail backHref="/galeri" backLabel="Kembali ke Galeri" showFooter>
      <div className={homeStyles.standalone}>
        <header className={styles.identity}>
          {creator.hasAvatar && (
            <Image className={styles.avatar} src={`/media/profil/${id}`} alt={`Foto profil ${creator.displayName}`} width={112} height={112} unoptimized />
          )}
          <div className={styles.profileCopy}>
            <p className={homeStyles.eyebrow}>{roleLabels[creator.role]}</p>
            <h1 className={homeStyles.pageTitle}>{creator.displayName}</h1>
            {creator.bio && <p className={styles.bio}>{creator.bio}</p>}
            {creator.links.length > 0 && (
              <ul className={styles.externalLinks} aria-label="Tautan kreator">
                {creator.links.map(link => <li key={link}><a className={homeStyles.textLink} href={link}>{new URL(link).hostname}</a></li>)}
              </ul>
            )}
          </div>
        </header>

        <section className={styles.portfolio} aria-labelledby="judul-karya-kreator">
          <h2 id="judul-karya-kreator">Karya</h2>
          {artworks.length === 0 ? (
            <p className={homeStyles.emptyGallery}>Belum ada karya yang dipublikasikan.</p>
          ) : (
            <ul className={homeStyles.artworks}>
              {artworks.map(artwork => (
                <li className={styles.work} key={artwork.id}>
                  <Link className={homeStyles.artworkLink} href={`/karya/${artwork.id}`}>
                    <div className={homeStyles.artworkImage}>
                      <Image
                        src={artwork.imageSrc}
                        alt=""
                        fill
                        unoptimized={artwork.isUploaded}
                        sizes="(max-width: 500px) 94vw, (max-width: 900px) 48vw, 32vw"
                      />
                    </div>
                    <div className={homeStyles.artworkCaption}>
                      <div>
                        <p className={homeStyles.artworkCategory}>{artwork.category}</p>
                        <h3 className={homeStyles.artworkTitle}>{artwork.title}</h3>
                      </div>
                      <span className={`${homeStyles.arrow} ${homeStyles.arrowOut}`} aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ShowcaseDetail>
  )
}
