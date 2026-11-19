import { isDatabaseId, pool } from './db.mjs'

export const challengeTimeZone = 'Asia/Makassar'

const deadlineFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: challengeTimeZone,
})

const challengeColumns = `
  id::text AS id, title, category, description, rules, prize,
  cover_image, cover_alt, ends_at`

const selectChallenge = `SELECT ${challengeColumns} FROM challenges`
const challengeStatuses = ['active', 'upcoming', 'ended']

function toChallenge(row) {
  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    rules: row.rules,
    prize: row.prize,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    deadline: row.ends_at.toISOString(),
    deadlineLabel: deadlineFormat.format(row.ends_at),
  }
}

export async function getChallengeById(id) {
  if (!isDatabaseId(id)) return null

  const { rows } = await pool.query(`${selectChallenge} WHERE id = $1`, [id])
  return toChallenge(rows[0])
}

export async function getActiveChallenge() {
  const { rows } = await pool.query(`${selectChallenge}
    WHERE starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP
    ORDER BY ends_at, challenges.id
    LIMIT 1`)
  return toChallenge(rows[0])
}

export async function getPublicChallenges() {
  const { rows } = await pool.query(`
    SELECT ${challengeColumns}, starts_at,
      CASE
        WHEN ends_at <= CURRENT_TIMESTAMP THEN 2
        WHEN starts_at > CURRENT_TIMESTAMP THEN 1
        ELSE 0
      END AS status_order
    FROM challenges
    ORDER BY status_order,
      CASE WHEN ends_at <= CURRENT_TIMESTAMP THEN ends_at END DESC,
      CASE WHEN starts_at > CURRENT_TIMESTAMP THEN starts_at ELSE ends_at END,
      challenges.id`,
  )

  return rows.map(row => ({
    ...toChallenge(row),
    status: challengeStatuses[row.status_order],
    startLabel: deadlineFormat.format(row.starts_at),
  }))
}
