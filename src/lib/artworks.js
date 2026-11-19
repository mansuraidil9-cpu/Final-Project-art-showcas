import { randomUUID } from 'node:crypto'
import { isDatabaseId, pool } from './db.mjs'

const galleryArtworkColumns = `
  artworks.id::text AS id, title, COALESCE(creator.display_name, artist) AS artist,
  artwork_date, category, image_src, uploaded_at, tags,
  owner_id IS NOT NULL AS is_uploaded`

const artworkDetailColumns = 'image_alt, image_width, image_height, description, source_url, rights'

const likeCountColumn = `
  artworks.like_count + (
    SELECT count(*) FROM artwork_likes WHERE artwork_id = artworks.id
  ) AS like_count`

const fromArtworks = `
  FROM artworks
  LEFT JOIN users AS creator ON creator.id = artworks.owner_id`

function toGalleryArtwork(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    date: row.artwork_date,
    category: row.category,
    imageSrc: row.image_src,
    likes: Number(row.like_count),
    uploadedAt: row.uploaded_at.toISOString(),
    tags: row.tags,
    isUploaded: row.is_uploaded,
  }
}

function toArtworkDetail(row) {
  if (!row) return null

  return {
    ...toGalleryArtwork(row),
    liked: row.liked ?? false,
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
    SELECT ${galleryArtworkColumns}, ${likeCountColumn}
    ${fromArtworks}
    ORDER BY artworks.id`,
  )
  return rows.map(toGalleryArtwork)
}

export async function getArtworkById(id, userId = null) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}, ${artworkDetailColumns}, ${likeCountColumn},
      EXISTS (
        SELECT 1 FROM artwork_likes WHERE artwork_id = artworks.id AND user_id = $2
      ) AS liked
    ${fromArtworks}
    WHERE artworks.id = $1`,
    [id, userId],
  )
  return toArtworkDetail(rows[0])
}

export async function setArtworkLike(id, userId, liked) {
  if (liked) {
    await pool.query(`
      INSERT INTO artwork_likes (artwork_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (artwork_id, user_id) DO NOTHING`,
      [id, userId],
    )
  } else {
    await pool.query('DELETE FROM artwork_likes WHERE artwork_id = $1 AND user_id = $2', [id, userId])
  }
}

export async function getMemberArtworks(ownerId) {
  if (!isDatabaseId(ownerId)) return []

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}, artworks.like_count
    ${fromArtworks}
    WHERE artworks.owner_id = $1
    ORDER BY artworks.uploaded_at DESC, artworks.id DESC`,
    [ownerId],
  )
  return rows.map(toGalleryArtwork)
}

export async function getMemberArtwork(id, ownerId) {
  if (!isDatabaseId(id) || !isDatabaseId(ownerId)) return null

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}, ${artworkDetailColumns}, artworks.like_count
    ${fromArtworks}
    WHERE artworks.id = $1 AND artworks.owner_id = $2`,
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
