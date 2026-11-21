import { connection } from 'next/server'
import { challengeStatusLabels } from '../../lib/challenge-dates'
import { getPublicChallenges } from '../../lib/challenges'
import { getCurrentUser } from '../../lib/session'
import ChallengeCard from '../challenge-card'
import styles from '../home.module.css'
import ShowcaseHeader from '../showcase-header'
import ShowcaseFooter from '../showcase-footer'

export const metadata = { title: 'Challenge | ALTERIA' }

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
    <div className={styles.home} id="atas">
      <ShowcaseHeader user={user} currentPage="challenge" />
      <div className={styles.shell}>
        <main className={styles.standalone}>
          <h1 className={styles.pageTitle}>Challenge</h1>
          {challenges?.length ? challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              heading="h2"
              statusLabel={challenge.status === 'upcoming'
                ? `${challengeStatusLabels.upcoming}, mulai ${challenge.startLabel}`
                : challengeStatusLabels[challenge.status]}
            />
          )) : (
            <p className={styles.emptyGallery}>
              {challenges ? 'Belum ada challenge.' : 'Daftar challenge belum bisa dimuat.'}
            </p>
          )}
        </main>
        <ShowcaseFooter />
      </div>
    </div>
  )
}
