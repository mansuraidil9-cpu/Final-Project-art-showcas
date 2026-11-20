import { randomUUID } from 'node:crypto'
import { maxArtworkCommentLength } from './artwork-fields.js'
import { isDatabaseId, pool } from './db.mjs'

const galleryArtworkColumns = `
  artworks.id::text AS id, title, COALESCE(creator.display_name, artist) AS artist,
  creator.id::text AS creator_id, creator.role AS creator_role,
  artwork_date, category, image_src, uploaded_at, tags, like_summary.like_count,
  (SELECT COUNT(*) FROM artwork_comments WHERE artwork_id = artworks.id) AS comment_count,
  like_summary.liked, owner_id IS NOT NULL AS is_uploaded,
  COALESCE(owner_id = $1::bigint, false) AS is_owner,
  EXISTS (
    SELECT 1 FROM artwork_favorites AS favorites
    WHERE favorites.artwork_id = artworks.id AND favorites.user_id = $1::bigint
      AND artworks.owner_id IS DISTINCT FROM favorites.user_id
  ) AS favorited`

const fromArtworks = `
  FROM artworks
  LEFT JOIN users AS creator ON creator.id = artworks.owner_id
  CROSS JOIN LATERAL (
    SELECT COUNT(*) AS like_count,
           COALESCE(BOOL_OR(likes.user_id = $1::bigint), false) AS liked
    FROM artwork_likes AS likes
    JOIN users AS liker ON liker.id = likes.user_id AND liker.role = 'member'
    WHERE likes.artwork_id = artworks.id
      AND artworks.owner_id IS DISTINCT FROM likes.user_id
  ) AS like_summary`

const selectArtworkDetail = `
  SELECT ${galleryArtworkColumns}, image_alt, image_width, image_height,
         description, rights
  ${fromArtworks}`

const eligibleArtworkInteraction = `
  SELECT artworks.id AS artwork_id, member.id AS user_id
  FROM artworks
  JOIN users AS member ON member.id = $2 AND member.role = 'member'
  WHERE artworks.id = $1 AND artworks.owner_id IS DISTINCT FROM member.id`

function toGalleryArtwork(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    creatorId: row.creator_id,
    creatorRole: row.creator_role,
    date: row.artwork_date,
    category: row.category,
    imageSrc: row.image_src,
    likes: Number(row.like_count),
    commentCount: Number(row.comment_count),
    liked: row.liked,
    favorited: row.favorited,
    uploadedAt: row.uploaded_at.toISOString(),
    tags: row.tags,
    isUploaded: row.is_uploaded,
    isOwner: row.is_owner,
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
    rights: row.rights,
  }
}

