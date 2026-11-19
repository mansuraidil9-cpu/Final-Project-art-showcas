'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  artworkCategories,
  maxArtworkDescriptionLength,
  maxArtworkImageBytes,
  maxArtworkTitleLength,
} from '@/lib/artwork-fields'
import { saveArtwork } from './artwork-actions'
import styles from './member-artworks.module.css'

export default function ArtworkForm({ artwork = null }) {
  const editing = artwork !== null
  const [feedback, submit, pending] = useActionState(saveArtwork.bind(null, artwork?.id ?? null), null)
  const [fields, setFields] = useState(() => ({
    title: artwork?.title ?? '',
    description: artwork?.description ?? '',
    category: artwork?.category ?? '',
    tags: artwork?.tags.join(', ') ?? '',
  }))
  const [imageError, setImageError] = useState('')

  function updateField(event) {
    const { name, value } = event.currentTarget
    setFields(current => ({ ...current, [name]: value }))
  }

  function checkImage(event) {
    const input = event.currentTarget
    const message = input.files[0]?.size > maxArtworkImageBytes ? 'Ukuran gambar maksimal 5 MB.' : ''
    input.setCustomValidity(message)
    setImageError(message)
  }

  return (
    <form
      className={styles.form}
      action={submit}
      aria-busy={pending}
      onReset={event => event.preventDefault()}
    >
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}

      <fieldset className={styles.fields} disabled={pending}>
        <legend className="sr-only">Informasi karya</legend>
        <div className={styles.field}>
          <label htmlFor="artwork-title">Judul karya</label>
          <input
            id="artwork-title"
            name="title"
            value={fields.title}
            onChange={updateField}
            maxLength={maxArtworkTitleLength}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="artwork-description">Deskripsi</label>
          <textarea
            id="artwork-description"
            name="description"
            value={fields.description}
            onChange={updateField}
            maxLength={maxArtworkDescriptionLength}
            rows={5}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="artwork-category">Kategori</label>
          <select id="artwork-category" name="category" value={fields.category} onChange={updateField} required>
            <option value="" disabled>Pilih kategori</option>
            {artworkCategories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="artwork-tags">Tag</label>
          <input
            id="artwork-tags"
            name="tags"
            value={fields.tags}
            onChange={updateField}
            aria-describedby="artwork-tag-help"
            required
          />
          <p className={styles.hint} id="artwork-tag-help">
            Pisahkan dengan koma. Maksimal 10 tag, masing-masing 32 karakter.
          </p>
        </div>

        {editing ? (
          <figure className={styles.currentImage}>
            <figcaption>Gambar karya</figcaption>
            <Image
              src={artwork.imageSrc}
              alt={artwork.imageAlt}
              width={artwork.width}
              height={artwork.height}
              sizes="10rem"
              unoptimized={artwork.isUploaded}
            />
          </figure>
        ) : (
          <div className={styles.field}>
            <label htmlFor="artwork-image">Gambar karya</label>
            <input
              id="artwork-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={checkImage}
              aria-describedby={imageError ? 'artwork-image-help artwork-image-error' : 'artwork-image-help'}
              aria-invalid={Boolean(imageError)}
              required
            />
            <p className={styles.hint} id="artwork-image-help">Format JPEG, PNG, atau WebP. Maksimal 5 MB.</p>
            {imageError && <p id="artwork-image-error" className={styles.error} role="alert">{imageError}</p>}
          </div>
        )}
      </fieldset>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Unggah karya'}
        </button>
        <Link href="/dashboard/member">Kembali ke Kelola Karya</Link>
      </div>
    </form>
  )
}
