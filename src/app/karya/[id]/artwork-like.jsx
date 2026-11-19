'use client'

import Link from 'next/link'
import { useActionState, useId } from 'react'
import { updateArtworkLike } from './artwork-like-action'
import styles from './artwork.module.css'

const formatCount = new Intl.NumberFormat('id-ID')

export default function ArtworkLike({ id, likes, liked, canLike }) {
  const [state, action, pending] = useActionState(updateArtworkLike.bind(null, id, !liked), null)
  const countId = useId()
  const content = (
    <>
      <span className={styles.likeHeart} aria-hidden="true">{liked ? '♥' : '♡'}</span>
      <span id={countId}>{formatCount.format(likes)}<span className="sr-only"> suka</span></span>
    </>
  )

  if (!canLike) {
    return (
      <Link
        className={styles.likeCount}
        href="/login"
        aria-label="Masuk untuk menyukai karya"
        aria-describedby={countId}
      >
        {content}
      </Link>
    )
  }

  return (
    <form action={action}>
      <button
        className={styles.likeCount}
        type="submit"
        disabled={pending}
        aria-label="Suka karya"
        aria-describedby={countId}
        aria-pressed={liked}
      >
        {content}
      </button>
      {state?.error && <p className={styles.likeError} role="alert">{state.error}</p>}
    </form>
  )
}
