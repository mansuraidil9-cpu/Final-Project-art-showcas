'use server'

import { getArtworkById } from '@/lib/artworks'
import { getCurrentUser } from '@/lib/session'

// Baca data yang sudah tersedia; tidak mengubah endpoint atau tabel karya.
export async function readGalleryArtworkDetails(id) {
  const user = await getCurrentUser()
  const viewerId = user?.role === 'member' ? user.id : null
  const artwork = await getArtworkById(id, viewerId)
  if (!artwork) return null
  return {
    id: artwork.id,
    title: artwork.title,
    artist: artwork.artist,
    category: artwork.category,
    date: artwork.date,
    description: artwork.description,
    rights: artwork.rights,
    width: artwork.width,
    height: artwork.height,
    tags: artwork.tags,
    imageSrc: artwork.imageSrc,
    imageAlt: artwork.imageAlt,
    isUploaded: artwork.isUploaded,
  }
}
