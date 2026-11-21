import Image, { getImageProps } from 'next/image'
import { connection } from 'next/server'
import { getGalleryArtworks } from '../lib/artworks'
import { getActiveChallenges } from '../lib/challenges'
import { getCurrentUser } from '../lib/session'
import GalleryExplorer from './gallery-explorer'
import ShowcaseFooter from './showcase-footer'
import ShowcaseHeader from './showcase-header'
import styles from './home.module.css'

const { props: mobileHero } = getImageProps({
  src: '/alteria/beranda-mona-lisa-hp-menyatu.webp',
  alt: '',
  fill: true,
  sizes: '100vw',
})

export default async function Home() {
  await connection()
  const challengeQuery = getActiveChallenges().catch(error => {
    console.error('Challenge gagal dimuat.', error.code ?? error.name)
    return undefined
  })
  const user = await getCurrentUser()
  const canLike = user?.role === 'member'
  const [artworks, challenges] = await Promise.all([
    getGalleryArtworks(canLike ? user.id : null).catch(error => {
      console.error('Galeri gagal dimuat.', error.code ?? error.name)
      return undefined
    }),
    challengeQuery,
  ])
  return (
    <div className={`${styles.home} ${styles.entrancePage}`} id="atas">
      <ShowcaseHeader user={user} currentPage="home" />
      <div className={styles.shell}>
        <main>
          <section className={styles.hero} aria-labelledby="judul-beranda">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Galeri seni digital</p>
              <h1 id="judul-beranda">
                Ruang bagi{' '}
                <em>setiap karya.</em>
              </h1>
              <p className={styles.intro}>
                Kenali kreator, temukan karya lintas medium, dan ikuti challenge seni.
              </p>
              <a className={styles.heroLink} href="#galeri">
                Jelajahi Galeri <span className={`${styles.arrow} ${styles.arrowDown}`} aria-hidden="true" />
              </a>
            </div>

            <div className={styles.heroImage}>
              <picture>
                <source media="(max-width: 760px)" srcSet={mobileHero.srcSet} sizes={mobileHero.sizes} />
                <Image
                  src="/alteria/beranda-mona-lisa-oker.webp"
                  alt="Lukisan Mona Lisa karya Leonardo da Vinci dalam bingkai miring, dengan kuas dan sapuan cat melayang."
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="100vw"
                />
              </picture>
            </div>
          </section>

          <GalleryExplorer artworks={artworks} challenges={challenges} canLike={canLike} />
        </main>

        <ShowcaseFooter />
      </div>
    </div>
  )
}
