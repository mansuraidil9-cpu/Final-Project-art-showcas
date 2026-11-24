'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setLike, setFavorite } from './artwork-interaction-actions'
import { readGalleryArtworkDetails } from './gallery-artwork-details'
import ArtworkByline from './artwork-byline'
import ArtworkMoreMenu from './artwork-more-menu'
import ChallengeCard from './challenge-card'
import styles from './gallery-museum.module.css'
import homeStyles from './home.module.css'

const categoriesList = ['Semua', 'Lukisan', 'Seni cetak', 'Keramik']

// SVG memastikan ikon hati dan bookmark tampil konsisten di semua perangkat.
function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BookmarkIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function GalleryReactions({ artwork, canLike, state, busy, onReact }) {
  const liked = state?.liked ?? artwork.liked
  const favorited = state?.favorited ?? artwork.favorited
  const count = state?.likes ?? artwork.likes
  const disabled = busy?.id === artwork.id
  return (
    <div className={styles.reactions} aria-label={'Interaksi karya ' + artwork.title}>
      {canLike && !artwork.isOwner ? (
        <button type="button" className={styles.likeButton} aria-pressed={Boolean(liked)}
          aria-label={(liked ? 'Batalkan apresiasi' : 'Apresiasi') + ' karya ' + artwork.title}
          title={liked ? 'Batalkan apresiasi' : 'Apresiasi karya'}
          disabled={disabled} onClick={() => onReact(artwork, 'like', !liked)}>
          <HeartIcon filled={Boolean(liked)} />
          <span className={styles.likeCount}>{Number(count).toLocaleString('id-ID')}</span>
        </button>
      ) : (
        <span className={styles.likeStatic} aria-label={count + ' apresiasi'}>
          <HeartIcon />
          <span className={styles.likeCount}>{Number(count).toLocaleString('id-ID')}</span>
        </span>
      )}
      {canLike && !artwork.isOwner && (
        <button type="button" className={styles.saveButton} aria-pressed={Boolean(favorited)}
          aria-label={(favorited ? 'Hapus dari Favorit' : 'Simpan Favorit') + ' karya ' + artwork.title}
          title={favorited ? 'Hapus dari Karya Favorit' : 'Simpan ke Karya Favorit'}
          disabled={disabled} onClick={() => onReact(artwork, 'favorite', !favorited)}>
          <BookmarkIcon filled={Boolean(favorited)} />
        </button>
      )}
    </div>
  )
}

function MuseumArtworkCard({ artwork, canLike, state, busy, onReact, onOpen, Heading }) {
  return (
    <article className={styles.artworkCard}>
      <button type="button" className={styles.frameButton} onClick={() => onOpen(artwork.id)}
        aria-label={'Lihat pratinjau karya ' + artwork.title}>
        <span className={styles.matFrame}>
          <span className={styles.frameImage}>
            <Image src={artwork.imageSrc} alt="" fill unoptimized={artwork.isUploaded}
              sizes="(max-width: 580px) 90vw, (max-width: 960px) 45vw, 28vw" />
          </span>
        </span>
      </button>
      <div className={styles.artworkInfo}>
        <div className={styles.metaLine}>
          <span>{artwork.category}</span>
          {artwork.challengeTitle && <span className={styles.challengeTag}>{artwork.challengeTitle}</span>}
        </div>
        <Heading className={styles.artworkTitle}>
          <button type="button" onClick={() => onOpen(artwork.id)}>{artwork.title}</button>
        </Heading>
        <div className={styles.byline}>
          <ArtworkByline artwork={artwork} />
        </div>
        <div className={styles.artworkActionRow}>
          <button type="button" className={styles.detailButton}
            onClick={() => onOpen(artwork.id)} aria-label={'Lihat detail ' + artwork.title}>
            Lihat Detail <span aria-hidden="true">↗</span>
          </button>
          <GalleryReactions artwork={artwork} canLike={canLike} state={state}
            busy={busy} onReact={onReact} />
        </div>
        <div className={styles.cardFoot}>
          <Link href={'/karya/' + artwork.id + '#komentar'}>
            Komentar ({Number(artwork.commentCount || 0).toLocaleString('id-ID')})
          </Link>

        </div>
      </div>
    </article>
  )
}

