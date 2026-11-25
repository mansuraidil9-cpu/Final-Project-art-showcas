import { randomUUID } from 'node:crypto'
import { isDatabaseId, pool, transaction } from './db.mjs'

export const challengeTimeZone = 'Asia/Makassar'

const dayFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: challengeTimeZone,
})

const selectChallenges = `
  SELECT c.id::text, c.owner_id::text, c.title, c.category, c.description, c.rules, c.prize,
         c.cover_image, c.cover_alt, c.starts_at, c.ends_at,
         (to_jsonb(c)->>'winners_published_at') AS winners_published_at,
         CASE
           WHEN c.starts_at > CURRENT_TIMESTAMP THEN 'upcoming'
           WHEN c.ends_at <= CURRENT_TIMESTAMP THEN 'ended'
           ELSE 'active'
         END AS status
  FROM challenges AS c`

function toChallenge(row) {
  return {
    id: row.id,
    curatorId: row.owner_id,
    title: row.title,
    category: row.category,
    description: row.description,
    rules: row.rules,
    prize: row.prize,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    isUploaded: row.owner_id !== null,
    startsAt: row.starts_at.toISOString(),
    startLabel: dayFormat.format(row.starts_at),
    deadline: row.ends_at.toISOString(),
    deadlineLabel: dayFormat.format(row.ends_at),
    status: row.status,
    winnersPublishedAt: row.winners_published_at ?? null,
  }
}

export async function getChallengeById(id) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(`${selectChallenges} WHERE c.id = $1`, [id])
  return rows[0] ? toChallenge(rows[0]) : null
}

export async function getActiveChallenges() {
  const { rows } = await pool.query(`${selectChallenges}
    WHERE c.starts_at <= CURRENT_TIMESTAMP AND c.ends_at > CURRENT_TIMESTAMP
    ORDER BY c.ends_at, c.id`)
  return rows.map(toChallenge)
}

export async function getPublicChallenges() {
  const { rows } = await pool.query(`${selectChallenges}
    ORDER BY CASE
      WHEN c.ends_at <= CURRENT_TIMESTAMP THEN 2
      WHEN c.starts_at > CURRENT_TIMESTAMP THEN 1
      ELSE 0
    END,
    CASE WHEN c.ends_at <= CURRENT_TIMESTAMP THEN c.ends_at END DESC,
    CASE WHEN c.starts_at > CURRENT_TIMESTAMP THEN c.starts_at ELSE c.ends_at END, c.id`)
  return rows.map(toChallenge)
}

export async function getCuratorChallenges(curatorId) {
  const { rows } = await pool.query(`${selectChallenges}
    WHERE c.owner_id = $1 ORDER BY c.starts_at DESC, c.id DESC`, [curatorId])
  return rows.map(toChallenge)
}

export async function getUploadedChallengeBanner(src) {
  const { rows } = await pool.query(
    'SELECT cover_data FROM challenges WHERE cover_image = $1 AND owner_id IS NOT NULL',
    [src],
  )
  return rows[0]?.cover_data ?? null
}

export async function createCuratorChallenge(curatorId, fields, banner) {
  const { rows } = await pool.query(`
    INSERT INTO challenges (
      owner_id, slug, title, category, description, rules, prize,
      starts_at, ends_at, cover_image, cover_alt, cover_data
    )
    SELECT id, $2, $3, 'Seni', $4, $5, $6, $7, $8, $9, $3, $10
    FROM users WHERE id = $1 AND role = 'curator' AND curator_status = 'approved'
    RETURNING id::text`,
    [curatorId, randomUUID(), fields.title, fields.description, fields.rules, fields.prize,
      fields.startsAt, fields.endsAt, banner.src, banner.data],
  )
  return rows[0]?.id ?? null
}

function withLockedChallenge(id, change) {
  return transaction(async client => {
    const { rowCount } = await client.query('SELECT id FROM challenges WHERE id = $1 FOR UPDATE', [id])
    return rowCount === 1 ? change(client) : false
  })
}

const challengeOwner = `
  c.owner_id = $2 AND EXISTS (
    SELECT 1 FROM users u WHERE u.id = c.owner_id AND u.role = 'curator' AND u.curator_status = 'approved'
  )`

