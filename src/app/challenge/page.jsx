import { connection } from 'next/server'
import { getPublicChallenges } from '../../lib/challenges'
import { getCurrentUser } from '../../lib/session'
import ChallengeCard from '../challenge-card'
import styles from '../home.module.css'
import ShowcaseHeader from '../showcase-header'

export const metadata = { title: 'Challenge | ALTERIA' }

const statusLabels = {
  active: 'Sedang berlangsung',
  upcoming: 'Akan datang',
  ended: 'Selesai',
}

export default async function ChallengeIndex() {
  await connection()
  const [user, challenges] = await Promise.all([
    getCurrentUser(),
    getPublicChallenges().catch(error => {
      console.error('Daftar challenge gagal dimuat.', error.code ?? error.name)
      return null
    }),
  ])

  return (
    <div className={styles.home}>
      <div className={styles.shell}>
        <ShowcaseHeader user={user} currentPage="challenge" />
        <main className={styles.standalone}>
          <h1 className={styles.pageTitle}>Challenge</h1>
          {challenges?.length ? challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              heading="h2"
              statusLabel={challenge.status === 'upcoming'
                ? `${statusLabels.upcoming}, mulai ${challenge.startLabel}`
                : statusLabels[challenge.status]}
            />
          )) : (
            <p className={styles.emptyGallery}>
              {challenges ? 'Belum ada challenge.' : 'Daftar challenge belum bisa dimuat.'}
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
