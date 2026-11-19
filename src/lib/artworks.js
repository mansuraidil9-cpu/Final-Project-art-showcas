import { randomUUID } from 'node:crypto'
import { isDatabaseId, pool } from './db.mjs'

const galleryArtworkColumns = `
  artworks.id::text AS id, title, COALESCE(creator.display_name, artist) AS artist,
  artwork_date, category, image_src, like_count, uploaded_at, tags,
  owner_id IS NOT NULL AS is_uploaded`

const fromArtworks = `
  FROM artworks
  LEFT JOIN users AS creator ON creator.id = artworks.owner_id`

const selectArtworkDetail = `
  SELECT ${galleryArtworkColumns}, image_alt, image_width, image_height,
         description, source_url, rights
  ${fromArtworks}`

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
    isUploaded: row.is_uploaded,
  }
}

function toArtworkDetail(row) {
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

export async function getGalleryArtworks() {
  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}
    ${fromArtworks}
    ORDER BY artworks.id`,
  )
  return rows.map(toGalleryArtwork)
}

export async function getArtworkById(id) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(
    `${selectArtworkDetail} WHERE artworks.id = $1`,
    [id],
  )
  return toArtworkDetail(rows[0])
}

export async function getMemberArtworks(ownerId) {
  if (!isDatabaseId(ownerId)) return []

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}
    ${fromArtworks}
    WHERE artworks.owner_id = $1
    ORDER BY artworks.uploaded_at DESC, artworks.id DESC`,
    [ownerId],
  )
  return rows.map(toGalleryArtwork)
}

export async function getMemberArtwork(id, ownerId) {
  if (!isDatabaseId(id) || !isDatabaseId(ownerId)) return null

  const { rows } = await pool.query(
    `${selectArtworkDetail} WHERE artworks.id = $1 AND artworks.owner_id = $2`,
    [id, ownerId],
  )
  return toArtworkDetail(rows[0])
}

export async function createMemberArtwork(ownerId, fields, image) {
  if (!isDatabaseId(ownerId)) return null

  const { rows } = await pool.query(`
    INSERT INTO artworks (
      owner_id, slug, title, artist, artwork_date, category, image_src, image_alt,
      image_width, image_height, description, tags, image_data
    )
    SELECT creator.id, $2, $3, creator.display_name, '', $5, $7, $3, $9, $10, $4, $6, $8
    FROM users AS creator
    WHERE creator.id = $1 AND creator.role = 'member'
    RETURNING id::text AS id`,
    [ownerId, randomUUID(), fields.title, fields.description, fields.category, fields.tags,
      image.src, image.data, image.width, image.height],
  )
  return rows[0]?.id ?? null
}

export async function updateMemberArtwork(id, ownerId, fields) {
  if (!isDatabaseId(id) || !isDatabaseId(ownerId)) return null

  const { rows } = await pool.query(`
    UPDATE artworks
    SET title = $3, description = $4, category = $5, tags = $6, image_alt = $3
    WHERE id = $1 AND owner_id = $2
    RETURNING id::text AS id`,
    [id, ownerId, fields.title, fields.description, fields.category, fields.tags],
  )
  return rows[0]?.id ?? null
}

export async function deleteMemberArtwork(id, ownerId) {
  if (!isDatabaseId(id) || !isDatabaseId(ownerId)) return false

  const { rowCount } = await pool.query(
    'DELETE FROM artworks WHERE id = $1 AND owner_id = $2',
    [id, ownerId],
  )
  return rowCount === 1
}

export async function getUploadedArtworkImage(imageSrc) {
  if (typeof imageSrc !== 'string' || !imageSrc) return null

  const { rows } = await pool.query(
    'SELECT image_data FROM artworks WHERE image_src = $1 AND owner_id IS NOT NULL',
    [imageSrc],
  )
  return rows[0]?.image_data ?? null
}
