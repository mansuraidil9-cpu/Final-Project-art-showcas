'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import ArtworkByline from './artwork-byline'
import ArtworkFavorite from './artwork-favorite'
import ArtworkLike from './artwork-like'
import ChallengeCard from './challenge-card'
import styles from './home.module.css'

export default function GalleryExplorer({ artworks, challenges, canLike, galleryPage = false }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('popular')

  const GalleryHeading = galleryPage ? 'h1' : 'h2'
  const ArtworkHeading = galleryPage ? 'h2' : 'h3'
  const searchLabel = galleryPage ? 'Cari karya, kreator, atau tag' : 'Cari karya, kreator, atau challenge'
  const galleryArtworks = artworks ?? []
  const categories = ['Semua', ...new Set(galleryArtworks.map(artwork => artwork.category))]
  const search = query.trim().toLocaleLowerCase('id')
  const filteredArtworks = galleryArtworks
    .filter(artwork => category === 'Semua' || artwork.category === category)
    .filter(artwork => [artwork.title, artwork.artist, ...artwork.tags].join(' ')
      .toLocaleLowerCase('id').includes(search))
    .sort((first, second) => sort === 'popular'
      ? second.likes - first.likes
      : second.uploadedAt.localeCompare(first.uploadedAt))

  let galleryMessage = 'Tidak ada karya yang cocok.'
  if (!artworks) {
    galleryMessage = 'Galeri belum bisa dimuat.'
  } else if (artworks.length === 0) {
    galleryMessage = 'Belum ada karya di galeri.'
  }

  const matchingChallenges = (challenges ?? []).filter(challenge =>
    `${challenge.title} ${challenge.category}`.toLocaleLowerCase('id').includes(search),
  )
  let challengeMessage = 'Tidak ada challenge yang cocok.'
  if (challenges === undefined) {
    challengeMessage = 'Challenge belum bisa dimuat.'
  } else if (!challenges.length) {
    challengeMessage = 'Belum ada challenge aktif.'
  }

  return (
    <>
      <section className={styles.gallery} id="galeri" aria-labelledby="judul-galeri">
        <div className={styles.sectionHeader}>
          <GalleryHeading id="judul-galeri" className={galleryPage ? styles.pageTitle : undefined}>Galeri Karya</GalleryHeading>
          <label className={styles.search}>
            <span className="sr-only">{searchLabel}</span>
            <span className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder={searchLabel}
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.controls}>
          <div className={styles.categories} role="group" aria-label="Kategori karya">
            {categories.map(name => (
              <button
                key={name}
                type="button"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className={styles.sort} role="group" aria-label="Urutan karya">
            <button type="button" aria-pressed={sort === 'popular'} onClick={() => setSort('popular')}>
              Populer
            </button>
            <button type="button" aria-pressed={sort === 'latest'} onClick={() => setSort('latest')}>
              Terbaru
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{filteredArtworks.length} karya ditemukan</p>
        {filteredArtworks.length > 0 ? (
          <div className={styles.artworks}>
            {filteredArtworks.map(artwork => (
              <article className={styles.artwork} key={artwork.id}>
                <Link className={styles.artworkLink} href={`/karya/${artwork.id}`}>
                  <div className={styles.artworkImage}>
                    <Image
                      src={artwork.imageSrc}
                      alt=""
                      fill
                      unoptimized={artwork.isUploaded}
                      sizes="(max-width: 500px) 94vw, (max-width: 900px) 48vw, 32vw"
                    />
                  </div>
                  <div className={styles.artworkCaption}>
                    <div>
                      <p className={styles.artworkCategory}>{artwork.category}</p>
                      <ArtworkHeading className={styles.artworkTitle}>{artwork.title}</ArtworkHeading>
                      {!artwork.creatorId && <ArtworkByline artwork={artwork} className={styles.artworkArtist} />}
                    </div>
                    <span className={`${styles.arrow} ${styles.arrowOut}`} aria-hidden="true" />
                  </div>
                </Link>
                <div className={styles.artworkReaction}>
                  <ArtworkLike artwork={artwork} canLike={canLike && !artwork.isOwner} variant="gallery" />
                  {canLike && !artwork.isOwner && <ArtworkFavorite artwork={artwork} variant="gallery" />}
                </div>
                <div className={styles.artworkLinks}>
                  {artwork.creatorId && <ArtworkByline artwork={artwork} className={styles.artworkUploader} />}
                  <Link className={styles.artworkComments} href={`/karya/${artwork.id}#komentar`}>
                    Komentar ({artwork.commentCount.toLocaleString('id-ID')})
                    <span className="sr-only"> untuk {artwork.title}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyGallery}>
            <p>{galleryMessage}</p>
            {search && matchingChallenges.length > 0 && (
              <a className={styles.textLink} href="#challenge">
                Lihat hasil challenge <span className={`${styles.arrow} ${styles.arrowDown}`} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </section>

      {!galleryPage && (
        <section className={styles.challenge} id="challenge" aria-labelledby="judul-challenge">
          <h2 id="judul-challenge">Challenge Aktif</h2>
          {matchingChallenges.length > 0 ? matchingChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} statusLabel="Sedang berlangsung" />
          )) : <p className={styles.emptyGallery}>{challengeMessage}</p>}
        </section>
      )}
    </>
  )
}
