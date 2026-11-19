import { connection } from 'next/server'
import { getGalleryArtworks } from '../../lib/artworks'
import { getCurrentUser } from '../../lib/session'
import GalleryExplorer from '../gallery-explorer'
import styles from '../home.module.css'
import ShowcaseHeader from '../showcase-header'

export const metadata = {
  title: 'Galeri Karya | ALTERIA',
  description: 'Jelajahi galeri karya seni ALTERIA dan temukan karya berdasarkan judul, kreator, atau kategori.',
}

export default async function GalleryPage() {
  await connection()

  const [user, artworks] = await Promise.all([
    getCurrentUser(),
    getGalleryArtworks().catch(error => {
      console.error('Galeri gagal dimuat.', error.code ?? error.name)
      return undefined
    }),
  ])

  return (
    <div className={styles.home}>
      <div className={styles.shell}>
        <ShowcaseHeader user={user} currentPage="galeri" />
        <main>
          <GalleryExplorer artworks={artworks} galleryPage />
        </main>
      </div>
    </div>
  )
}
