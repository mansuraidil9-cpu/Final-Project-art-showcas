'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setFavorite } from './artwork-interaction-actions'
import reactionStyles from './artwork-like.module.css'
import styles from './artwork-favorite.module.css'

// Menjaga status favorit lokal sampai data server diperbarui.
export default function ArtworkFavorite({ artwork, variant = 'detail', onChange }) {
  const { id, title } = artwork
  const [saved, setSaved] = useState(Boolean(artwork.favorited))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const label = saved ? 'Hapus dari favorit' : 'Simpan favorit'

  async function toggle() {
    if (pending) return
    setPending(true)
    setError('')
    const desired = !saved
    try {
      const result = await setFavorite(id, desired)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(desired)
        onChange?.(id, desired)
        router.refresh()
      }
    } catch {
      setError('Favorit belum bisa diperbarui. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={reactionStyles.form} data-variant={variant} aria-busy={pending}>
      <button type="button" onClick={toggle}
        className={reactionStyles.pill + ' ' + reactionStyles.button + ' ' + styles.button}
        data-variant={variant} aria-label={label + ' ' + title}
        aria-pressed={saved} disabled={pending}>
        <span className={reactionStyles.contents} aria-hidden="true">
          <span className={styles.bookmark} />
          {variant !== 'gallery' && <span>{variant === 'dashboard' ? label : saved ? 'Tersimpan' : 'Favorit'}</span>}
        </span>
      </button>
      {error && <p className={reactionStyles.error} role="alert">{error}</p>}
    </div>
  )
}