export function updateCuratorChallenge(id, curatorId, fields, banner) {
  return withLockedChallenge(id, async client => {
    const { rowCount } = await client.query(`
      UPDATE challenges AS c SET title = $3, description = $4, rules = $5, prize = $6,
        starts_at = $7, ends_at = $8, cover_image = COALESCE($9, c.cover_image),
        cover_alt = $3, cover_data = COALESCE($10, c.cover_data)
      WHERE c.id = $1 AND ${challengeOwner}
        AND c.winners_published_at IS NULL`,
      [id, curatorId, fields.title, fields.description, fields.rules, fields.prize,
        fields.startsAt, fields.endsAt, banner?.src ?? null, banner?.data ?? null],
    )
    return rowCount === 1
  })
}

export async function deleteCuratorChallenge(id, curatorId) {
  // Pengumuman juara bersifat final; arsipnya tidak boleh dihapus tak sengaja.
  const { rowCount } = await pool.query(
    `DELETE FROM challenges c WHERE c.id = $1 AND ${challengeOwner}
       AND c.winners_published_at IS NULL`, [id, curatorId],
  )
  return rowCount === 1
}

const selectSubmissions = `
  SELECT s.id::text, s.challenge_id::text, s.artwork_id::text, s.placement, s.submitted_at, s.withdrawn_at,
         c.title AS challenge_title, c.ends_at,
         a.title, a.image_src, a.image_alt, u.display_name AS artist
  FROM challenge_submissions s
  JOIN challenges c ON c.id = s.challenge_id
  JOIN artworks a ON a.id = s.artwork_id
  JOIN users u ON u.id = s.member_id`

function toSubmission(row) {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    artworkId: row.artwork_id,
    challengeTitle: row.challenge_title,
    deadlineLabel: dayFormat.format(row.ends_at),
    title: row.title,
    artist: row.artist,
    imageSrc: row.image_src,
    imageAlt: row.image_alt,
    rank: row.placement,
    withdrawn: row.withdrawn_at !== null,
    submittedAt: row.submitted_at.toISOString(),
  }
}

export async function getChallengeWinners(id) {
  if (!isDatabaseId(id)) return []
  let rows
  try {
    ;({ rows } = await pool.query(`
    SELECT w.challenge_id::text, w.rank, w.artwork_id::text, w.title,
           w.artist, w.image_src, w.image_alt, (w.image_data IS NOT NULL) AS has_data,
           (a.id IS NOT NULL) AS artwork_exists
    FROM challenge_winner_snapshots w
    LEFT JOIN artworks a ON a.id = w.artwork_id
    WHERE w.challenge_id = $1
    ORDER BY w.rank`, [id]))
  } catch (error) {
    // Halaman publik tetap dapat dibuka saat migrasi database belum dijalankan.
    if (error.code === '42P01') return []
    throw error
  }
  return rows.map(row => ({
    id: 'arsip-' + row.challenge_id + '-' + row.rank,
    challengeId: row.challenge_id,
    artworkId: row.artwork_id,
    title: row.title,
    artist: row.artist,
    imageSrc: row.has_data
      ? `/media/juara/${row.challenge_id}/${row.rank}`
      : row.image_src,
    imageAlt: row.image_alt,
    rank: row.rank,
    hasArtwork: row.artwork_exists,
  }))
}

export async function getWinnerSnapshotImage(challengeId, rank) {
  if (!isDatabaseId(challengeId) || ![1, 2, 3].includes(Number(rank))) return null
  const { rows } = await pool.query(
    'SELECT image_data FROM challenge_winner_snapshots WHERE challenge_id = $1 AND rank = $2',
    [challengeId, rank],
  )
  return rows[0]?.image_data ?? null
}

export async function getChallengeSubmissions(id) {
  const { rows } = await pool.query(`${selectSubmissions}
    WHERE s.challenge_id = $1 AND s.withdrawn_at IS NULL ORDER BY s.submitted_at, s.id`, [id])
  return rows.map(toSubmission)
}

