import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { getGalleryArtworks } from '../lib/artworks'
import { getActiveChallenge } from '../lib/challenges'
import { getCurrentUser } from '../lib/session'
import GalleryExplorer from './gallery-explorer'
import ShowcaseHeader from './showcase-header'
import styles from './home.module.css'

export default async function Home() {
  await connection()
  const challengeQuery = getActiveChallenge().catch(error => {
    console.error('Challenge gagal dimuat.', error.code ?? error.name)
    return undefined
  })
  const user = await getCurrentUser()
  const canLike = user?.role === 'member'
  const [artworks, challenge] = await Promise.all([
    getGalleryArtworks(canLike ? user.id : null).catch(error => {
      console.error('Galeri gagal dimuat.', error.code ?? error.name)
      return undefined
    }),
    challengeQuery,
  ])
  return (
    <div className={styles.home} id="atas">
      <div className={styles.shell}>
        <ShowcaseHeader user={user} currentPage="home" />

        <main>
          <section className={styles.hero} aria-labelledby="judul-beranda">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Galeri seni digital</p>
              <h1 id="judul-beranda">
                Temukan Karya,<br />
                <em>Kenali Kreatornya.</em>
              </h1>
              <p className={styles.intro}>
                Jelajahi karya lintas medium dan ikuti challenge dari para kurator.
              </p>
              <a className={styles.textLink} href="#galeri">
                Jelajahi Galeri <span className={`${styles.arrow} ${styles.arrowDown}`} aria-hidden="true" />
              </a>
            </div>

            <figure className={styles.heroFigure}>
              <div className={styles.heroImage}>
                <Image
                  src="/alteria/paris-rainy-day.jpg"
                  alt="Dua orang berpayung melintasi jalan berbatu di Paris."
                  fill
                  preload
                  sizes="(max-width: 760px) 94vw, 55vw"
                />
              </div>
              <figcaption className={styles.heroCaption}>
                <cite>Paris Street; Rainy Day</cite>
                <span>Gustave Caillebotte, 1877</span>
              </figcaption>
            </figure>
          </section>

          <GalleryExplorer artworks={artworks} challenge={challenge} canLike={canLike} />
        </main>

        <footer className={styles.footer}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <a className={styles.textLink} href="#atas">
            Kembali ke atas <span className={`${styles.arrow} ${styles.arrowUp}`} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  )
}
