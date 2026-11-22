import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import credits from '../../../../public/alteria/credits.json'
import ActionForm from '@/app/dashboard/action-form'
import sectionStyles from '@/app/dashboard/member/member-artworks.module.css'
import { getMemberArtworks } from '@/lib/artworks'
import { challengeStatusLabels } from '@/lib/challenge-dates'
import { challengeTimeZone, getChallengeById, getChallengeSubmissions, getMemberChallengeSubmissions } from '@/lib/challenges'
import { getCurrentUser } from '@/lib/session'
import SubmissionCards from '../submission-cards'
import { submitArtwork, withdrawArtwork } from '../submission-actions'
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
  const [challenge, user] = await Promise.all([getChallengeById(id), getCurrentUser()])

  if (!challenge) notFound()

  const memberId = user?.role === 'member' ? user.id : null
  const canParticipate = memberId && challenge.status !== 'ended'
  const [submissions, ownSubmissions] = await Promise.all([
    getChallengeSubmissions(id),
    canParticipate ? getMemberChallengeSubmissions(memberId, id) : [],
  ])
  const ownSubmission = ownSubmissions[0]
  const canSubmit = canParticipate && challenge.status === 'active' && challenge.curatorId !== memberId && !ownSubmission
  const availableArtworks = canSubmit ? await getMemberArtworks(memberId) : []
  const winners = submissions.filter(item => item.rank !== null).sort((a, b) => a.rank - b.rank)
  const coverCredit = credits.find(artwork => `/alteria/${artwork.filename}` === challenge.coverImage)

  return (
    <ShowcaseDetail backHref="/challenge" backLabel="Kembali ke Challenge" showFooter>
      <section className={styles.hero} aria-labelledby="judul-challenge">
        <div className={styles.introduction}>
          <p className={homeStyles.eyebrow}>{challengeStatusLabels[challenge.status]} · {challenge.category}</p>
          <h1 id="judul-challenge">{challenge.title}</h1>
          <p className={styles.description}>{challenge.description}</p>
          {challenge.status === 'upcoming' && <p>Mulai {challenge.startLabel} · {deadlineTime.format(new Date(challenge.startsAt))} WITA</p>}

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
              unoptimized={challenge.isUploaded}
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
      {(ownSubmission || canSubmit) && (
        <section className={sectionStyles.section} aria-labelledby="ikut-challenge">
          <header className={sectionStyles.sectionHeader}><h2 id="ikut-challenge">Ikut Challenge</h2></header>
          {ownSubmission ? (
            <ActionForm action={withdrawArtwork.bind(null, id)} submitLabel="Tarik karya">
              <p>Karya yang dikirim <Link className={homeStyles.textLink} href={`/karya/${ownSubmission.artworkId}`}>{ownSubmission.title}</Link></p>
            </ActionForm>
          ) : availableArtworks.length ? (
            <ActionForm action={submitArtwork.bind(null, id)} submitLabel="Kirim karya">
              <div className={sectionStyles.field}>
                <label htmlFor="select-challenge-artwork">Pilih karya dari portofoliomu</label>
                <select id="select-challenge-artwork" name="artworkId" defaultValue="" required>
                  <option value="" disabled>Pilih karya</option>
                  {availableArtworks.map(artwork => <option key={artwork.id} value={artwork.id}>{artwork.title}</option>)}
                </select>
              </div>
            </ActionForm>
          ) : (
            <p className={sectionStyles.empty}>Portofoliomu masih kosong. <Link href="/dashboard/member/karya/baru">Unggah karya</Link>.</p>
          )}
        </section>
      )}

      <section className={sectionStyles.section} aria-labelledby="galeri-submisi">
        <header className={sectionStyles.sectionHeader}><h2 id="galeri-submisi">Galeri Submisi</h2></header>
        {submissions.length ? <SubmissionCards submissions={submissions} /> : <p className={sectionStyles.empty}>Belum ada karya yang dikirim.</p>}
      </section>
      <section className={sectionStyles.section} aria-labelledby="pemenang-challenge">
        <header className={sectionStyles.sectionHeader}><h2 id="pemenang-challenge">Pemenang</h2></header>
        {winners.length ? <SubmissionCards submissions={winners} /> : <p className={sectionStyles.empty}>Pemenang belum diumumkan.</p>}
      </section>
    </ShowcaseDetail>
  )
}