function GalleryLightbox({ artwork, artworks, canLike, state, busy, onReact, onClose, onNavigate }) {
  const dialogRef = useRef(null)
  const [detail, setDetail] = useState(null)
  const [detailPending, setDetailPending] = useState(true)
  const currentIndex = artworks.findIndex(item => item.id === artwork.id)
  const title = 'Inspeksi karya ' + artwork.title
  // Jangan tampilkan deskripsi lukisan sebelumnya saat tombol navigasi ditekan.
  const selectedDetail = detail?.id === artwork.id ? detail : null
  const onCloseRef = useRef(onClose)
  const onNavigateRef = useRef(onNavigate)
  useEffect(() => {
    onCloseRef.current = onClose
    onNavigateRef.current = onNavigate
  }, [onClose, onNavigate])

  useEffect(() => {
    let active = true
    readGalleryArtworkDetails(artwork.id).then(result => {
      if (active) setDetail(result)
    }).catch(() => {
      if (active) setDetail(null)
    }).finally(() => {
      if (active) setDetailPending(false)
    })
    return () => { active = false }
  }, [artwork.id])

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    function onKey(event) {
      // Dialog laporan memiliki penanganan keyboard sendiri.
      if (document.querySelector('[data-artwork-report-dialog]')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onNavigateRef.current(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNavigateRef.current(1)
      } else if (event.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled),a[href]') || [])
          .filter(element => element.getClientRects().length)
        if (!items.length) return
        if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === dialogRef.current)) {
          event.preventDefault()
          items[items.length - 1].focus()
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault()
          items[0].focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return (
    <div className={styles.lightboxBackdrop} onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className={styles.lightbox} role="dialog" aria-modal="true"
        aria-label={title} ref={dialogRef} tabIndex={-1}>
        <ArtworkMoreMenu key={artwork.id} artwork={artwork} canReport={canLike} />
        <button type="button" className={styles.closeButton} onClick={onClose}
          aria-label="Tutup pratinjau karya">×</button>
        <div className={styles.lightboxVisual}>
          <div className={styles.lightboxMat}>
            <div className={styles.lightboxImage}>
              <Image src={artwork.imageSrc} alt={artwork.title} fill
                unoptimized={artwork.isUploaded} sizes="(max-width: 800px) 90vw, 600px" />
            </div>
          </div>
          <div className={styles.lightboxNavigation}>
            <button type="button" onClick={() => onNavigate(-1)}
              disabled={currentIndex <= 0} aria-label="Karya sebelumnya">← Sebelumnya</button>
            <span>{String(currentIndex + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}</span>
            <button type="button" onClick={() => onNavigate(1)}
              disabled={currentIndex >= artworks.length - 1} aria-label="Karya berikutnya">Berikutnya →</button>
          </div>
        </div>
        <div className={styles.lightboxCopy}>
          <p className={styles.mediumLabel}>{artwork.category}</p>
          {artwork.challengeTitle && <span className={styles.challengeTag}>{artwork.challengeTitle}</span>}
          <h2>{artwork.title}</h2>
          <p className={styles.detailArtist}>oleh {artwork.artist}</p>
          <div className={styles.curatorial}>
            <span>CATATAN KURATORIAL</span>
            {detailPending ? <p>Memuat keterangan karya…</p> : (
              <p>{selectedDetail?.description || 'Tidak ada deskripsi tambahan untuk karya ini.'}</p>
            )}
          </div>
          <dl className={styles.specs}>
            <div><dt>Medium</dt><dd>{artwork.category}</dd></div>
            {artwork.date && <div><dt>Tahun / periode</dt><dd>{artwork.date}</dd></div>}
            {selectedDetail?.width && selectedDetail?.height && (
              <div><dt>Resolusi gambar</dt><dd>{selectedDetail.width} × {selectedDetail.height} px</dd></div>
            )}
            {selectedDetail?.rights && <div><dt>Hak karya</dt><dd>{selectedDetail.rights}</dd></div>}
          </dl>
          <GalleryReactions artwork={artwork} canLike={canLike} state={state}
            busy={busy} onReact={onReact} />
          <Link href={'/karya/' + artwork.id} className={styles.detailLink}>
            Buka Halaman Karya ↗
          </Link>
        </div>
      </section>
    </div>
  )
}

export default function GalleryExplorer({ artworks, challenges, canLike, galleryPage = false, initialQuery = '' }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('popular')
  const [density, setDensity] = useState('three')
  const [selectedId, setSelectedId] = useState(null)
  const [reactions, setReactions] = useState({})
  const [busy, setBusy] = useState(null)
  const [errors, setErrors] = useState({})
  const openerRef = useRef(null)
  const galleryArtworks = useMemo(() => artworks ?? [], [artworks])
  const allCategories = useMemo(() => [
    ...categoriesList,
    ...new Set(galleryArtworks.map(item => item.category).filter(name => !categoriesList.includes(name))),
  ], [galleryArtworks])
  const search = query.trim().toLocaleLowerCase('id')
  const filteredArtworks = useMemo(() => galleryArtworks
    .filter(artwork => category === 'Semua' || artwork.category === category)
    .filter(artwork => [artwork.title, artwork.artist, ...(artwork.tags || []), artwork.challengeTitle || '']
      .join(' ').toLocaleLowerCase('id').includes(search))
    .sort((first, second) => sort === 'popular'
      ? (reactions[second.id]?.likes ?? second.likes) - (reactions[first.id]?.likes ?? first.likes)
      : second.uploadedAt.localeCompare(first.uploadedAt)),
  [galleryArtworks, category, search, sort, reactions])
  const selected = filteredArtworks.find(item => item.id === selectedId) || null
  const GalleryHeading = galleryPage ? 'h1' : 'h2'
  const ArtworkHeading = galleryPage ? 'h2' : 'h3'

  function openArtwork(id) {
    openerRef.current = document.activeElement
    setSelectedId(id)
  }
  const closeArtwork = useCallback(() => {
    setSelectedId(null)
    requestAnimationFrame(() => {
      if (openerRef.current?.isConnected) openerRef.current.focus()
    })
  }, [])
  function navigateArtwork(step) {
    const index = filteredArtworks.findIndex(item => item.id === selectedId)
    const next = filteredArtworks[index + step]
    if (next) setSelectedId(next.id)
  }
  async function react(artwork, kind, desired) {
    if (busy) return
    setBusy({ id: artwork.id, kind })
    setErrors(current => ({ ...current, [artwork.id]: null }))
    const previous = reactions[artwork.id] || {
      likes: artwork.likes, liked: artwork.liked, favorited: artwork.favorited,
    }
    try {
      const result = kind === 'like'
        ? await setLike(artwork.id, desired)
        : await setFavorite(artwork.id, desired)
      if (result?.error) {
        setErrors(current => ({ ...current, [artwork.id]: result.error }))
      } else {
        setReactions(current => ({
          ...current,
          [artwork.id]: {
            ...previous,
            ...(kind === 'like' ? {
              liked: desired,
              likes: Math.max(0, Number(previous.likes) + (desired ? 1 : -1)),
            } : { favorited: desired }),
          },
        }))
        router.refresh()
      }
    } catch {
      setErrors(current => ({ ...current, [artwork.id]: 'Aksi belum berhasil. Coba lagi.' }))
    } finally {
      setBusy(null)
    }
  }

  function changeQuery(value) {
    setQuery(value)
    // Gunakan replaceState, bukan pushState: tombol Back kembali dengan kata kunci sebelumnya.
    const url = new URL(window.location.href)
    if (value.trim()) url.searchParams.set('cari', value.trim())
    else url.searchParams.delete('cari')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }

  function resetFilters() {
    setCategory('Semua')
    changeQuery('')
  }

  const matchingChallenges = (challenges ?? []).filter(challenge =>
    (challenge.title + ' ' + challenge.category).toLocaleLowerCase('id').includes(search))
  let galleryMessage = 'Tidak ada karya yang cocok.'
  if (!artworks) galleryMessage = 'Galeri belum bisa dimuat.'
  else if (artworks.length === 0) galleryMessage = 'Belum ada karya di galeri.'
  let challengeMessage = 'Tidak ada challenge yang cocok.'
  if (challenges === undefined) challengeMessage = 'Challenge belum bisa dimuat.'
  else if (!challenges.length) challengeMessage = 'Belum ada challenge aktif.'

  return (
    <>
      <section className={`${homeStyles.gallery} ${styles.gallerySection}`} id="galeri" aria-labelledby="judul-galeri">
        <div className={styles.galleryHeading}>
          <div>
            <span className={styles.eyebrow}>KOLEKSI TERKURASI</span>
            <GalleryHeading id="judul-galeri">Galeri Karya</GalleryHeading>
            <p>{galleryArtworks.length.toLocaleString('id-ID')} karya dalam koleksi ALTERIA</p>
          </div>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input type="search" aria-label="Cari karya, kreator, atau challenge"
              placeholder="Cari karya, kreator, atau challenge..."
              value={query} onChange={event => changeQuery(event.target.value)} />
            {query && <button type="button" aria-label="Hapus pencarian" onClick={() => changeQuery('')}>×</button>}
          </div>
        </div>
        <div className={styles.filterControls}>
          <div className={styles.categoryTabs} role="group" aria-label="Kategori medium">
            {allCategories.map(name => (
              <button type="button" key={name} aria-pressed={category === name}
                onClick={() => setCategory(name)}>
                {name}
                <span>{(name === 'Semua' ? galleryArtworks : galleryArtworks.filter(item => item.category === name)).length}</span>
              </button>
            ))}
          </div>
          <div className={styles.rightControls}>
            <div className={styles.sortTabs} role="group" aria-label="Urutan karya">
              <button type="button" aria-pressed={sort === 'popular'} onClick={() => setSort('popular')}>Populer</button>
              <button type="button" aria-pressed={sort === 'latest'} onClick={() => setSort('latest')}>Terbaru</button>
            </div>
            <div className={styles.layoutTabs} role="group" aria-label="Kepadatan tampilan galeri">
              <button type="button" aria-pressed={density === 'three'} onClick={() => setDensity('three')}
                aria-label="Grid tiga kolom" title="Grid tiga kolom">▦</button>
              <button type="button" aria-pressed={density === 'two'} onClick={() => setDensity('two')}
                aria-label="Galeri luas dua kolom" title="Galeri luas dua kolom">▤</button>
            </div>
          </div>
        </div>
        {(category !== 'Semua' || query.trim()) && (
          <div className={styles.activeFilters} aria-label="Filter yang diterapkan">
            <span>Filter aktif:</span>
            {category !== 'Semua' && (
              <button type="button" onClick={() => setCategory('Semua')}>{category} <span aria-hidden="true">×</span></button>
            )}
            {query.trim() && (
              <button type="button" onClick={() => changeQuery('')}>{query.trim()} <span aria-hidden="true">×</span></button>
            )}
            <button type="button" className={styles.resetButton} onClick={resetFilters}>Reset filter</button>
          </div>
        )}
        <p className="sr-only" role="status">{filteredArtworks.length} karya ditemukan.</p>
        {filteredArtworks.length ? (
          <div className={styles.galleryGrid} data-density={density}>
            {filteredArtworks.map(artwork => (
              <div key={artwork.id}>
                <MuseumArtworkCard artwork={artwork} canLike={canLike} Heading={ArtworkHeading}
                  state={reactions[artwork.id]} busy={busy} onReact={react} onOpen={openArtwork} />
                {errors[artwork.id] && <p role="alert" className={styles.actionError}>{errors[artwork.id]}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyGallery}>
            <span aria-hidden="true">▧</span>
            <h3>{galleryMessage}</h3>
            <p>Coba kategori lain atau gunakan kata kunci pencarian yang berbeda.</p>
            {(category !== 'Semua' || query) && (
              <button type="button" onClick={resetFilters}>Reset filter</button>
            )}
          </div>
        )}
      </section>

      {!galleryPage && (
        <section className={homeStyles.challenge} id="challenge" aria-labelledby="judul-challenge">
          <h2 id="judul-challenge">Challenge Aktif</h2>
          {matchingChallenges.length > 0 ? matchingChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} statusLabel="Sedang berlangsung" />
          )) : <p className={homeStyles.emptyGallery}>{challengeMessage}</p>}
        </section>
      )}

      {selected && (
        <GalleryLightbox key={selected.id} artwork={selected} artworks={filteredArtworks} canLike={canLike}
          state={reactions[selected.id]} busy={busy} onReact={react}
          onClose={closeArtwork} onNavigate={navigateArtwork} />
      )}
    </>
  )
}
