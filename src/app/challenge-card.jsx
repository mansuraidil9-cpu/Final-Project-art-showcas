import Image from 'next/image'
import Link from 'next/link'
import styles from './home.module.css'

export default function ChallengeCard({ challenge, statusLabel, heading: Heading = 'h3' }) {
  return (
    <article className={styles.challengeCard}>
      <div className={styles.challengeImage}>
        <Image
          src={challenge.coverImage}
          alt={challenge.coverAlt}
          fill
          sizes="(max-width: 760px) 94vw, 44vw"
        />
      </div>
      <div className={styles.challengeCopy}>
        <p className={styles.eyebrow}>
          {statusLabel && `${statusLabel} · `}{challenge.category}
        </p>
        <Heading>{challenge.title}</Heading>
        <p>{challenge.description}</p>
        <p className={styles.deadline}>
          Sampai <time dateTime={challenge.deadline}>{challenge.deadlineLabel}</time>
        </p>
        <Link className={styles.textLink} href={`/challenge/${challenge.id}`}>
          Lihat Challenge <span className={`${styles.arrow} ${styles.arrowOut}`} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
