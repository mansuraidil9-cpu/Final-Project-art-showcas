import { pool, transaction } from './db.mjs'

export async function hasArtworkReport(artworkId, memberId) {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM artwork_reports WHERE artwork_id = $1 AND member_id = $2',
    [artworkId, memberId],
  )
  return rowCount === 1
}

export async function createArtworkReport(artworkId, memberId, reason) {
  const { rowCount } = await pool.query(`
    INSERT INTO artwork_reports (artwork_id, member_id, reason)
    SELECT a.id, u.id, $3 FROM artworks a
    JOIN users u ON u.id = $2 AND u.role = 'member'
    WHERE a.id = $1 AND a.owner_id IS NOT NULL AND a.owner_id <> u.id
    ON CONFLICT (artwork_id, member_id) DO NOTHING`, [artworkId, memberId, reason])
  return rowCount === 1
}

export async function getPendingArtworkReports() {
  const { rows } = await pool.query(`
    SELECT a.id::text, a.title, creator.display_name AS artist,
           count(*)::integer AS total,
           jsonb_agg(jsonb_build_object('reason', r.reason, 'id', r.member_id::text)
                     ORDER BY r.created_at, r.member_id) AS reports
    FROM artwork_reports r
    JOIN artworks a ON a.id = r.artwork_id
    LEFT JOIN users creator ON creator.id = a.owner_id
    WHERE r.status = 'pending'
    GROUP BY a.id, creator.display_name ORDER BY min(r.created_at), a.id`)
  return rows
}

export function resolveArtworkReports(artworkId, removeArtwork) {
  return transaction(async client => {
    const artwork = await client.query('SELECT id FROM artworks WHERE id = $1 FOR UPDATE', [artworkId])
    if (!artwork.rowCount) return false

    const { rowCount } = removeArtwork
      ? await client.query(`
        DELETE FROM artworks a WHERE a.id = $1 AND EXISTS (
          SELECT 1 FROM artwork_reports r WHERE r.artwork_id = a.id AND r.status = 'pending'
        )`, [artworkId])
      : await client.query(
        "UPDATE artwork_reports SET status = 'dismissed' WHERE artwork_id = $1 AND status = 'pending'",
        [artworkId],
      )
    return rowCount > 0
  })
}
