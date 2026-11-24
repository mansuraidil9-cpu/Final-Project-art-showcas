import { connection } from 'next/server'
import { getGalleryArtworks } from '../lib/artworks'
import { getActiveChallenges } from '../lib/challenges'
import { getCurrentUser } from '../lib/session'
import GalleryExplorer from './gallery-explorer'
import StudioExperience from './studio-experience'
import ShowcaseFooter from './showcase-footer'
import ShowcaseHeader from './showcase-header'
import styles from './home.module.css'

export default async function Home({ searchParams }) {
  const urlParams = await searchParams
  const initialQuery = typeof urlParams?.cari === 'string' ? urlParams.cari.slice(0, 120) : ''
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
  const favoriteCount = canLike ? (artworks ?? []).filter(artwork => artwork.favorited).length : undefined

  return (
    <div className={`${styles.home} ${styles.entrancePage}`} id="atas" data-alteria-home>
      <ShowcaseHeader user={user} currentPage="home" favoritesCount={favoriteCount} />
      <div className={styles.shell}>
        <main>
          <StudioExperience artworks={artworks ?? []} challenges={challenges ?? []} canLike={canLike} />
          <GalleryExplorer artworks={artworks} challenges={challenges} canLike={canLike} initialQuery={initialQuery} />
        </main>
        <ShowcaseFooter />
      </div>
    </div>
  )
}
