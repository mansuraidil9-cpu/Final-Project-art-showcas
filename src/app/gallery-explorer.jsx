'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import credits from '../../public/alteria/credits.json'
import styles from './home.module.css'

const artworks = credits.slice(1).map((artwork, index) => ({
  ...artwork,
  id: index + 1,
  likes: [88, 96, 71, 82, 54, 63][index],
  uploadOrder: index,
}))

const categories = ['Semua', ...new Set(artworks.map(artwork => artwork.category))]

const challenge = {
  title: 'Kota Setelah Hujan',
  category: 'Lukisan · Ilustrasi · Fotografi',
  description: 'Ceritakan suasana kota setelah hujan melalui medium pilihanmu.',
  deadline: '2026-11-30',
  deadlineLabel: '30 November 2026',
}

export default function GalleryExplorer() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('popular')

  const search = query.trim().toLocaleLowerCase('id')
  const filteredArtworks = artworks
    .filter(artwork => category === 'Semua' || artwork.category === category)
    .filter(artwork => `${artwork.title} ${artwork.artist}`.toLocaleLowerCase('id').includes(search))
    .sort((first, second) => sort === 'popular'
      ? second.likes - first.likes
      : second.uploadOrder - first.uploadOrder)

  const challengeMatches = `${challenge.title} ${challenge.category}`
    .toLocaleLowerCase('id').includes(search)

  return (
    <>
      <section className={styles.gallery} id="galeri" aria-labelledby="judul-galeri">
        <div className={styles.sectionHeader}>
          <h2 id="judul-galeri">Galeri Karya</h2>
          <label className={styles.search}>
            <span className="sr-only">Cari karya, kreator, atau challenge</span>
            <span className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Cari karya, kreator, atau challenge"
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
                      src={`/alteria/${artwork.filename}`}
                      alt=""
                      fill
                      sizes="(max-width: 500px) 94vw, (max-width: 900px) 48vw, 32vw"
                    />
                  </div>
                  <div className={styles.artworkCaption}>
                    <div>
                      <p className={styles.artworkCategory}>{artwork.category}</p>
                      <h3>{artwork.title}</h3>
                      <p className={styles.artworkArtist}>{artwork.artist} · {artwork.date}</p>
                    </div>
                    <span className={`${styles.arrow} ${styles.arrowOut}`} aria-hidden="true" />
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyGallery}>
            <p>Tidak ada karya yang cocok.</p>
            {search && challengeMatches && (
              <a className={styles.textLink} href="#challenge">
                Lihat hasil challenge <span className={`${styles.arrow} ${styles.arrowDown}`} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </section>

      <section className={styles.challenge} id="challenge" aria-labelledby="judul-challenge">
        <h2 id="judul-challenge">Challenge Aktif</h2>
        {challengeMatches ? (
          <article className={styles.challengeCard}>
            <div className={styles.challengeImage}>
              <Image
                src="/alteria/the-oxbow.jpg"
                alt="Bentang alam dengan langit mendung dan hamparan sungai."
                fill
                sizes="(max-width: 760px) 94vw, 44vw"
              />
            </div>
            <div className={styles.challengeCopy}>
              <p className={styles.eyebrow}>{challenge.category}</p>
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
              <p className={styles.deadline}>
                Sampai <time dateTime={challenge.deadline}>{challenge.deadlineLabel}</time>
              </p>
              <Link className={styles.textLink} href="/challenge/1">
                Lihat Challenge <span className={`${styles.arrow} ${styles.arrowOut}`} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ) : <p className={styles.emptyGallery}>Tidak ada challenge yang cocok.</p>}
      </section>
    </>
  )
}
