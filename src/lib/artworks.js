import { isDatabaseId, pool } from './db.mjs'

const galleryArtworkColumns = `
  id::text AS id, title, artist, artwork_date, category, image_src,
  like_count, uploaded_at, tags`

function toGalleryArtwork(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    date: row.artwork_date,
    category: row.category,
    imageSrc: row.image_src,
    likes: row.like_count,
    uploadedAt: row.uploaded_at.toISOString(),
    tags: row.tags,
  }
}

export async function getGalleryArtworks() {
  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}
    FROM artworks
    ORDER BY artworks.id`,
  )
  return rows.map(toGalleryArtwork)
}

export async function getArtworkById(id) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}, image_alt, image_width, image_height,
           description, source_url, rights
    FROM artworks
    WHERE id = $1`,
    [id],
  )
  const row = rows[0]
  if (!row) return null

  return {
    ...toGalleryArtwork(row),
    imageAlt: row.image_alt,
    width: row.image_width,
    height: row.image_height,
    description: row.description,
    sourceUrl: row.source_url,
    rights: row.rights,
  }
}