export async function getGalleryArtworks(viewerId = null) {
  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}
    ${fromArtworks}
    ORDER BY artworks.id`,
    [isDatabaseId(viewerId) ? viewerId : null],
  )
  return rows.map(toGalleryArtwork)
}

export async function getArtworkById(id, viewerId = null) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(
    `${selectArtworkDetail} WHERE artworks.id = $2`,
    [isDatabaseId(viewerId) ? viewerId : null, id],
  )
  return toArtworkDetail(rows[0])
}

export async function getPublicCreator(id) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(`
    SELECT id::text AS id, display_name AS "displayName", role, bio, profile_links AS links,
           (avatar_data IS NOT NULL AND role = 'member') AS "hasAvatar"
    FROM users
    WHERE id = $1 AND (
      role = 'member' OR EXISTS (SELECT 1 FROM artworks WHERE owner_id = users.id)
    )`,
    [id],
  )
  return rows[0] ?? null
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
    `${selectArtworkDetail} WHERE artworks.owner_id = $1 AND artworks.id = $2`,
    [ownerId, id],
  )
  return toArtworkDetail(rows[0])
}

export async function getMemberFavorites(memberId) {
  if (!isDatabaseId(memberId)) return []

  const { rows } = await pool.query(`
    SELECT ${galleryArtworkColumns}
    ${fromArtworks}
    JOIN artwork_favorites AS saved ON saved.artwork_id = artworks.id AND saved.user_id = $1
    JOIN users AS member ON member.id = saved.user_id AND member.role = 'member'
    WHERE artworks.owner_id IS DISTINCT FROM member.id
    ORDER BY saved.created_at DESC, saved.artwork_id DESC`,
    [memberId],
  )
  return rows.map(toGalleryArtwork)
}

function isMissingInteractionTarget(error, table) {
  return error.code === '23503' && (
    error.constraint === `${table}_artwork_id_fkey` ||
    error.constraint === `${table}_user_id_fkey`
  )
}

async function setArtworkPreference(table, artworkId, memberId, desired) {
  if (!isDatabaseId(artworkId) || !isDatabaseId(memberId) || typeof desired !== 'boolean') {
    return false
  }

  const change = desired
    ? `INSERT INTO ${table} (artwork_id, user_id)
       SELECT artwork_id, user_id FROM eligible
       ON CONFLICT (artwork_id, user_id) DO NOTHING`
    : `DELETE FROM ${table} AS preference
       USING eligible
       WHERE preference.artwork_id = eligible.artwork_id AND preference.user_id = eligible.user_id`

  try {
    const { rows } = await pool.query(`
      WITH eligible AS (${eligibleArtworkInteraction}), updated AS (${change})
      SELECT EXISTS (SELECT 1 FROM eligible) AS success`,
      [artworkId, memberId],
    )
    return rows[0].success
  } catch (error) {
    if (isMissingInteractionTarget(error, table)) return false
    throw error
  }
}

export function setArtworkLike(artworkId, memberId, liked) {
  return setArtworkPreference('artwork_likes', artworkId, memberId, liked)
}

export function setArtworkFavorite(artworkId, memberId, desired) {
  return setArtworkPreference('artwork_favorites', artworkId, memberId, desired)
}

export async function getArtworkComments(artworkId, viewerId = null) {
  if (!isDatabaseId(artworkId)) return []

  const { rows } = await pool.query(`
    SELECT comments.id::text AS id, author.display_name AS author, comments.body,
           comments.created_at,
           COALESCE(author.id = $2::bigint AND author.role = 'member', false) AS can_delete
    FROM artwork_comments AS comments
    JOIN users AS author ON author.id = comments.user_id
    WHERE comments.artwork_id = $1
    ORDER BY comments.created_at, comments.id`,
    [artworkId, isDatabaseId(viewerId) ? viewerId : null],
  )

  return rows.map(row => ({
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at.toISOString(),
    canDelete: row.can_delete,
  }))
}

export async function addArtworkComment(artworkId, memberId, body) {
  if (!isDatabaseId(artworkId) || !isDatabaseId(memberId) || typeof body !== 'string') return null

  const text = body.trim()
  if (!text || text.length > maxArtworkCommentLength * 2 || text.includes('\0') ||
      [...text].length > maxArtworkCommentLength) return null

  try {
    const { rows } = await pool.query(`
      WITH eligible AS (${eligibleArtworkInteraction})
      INSERT INTO artwork_comments (artwork_id, user_id, body)
      SELECT artwork_id, user_id, $3 FROM eligible
      RETURNING id::text AS id`,
      [artworkId, memberId, text],
    )
    return rows[0]?.id ?? null
  } catch (error) {
    if (isMissingInteractionTarget(error, 'artwork_comments')) return null
    throw error
  }
}

export async function deleteArtworkComment(artworkId, commentId, memberId) {
  if (!isDatabaseId(artworkId) || !isDatabaseId(commentId) || !isDatabaseId(memberId)) return false

  const { rowCount } = await pool.query(`
    DELETE FROM artwork_comments AS comments
    USING users AS author
    WHERE comments.id = $2 AND comments.artwork_id = $1 AND comments.user_id = $3
      AND author.id = comments.user_id AND author.role = 'member'`,
    [artworkId, commentId, memberId],
  )
  return rowCount === 1
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
