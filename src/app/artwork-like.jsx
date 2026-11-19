'use client'

import { useActionState } from 'react'
import { setLike } from './artwork-interaction-actions'
import styles from './artwork-like.module.css'

const likeCount = new Intl.NumberFormat('id-ID')

function LikeContents({ count, liked, variant }) {
  return (
    <span className={styles.contents} aria-hidden="true">
      <span className={styles.heart}>{liked ? '♥︎' : '♡'}</span>
      {variant === 'detail' && <span>{liked ? 'Disukai' : 'Suka'}</span>}
      <span className={styles.number}>{count}</span>
    </span>
  )
}

function LikeButton({ id, title, count, liked, variant }) {
  const [feedback, submit, pending] = useActionState(setLike.bind(null, id, !liked), null)

  return (
    <form className={styles.form} data-variant={variant} action={submit} aria-busy={pending}>
      <button
        className={`${styles.pill} ${styles.button}`}
        data-variant={variant}
        type="submit"
        aria-label={`Suka karya ${title}`}
        aria-pressed={liked}
        disabled={pending}
      >
        <LikeContents count={count} liked={liked} variant={variant} />
      </button>
      <span className="sr-only" role="status">{count} suka</span>
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
    </form>
  )
}

export default function ArtworkLike({ artwork, canLike, variant = 'detail' }) {
  const count = likeCount.format(artwork.likes)

  if (!canLike) {
    return (
      <p className={`${styles.pill} ${styles.count}`} data-variant={variant}>
        <span className="sr-only">{count} suka</span>
        <LikeContents count={count} variant={variant} />
      </p>
    )
  }

  return (
    <LikeButton id={artwork.id} title={artwork.title} count={count} liked={artwork.liked} variant={variant} />
  )
}
