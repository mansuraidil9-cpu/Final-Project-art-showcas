'use client'

import { useActionState } from 'react'
import { roleLabels } from '@/lib/user-roles'
import { reviewCurator } from './curator-decisions'
import styles from './curator-queue.module.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'C'
}

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
              <span className={styles.avatar}>{initials(registration.name)}</span>
              <div className={styles.person}>
                <p className={styles.name}>{registration.name}</p>
                <p className={styles.email}>{registration.email}</p>
                <p className={styles.date}>
                  Akun {roleLabels[registration.role]} · Tanggal pengajuan <time dateTime={registration.appliedAt}>{registration.dateLabel}</time>
                </p>
              </div>
              <form className={styles.actions} action={review}>
                <input type="hidden" name="userId" value={registration.id} />
                <input type="hidden" name="applicationVersion" value={registration.applicationVersion} />
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
      ) : <p className={styles.empty}>Belum ada pengajuan Curator yang menunggu.</p>}
    </section>
  )
}