export async function getMemberChallengeSubmissions(memberId, challengeId = null) {
  const { rows } = await pool.query(`${selectSubmissions}
    WHERE s.member_id = $1 AND ($2::bigint IS NULL OR (s.challenge_id = $2 AND s.withdrawn_at IS NULL))
    ORDER BY s.submitted_at DESC, s.id DESC`, [memberId, challengeId])
  return rows.map(toSubmission)
}

export function submitChallengeArtwork(id, memberId, artworkId) {
  return withLockedChallenge(id, async client => {
    const { rowCount } = await client.query(`
      INSERT INTO challenge_submissions (challenge_id, member_id, artwork_id)
      SELECT c.id, u.id, a.id
      FROM challenges c
      JOIN users u ON u.id = $2 AND u.role = 'member'
      JOIN artworks a ON a.id = $3 AND a.owner_id = u.id
      WHERE c.id = $1 AND c.owner_id IS DISTINCT FROM u.id
        AND c.starts_at <= clock_timestamp() AND c.ends_at > clock_timestamp()
      ON CONFLICT (challenge_id, member_id) WHERE withdrawn_at IS NULL DO NOTHING`, [id, memberId, artworkId])
    return rowCount === 1
  })
}

export function withdrawChallengeSubmission(id, memberId) {
  return withLockedChallenge(id, async client => {
    const { rowCount } = await client.query(`
      UPDATE challenge_submissions s SET withdrawn_at = clock_timestamp()
      FROM challenges c, users u
      WHERE s.challenge_id = $1 AND s.member_id = $2
        AND s.withdrawn_at IS NULL
        AND c.id = s.challenge_id AND c.ends_at > clock_timestamp()
        AND u.id = s.member_id AND u.role = 'member'`, [id, memberId])
    return rowCount === 1
  })
}

export function publishChallengeWinners(id, curatorId, winners) {
  const submissionIds = winners.map(winner => winner.submissionId)
  const ranks = winners.map(winner => winner.rank)
  if (!winners.length || winners.length > 3 || new Set(submissionIds).size !== winners.length ||
      !submissionIds.every(isDatabaseId) || new Set(ranks).size !== winners.length ||
      !ranks.every(rank => [1, 2, 3].includes(rank))) return false

  return withLockedChallenge(id, async client => {
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM challenges c WHERE c.id = $1 AND ${challengeOwner}
          AND c.ends_at <= clock_timestamp() AND c.winners_published_at IS NULL
      ) AS eligible`, [id, curatorId])
    if (!rows[0].eligible) return false

    const { rowCount } = await client.query(`
      SELECT id FROM challenge_submissions
      WHERE challenge_id = $1 AND id = ANY($2::bigint[]) AND member_id <> $3 AND withdrawn_at IS NULL
      ORDER BY id FOR UPDATE`, [id, submissionIds, curatorId])
    if (rowCount !== submissionIds.length) return false

    // Buat snapshot dalam transaksi yang sama; hasil tidak bergantung pada FK karya.
    const snapshots = await client.query(`
      INSERT INTO challenge_winner_snapshots
        (challenge_id, rank, artwork_id, title, artist, image_src, image_alt, image_data)
      SELECT $1, selected.rank, a.id, a.title, u.display_name, a.image_src, a.image_alt, a.image_data
      FROM unnest($2::bigint[], $3::smallint[]) AS selected(id, rank)
      JOIN challenge_submissions s ON s.id = selected.id AND s.challenge_id = $1
      JOIN artworks a ON a.id = s.artwork_id
      JOIN users u ON u.id = s.member_id`, [id, submissionIds, ranks])
    if (snapshots.rowCount !== submissionIds.length) throw new Error('Arsip pemenang tidak lengkap.')

    await client.query(`
      UPDATE challenge_submissions s SET placement = selected.rank
      FROM unnest($2::bigint[], $3::smallint[]) AS selected(id, rank)
      WHERE s.challenge_id = $1 AND s.id = selected.id`, [id, submissionIds, ranks])
    const updated = await client.query(
      'UPDATE challenges SET winners_published_at = clock_timestamp() WHERE id = $1 AND winners_published_at IS NULL',
      [id],
    )
    if (updated.rowCount !== 1) throw new Error('Status hasil final gagal disimpan.')
    return true
  })
}
