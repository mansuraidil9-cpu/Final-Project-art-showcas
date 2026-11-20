'use client'

import { useActionState } from 'react'
import styles from './member/member-artworks.module.css'

export default function ActionForm({ action, submitLabel, danger = false, children }) {
  const [feedback, submit, pending] = useActionState(action, null)

  return (
    <form className={styles.form} action={submit} aria-busy={pending} onReset={event => event.preventDefault()}>
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
      {feedback?.success && <p className={styles.notice} role="status">{feedback.success}</p>}
      {children && <fieldset className={styles.fields} disabled={pending}>{children}</fieldset>}
      <button className={danger ? styles.dangerButton : styles.primaryButton} type="submit" disabled={pending}>
        {pending ? 'Memproses…' : submitLabel}
      </button>
    </form>
  )
}
