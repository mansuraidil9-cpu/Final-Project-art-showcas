import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '../../account-panel'
import { challengeStatusLabels } from '@/lib/challenge-dates'
import { getCuratorChallenges } from '@/lib/challenges'
import { requireUser } from '@/lib/session'
import styles from '../member/member-artworks.module.css'

const notices = new Map([
  ['dibuat', 'Challenge berhasil dibuat.'],
  ['diedit', 'Perubahan challenge berhasil disimpan.'],
  ['dihapus', 'Challenge berhasil dihapus.'],
])

export default async function CuratorDashboard({ searchParams }) {
  const user = await requireUser('curator')
  const [challenges, search] = await Promise.all([getCuratorChallenges(user.id), searchParams])
  const notice = notices.get(search?.hasil)

  return (
    <AccountPanel title="Dashboard Curator" description={`Halo, ${user.display_name}.`} wide>
      <section className={styles.section} aria-labelledby="kelola-challenge">
        <header className={styles.sectionHeader}>
          <h2 id="kelola-challenge">Kelola Challenge</h2>
          <Link className={styles.primaryButton} href="/dashboard/curator/challenge/baru">Buat challenge</Link>
        </header>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {challenges.length === 0 ? <p className={styles.empty}>Belum ada challenge yang kamu buat.</p> : (
          <ul className={styles.artworks}>
            {challenges.map(challenge => (
              <li key={challenge.id} className={styles.card}>
                <div className={styles.thumbnail}>
                  <Image src={challenge.coverImage} alt="" fill sizes="(max-width: 520px) 90vw, 14rem" unoptimized />
                </div>
                <div className={styles.cardBody}>
                  <p>{challengeStatusLabels[challenge.status]} · {challenge.deadlineLabel}</p>
                  <h3>{challenge.title}</h3>
                  <div className={styles.cardActions}>
                    <Link href={`/dashboard/curator/challenge/${challenge.id}`} aria-label={`Kelola ${challenge.title}`}>Kelola</Link>
                    <Link href={`/challenge/${challenge.id}`} aria-label={`Lihat ${challenge.title}`}>Lihat</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountPanel>
  )
}
