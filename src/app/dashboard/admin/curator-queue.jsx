'use client'

import { useActionState } from 'react'
import { reviewCurator } from './curator-decisions'
import styles from './curator-queue.module.css'

export default function CuratorQueue({ registrations }) {
  const [feedback, review, pending] = useActionState(reviewCurator, null)

  return (
    <section className={styles.queue} aria-labelledby="curator-queue-title">
      <div className={styles.heading}>
        <h2 id="curator-queue-title">Verifikasi Curator</h2>
        <p>{registrations.length} menunggu persetujuan</p>
      </div>

      {feedback && (
        <p
          className={styles.notice}
          data-error={feedback.error}
          role={feedback.error ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      )}

      {registrations.length ? (
        <ul className={styles.list}>
          {registrations.map(registration => (
            <li className={styles.row} key={registration.id}>
              <div>
                <p className={styles.name}>{registration.name}</p>
                <p className={styles.email}>{registration.email}</p>
                <p className={styles.date}>
                  Mendaftar <time dateTime={registration.createdAt}>{registration.dateLabel}</time>
                </p>
              </div>
              <form className={styles.actions} action={review}>
                <input type="hidden" name="userId" value={registration.id} />
                <button
                  className={styles.approve}
                  type="submit"
                  name="decision"
                  value="approved"
                  aria-label={`Setujui ${registration.name}`}
                  disabled={pending}
                >
                  Setujui
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="rejected"
                  aria-label={`Tolak ${registration.name}`}
                  disabled={pending}
                >
                  Tolak
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>Belum ada pendaftaran Curator yang menunggu.</p>}
    </section>
  )
}
