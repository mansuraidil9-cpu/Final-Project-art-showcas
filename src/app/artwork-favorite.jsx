'use client'

import { useActionState } from 'react'
import { setFavorite } from './artwork-interaction-actions'
import reactionStyles from './artwork-like.module.css'
import styles from './artwork-favorite.module.css'

export default function ArtworkFavorite({ artwork, variant = 'detail' }) {
  const { id, title, favorited } = artwork
  const [feedback, submit, pending] = useActionState(setFavorite.bind(null, id, !favorited), null)
  const label = variant === 'dashboard' ? 'Hapus dari favorit' : 'Favorit'

  return (
    <form className={reactionStyles.form} data-variant={variant} action={submit} aria-busy={pending}>
      <button
        className={`${reactionStyles.pill} ${reactionStyles.button} ${styles.button}`}
        data-variant={variant}
        type="submit"
        aria-label={`${label} ${title}`}
        aria-pressed={favorited}
        disabled={pending}
      >
        <span className={reactionStyles.contents} aria-hidden="true">
          <span className={styles.bookmark} />
          {variant !== 'gallery' && <span>{label}</span>}
        </span>
      </button>
      {feedback?.error && <p className={reactionStyles.error} role="alert">{feedback.error}</p>}
    </form>
  )
}
