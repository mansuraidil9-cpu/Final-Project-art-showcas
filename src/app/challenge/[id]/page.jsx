import Image from 'next/image'
import { notFound } from 'next/navigation'
import credits from '../../../../public/alteria/credits.json'
import { challengeTimeZone, getChallengeById } from '../../../lib/challenges'
import homeStyles from '../../home.module.css'
import ShowcaseDetail from '../../showcase-detail'
import styles from './challenge.module.css'

export const metadata = { title: 'Detail Challenge | ALTERIA' }

const deadlineTime = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: challengeTimeZone,
})

export default async function DetailChallenge({ params }) {
  const { id } = await params
  const challenge = await getChallengeById(id)

  if (!challenge) notFound()

  const coverCredit = credits.find(artwork => `/alteria/${artwork.filename}` === challenge.coverImage)

  return (
    <ShowcaseDetail backHref="/challenge" backLabel="Kembali ke Challenge">
      <section className={styles.hero} aria-labelledby="judul-challenge">
        <div className={styles.introduction}>
          <p className={homeStyles.eyebrow}>{challenge.category}</p>
          <h1 id="judul-challenge">{challenge.title}</h1>
          <p className={styles.description}>{challenge.description}</p>

          <div className={styles.deadline}>
            <span className={homeStyles.eyebrow}>Tenggat pengumpulan</span>
            <time dateTime={challenge.deadline}>
              {challenge.deadlineLabel} · {deadlineTime.format(new Date(challenge.deadline))} WITA
            </time>
          </div>
        </div>

        <figure>
          <div className={styles.cover}>
            <Image
              src={challenge.coverImage}
              alt={challenge.coverAlt}
              fill
              preload
              sizes="(max-width: 760px) 94vw, (max-width: 1480px) 53vw, 740px"
            />
          </div>
          {coverCredit && (
            <figcaption className={homeStyles.heroCaption}>
              <cite>{coverCredit.title}</cite>
              <span>{coverCredit.artist}, {coverCredit.date}</span>
            </figcaption>
          )}
        </figure>
      </section>

      <div className={styles.details}>
        <section aria-labelledby="aturan-challenge">
          <h2 id="aturan-challenge">Aturan</h2>
          <ol className={styles.rules}>
            {challenge.rules.map((rule, index) => <li key={index}>{rule}</li>)}
          </ol>
        </section>

        <section className={styles.prize} aria-labelledby="hadiah-challenge">
          <h2 id="hadiah-challenge">Hadiah</h2>
          <p>{challenge.prize}</p>
        </section>
      </div>
    </ShowcaseDetail>
  )
}
