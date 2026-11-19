'use client'

import { useActionState, useState } from 'react'
import { deleteArtwork } from './artwork-actions'
import styles from './member-artworks.module.css'

function DeleteConfirmation({ id, title, onCancel }) {
  const [feedback, submit, pending] = useActionState(deleteArtwork.bind(null, id), null)

  return (
    <form className={styles.confirmation} action={submit} aria-label={`Konfirmasi hapus ${title}`}>
      <p>Hapus “{title}” dari galeri?</p>
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
      <div className={styles.confirmationActions}>
        <button type="button" onClick={onCancel} disabled={pending}>Batal</button>
        <button className={styles.dangerButton} type="submit" disabled={pending}>
          {pending ? 'Menghapus…' : 'Hapus karya'}
        </button>
      </div>
    </form>
  )
}

export default function ArtworkDelete({ id, title }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return <DeleteConfirmation id={id} title={title} onCancel={() => setConfirming(false)} />
  }

  return (
    <button
      className={styles.deleteLink}
      type="button"
      aria-label={`Hapus ${title}`}
      onClick={() => setConfirming(true)}
    >
      Hapus
    </button>
  )
}
