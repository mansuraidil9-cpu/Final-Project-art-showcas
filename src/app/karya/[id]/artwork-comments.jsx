'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { addComment, deleteComment } from '../../artwork-interaction-actions'
import styles from './artwork.module.css'

const commentDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Makassar',
})

function CommentForm({ artworkId }) {
  const [body, setBody] = useState('')
  const [feedback, submit, pending] = useActionState(async (_previousState, formData) => {
    const result = await addComment(artworkId, formData)
    if (!result) setBody('')
    return result
  }, null)

  return (
    <form className={styles.commentForm} action={submit} aria-busy={pending}>
      <label htmlFor="comment-body">Tulis komentar</label>
      <textarea
        id="comment-body"
        name="body"
        rows={3}
        value={body}
        onChange={event => setBody(event.currentTarget.value)}
        aria-describedby={feedback?.error ? 'comment-error' : undefined}
        required
        disabled={pending}
      />
      {feedback?.error && <p id="comment-error" className={styles.commentError} role="alert">{feedback.error}</p>}
      <button className={styles.commentSubmit} type="submit" disabled={pending}>
        {pending ? 'Mengirim…' : 'Kirim komentar'}
      </button>
    </form>
  )
}

function DeleteComment({ artworkId, commentId }) {
  const [confirming, setConfirming] = useState(false)
  const [feedback, submit, pending] = useActionState(deleteComment.bind(null, artworkId, commentId), null)

  if (confirming) {
    return (
      <form className={styles.commentDelete} action={submit} aria-label="Konfirmasi hapus komentar">
        <p>Hapus komentar ini?</p>
        <button type="button" onClick={() => setConfirming(false)} disabled={pending}>Batal</button>
        <button type="submit" disabled={pending}>{pending ? 'Menghapus…' : 'Ya, hapus'}</button>
        {feedback?.error && <p className={styles.commentError} role="alert">{feedback.error}</p>}
      </form>
    )
  }

  return (
    <button className={styles.commentDeleteLink} type="button" onClick={() => setConfirming(true)}>
      Hapus komentar
    </button>
  )
}

export default function ArtworkComments({ artworkId, comments, canComment, guest }) {
  return (
    <section id="komentar" className={styles.comments} aria-labelledby="judul-komentar">
      <h2 id="judul-komentar">Komentar ({comments.length.toLocaleString('id-ID')})</h2>
      <div className={styles.commentContent}>
        {canComment && <CommentForm artworkId={artworkId} />}
        {guest && <Link className={styles.commentSignIn} href="/login">Masuk untuk berkomentar</Link>}
        {comments.length ? (
          <ol className={styles.commentList} aria-label="Daftar komentar" aria-live="polite">
            {comments.map(comment => (
              <li key={comment.id}>
                <div className={styles.commentByline}>
                  <strong>{comment.author}</strong>
                  <time dateTime={comment.createdAt}>{commentDate.format(new Date(comment.createdAt))}</time>
                </div>
                <p className={styles.commentBody}>{comment.body}</p>
                {comment.canDelete && <DeleteComment artworkId={artworkId} commentId={comment.id} />}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.commentEmpty} role="status">Belum ada komentar.</p>
        )}
      </div>
    </section>
  )
}
