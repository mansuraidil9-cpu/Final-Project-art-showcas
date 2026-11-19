'use client'

import Link from 'next/link'
import { useActionState, useId } from 'react'
import { updateArtworkLike } from './artwork-like-action'
import styles from './artwork-like.module.css'

const formatCount = new Intl.NumberFormat('id-ID')

export default function ArtworkLike({ artwork, canLike, overlay = false }) {
  const { id, liked, likes, title } = artwork
  const [state, action, pending] = useActionState(updateArtworkLike.bind(null, id, !liked), null)
  const countId = useId()
  const placement = overlay ? styles.overlay : styles.inline
  const content = (
    <>
      <span className={styles.heart} aria-hidden="true">{liked ? '♥' : '♡'}</span>
      <span id={countId}>{formatCount.format(likes)}<span className="sr-only"> suka</span></span>
    </>
  )

  if (!canLike) {
    return (
      <Link
        className={`${placement} ${styles.button}`}
        href="/login"
        aria-label={`Masuk untuk menyukai ${title}`}
        aria-describedby={countId}
        title="Masuk untuk menyukai karya"
      >
        {content}
      </Link>
    )
  }

  return (
    <form action={action} className={placement}>
      <button
        className={styles.button}
        type="submit"
        disabled={pending}
        aria-label={`Suka ${title}`}
        aria-describedby={countId}
        aria-pressed={liked}
      >
        {content}
      </button>
      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
    </form>
  )
}
