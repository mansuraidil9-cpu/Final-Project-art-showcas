export const challengeStatusLabels = {
  active: 'Sedang berlangsung',
  upcoming: 'Akan datang',
  ended: 'Selesai',
}

const witaOffsetMs = 8 * 60 * 60 * 1000

export function formatChallengeDateInput(value) {
  return new Date(new Date(value).getTime() + witaOffsetMs).toISOString().slice(0, 16)
}

export function parseChallengeDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+08:00`)
  return Number.isFinite(date.getTime()) && formatChallengeDateInput(date) === value ? date : null
}
