import { connection } from 'next/server'
import { getGalleryArtworks } from '../../lib/artworks'
import { getCurrentUser } from '../../lib/session'
import GalleryExplorer from '../gallery-explorer'
import styles from '../home.module.css'
import ShowcaseFooter from '../showcase-footer'
import ShowcaseHeader from '../showcase-header'

export const metadata = {
  title: 'Galeri Karya | ALTERIA',
  description: 'Jelajahi galeri karya seni ALTERIA dan temukan karya berdasarkan judul, kreator, atau kategori.',
}

export default async function GalleryPage() {
  await connection()

  const user = await getCurrentUser()
  const canLike = user?.role === 'member'
  const artworks = await getGalleryArtworks(canLike ? user.id : null).catch(error => {
    console.error('Galeri gagal dimuat.', error.code ?? error.name)
    return undefined
  })

  return (
    <div className={styles.home} id="atas">
      <ShowcaseHeader user={user} currentPage="galeri" favoritesCount={canLike ? (artworks ?? []).filter(artwork => artwork.favorited).length : undefined} />
      <div className={styles.shell}>
        <main>
          <GalleryExplorer artworks={artworks} canLike={canLike} galleryPage />
        </main>
        <ShowcaseFooter />
      </div>
    </div>
  )
}
