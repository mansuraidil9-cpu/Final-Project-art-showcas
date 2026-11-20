import Image from 'next/image'
import { formatChallengeDateInput } from '@/lib/challenge-dates'
import styles from '../member/member-artworks.module.css'

export default function ChallengeFields({ challenge = null }) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="challenge-title">Judul challenge</label>
        <input id="challenge-title" name="title" defaultValue={challenge?.title} maxLength={120} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="challenge-description">Deskripsi</label>
        <textarea id="challenge-description" name="description" defaultValue={challenge?.description} rows={4} maxLength={2000} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="challenge-rules">Aturan</label>
        <textarea id="challenge-rules" name="rules" defaultValue={challenge?.rules.join('\n')} rows={4} maxLength={3000} aria-describedby="rules-hint" required />
        <p className={styles.hint} id="rules-hint">Tulis satu aturan per baris.</p>
      </div>
      <div className={styles.field}>
        <label htmlFor="challenge-prize">Hadiah</label>
        <textarea id="challenge-prize" name="prize" defaultValue={challenge?.prize} rows={3} maxLength={1000} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="challenge-start">Tanggal mulai (WITA)</label>
        <input id="challenge-start" type="datetime-local" name="startsAt" defaultValue={challenge ? formatChallengeDateInput(challenge.startsAt) : undefined} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="challenge-end">Tanggal selesai (WITA)</label>
        <input id="challenge-end" type="datetime-local" name="endsAt" defaultValue={challenge ? formatChallengeDateInput(challenge.deadline) : undefined} required />
      </div>
      {challenge && (
        <figure className={styles.currentImage}>
          <Image src={challenge.coverImage} alt={challenge.coverAlt} width={240} height={135} unoptimized />
          <figcaption>Banner saat ini</figcaption>
        </figure>
      )}
      <div className={styles.field}>
        <label htmlFor="challenge-banner">{challenge ? 'Ganti banner' : 'Gambar banner'}</label>
        <input id="challenge-banner" name="banner" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="banner-hint" required={!challenge} />
        <p className={styles.hint} id="banner-hint">JPEG, PNG, atau WebP hingga 5 MB.</p>
      </div>
    </>
  )
}
