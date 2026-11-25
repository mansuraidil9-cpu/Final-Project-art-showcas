'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import ArtworkFavorite from './artwork-favorite'
import ArtworkMoreMenu from './artwork-more-menu'
import StudioSceneLoader from './studio-scene-loader'
import styles from './studio-experience.module.css'

const names = ['Beranda', 'Dimensi', 'Galeri', 'Penutup']
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const mainArtwork = {
  id: null,
  title: 'Mona Lisa',
  artist: 'Leonardo da Vinci',
  category: 'Lukisan',
  // Reproduksi bersih, tanpa bingkai/dekorasi bawaan di dalam foto.
  // Sumber: Wikimedia Commons (public domain), resolusi 960 × 1435.
  imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Leonardo_da_Vinci_-_Mona_Lisa.jpg/960px-Leonardo_da_Vinci_-_Mona_Lisa.jpg',
  isUploaded: false,
}

export default function StudioExperience({ artworks = [], challenges = [], canLike = false }) {
  const rootRef = useRef(null)
  const detailDialogRef = useRef(null)
  const favoritesDialogRef = useRef(null)
  const chaptersRef = useRef([])
  const selectedRef = useRef({ locked: false })
  const motionRef = useRef({ progress: 0, pointerX: 0, pointerY: 0, manual: false, orbitX: 0, orbitY: 0, galleryIndex: 0, dragOffset: 0, studioVisible: true })
  const [chapter, setChapter] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [manual, setManual] = useState(false)
  const [layer, setLayer] = useState('all')
  const [detail, setDetail] = useState(null)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [favoriteOverrides, setFavoriteOverrides] = useState({})
  const [toast, setToast] = useState('')

  const works = artworks.slice(0, 3)
  const workCount = works.length
  const featured = works[galleryIndex] || null
  const favorites = artworks.filter(artwork => favoriteOverrides[artwork.id] ?? artwork.favorited)
  const activeChallenge = challenges[0] || null
  const sceneImages = works.map(artwork => artwork.imageSrc)
  const sceneLabels = works.map(artwork => artwork.title)
  const onSceneReady = useCallback(() => setReady(true), [])
  const onSceneFailed = useCallback(() => setReady(false), [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let frame = 0
    function update() {
      frame = 0
      const rect = root.getBoundingClientRect()
      const distance = Math.max(root.offsetHeight, 1)
      const p = clamp(-rect.top / distance, 0, 1)
      // Hilangkan navigasi studio sesaat sebelum galeri reguler menempati
      // bagian tengah viewport. Ketika scroll naik, UI 3D aktif kembali.
      const regularGallery = root.nextElementSibling
      const regularGalleryEntering = regularGallery?.id === 'galeri'
        && regularGallery.getBoundingClientRect().top <= innerHeight * .62
      const studioVisible = rect.bottom > 0 && rect.top < innerHeight
        && !regularGalleryEntering
      root.dataset.studioVisible = studioVisible ? 'true' : 'false'
      if (motionRef.current.studioVisible !== studioVisible) {
        motionRef.current.studioVisible = studioVisible
        window.dispatchEvent(new CustomEvent('alteria-studio-visibility',{detail:studioVisible}))
      }
      motionRef.current.progress = p
      motionRef.current.targetProgress = p * 3
      root.style.setProperty('--studio-progress', String(p))

      // Perubahan bab berdasarkan posisi section, bukan ambang persentase
      // terhadap total tinggi. Section 04 kini selalu aktif saat memasuki
      // area fokus layar, terlepas dari variasi tinggi viewport.
      const focusLine = innerHeight * .52
      const sectionProgressAtFocus = section => section
        ? clamp(((section.getBoundingClientRect().top - rect.top - focusLine) / distance) * 3,0,3)
        : null
      motionRef.current.galleryStartProgress = sectionProgressAtFocus(chaptersRef.current[2]) ?? 1.2
      motionRef.current.finaleStartProgress = sectionProgressAtFocus(chaptersRef.current[3]) ?? 2.1
      let next = 0
      for (let i = 0; i < chaptersRef.current.length; i++) {
        const section = chaptersRef.current[i]
        if (section && section.getBoundingClientRect().top <= focusLine) next = i
      }
      root.dataset.studioChapter = String(next)
      setChapter(previous => previous === next ? previous : next)

      // Pilihan otomatis dihitung dari section Galeri itu sendiri.
      const galleryChapter = chaptersRef.current[2]
      const galleryRect = galleryChapter?.getBoundingClientRect()
      const galleryProgress = galleryRect
        ? clamp((focusLine - galleryRect.top) / Math.max(galleryRect.height,1),0,.99999)
        : 0
      const index = clamp(Math.floor(galleryProgress * workCount), 0, Math.max(workCount - 1, 0))
      if (next !== 2) selectedRef.current.locked = false
      if (!selectedRef.current.locked) {
        motionRef.current.galleryIndex = index
        setGalleryIndex(previous => previous === index ? previous : index)
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    function pointerMove(event) {
      if (motionRef.current.manual) return
      motionRef.current.pointerX = (event.clientX / innerWidth - .5) * 2
      motionRef.current.pointerY = (event.clientY / innerHeight - .5) * 2
    }
    update()
    window.addEventListener('scroll', schedule, { passive:true })
    window.addEventListener('resize', schedule, { passive:true })
    window.addEventListener('pointermove', pointerMove, { passive:true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('pointermove', pointerMove)
    }
  }, [workCount])

  useEffect(() => {
    motionRef.current.manual = manual
  }, [manual])

  useEffect(() => {
    motionRef.current.focusLayer = layer
  }, [layer])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!detail && !favoritesOpen) return
    const previousFocus = document.activeElement
    const oldOverflow = document.body.style.overflow
    const box = detail ? detailDialogRef.current : favoritesDialogRef.current
    document.body.style.overflow = 'hidden'
    box?.querySelector('button')?.focus()
    function dialogKeys(event) {
      if (document.querySelector('[data-artwork-report-dialog]')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        setDetail(null)
        setFavoritesOpen(false)
        return
      }
      if (event.key !== 'Tab' || !box) return
      const items = [...box.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')]
        .filter(item => item.getClientRects().length)
      if (!items.length) return
      if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === box)) {
        event.preventDefault()
        items[items.length - 1].focus()
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener('keydown', dialogKeys)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', dialogKeys)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [detail, favoritesOpen])

  const selectArtwork = useCallback(index => {
    if (!workCount) return
    const next = clamp(index, 0, workCount - 1)
    selectedRef.current.locked = true
    motionRef.current.galleryIndex = next
    setGalleryIndex(next)
  }, [workCount])

  function jumpTo(index) {
    const element = chaptersRef.current[index]
    if (!element) return
    element.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }
  function toggleManual() {
    setManual(previous => !previous)
    setToast(manual ? 'Mode mengikuti scroll aktif.' : 'Mode putar manual aktif.')
  }
  function resetView() {
    motionRef.current.orbitX = 0
    motionRef.current.orbitY = 0
    setToast('Sudut pandang dikembalikan.')
  }

  return (
    <div ref={rootRef} className={styles.experience} data-studio-experience>
      <div className={styles.stage} aria-hidden="true">
        <div className={`${styles.scene} ${manual ? styles.manual : ''}`}>
          <StudioSceneLoader images={sceneImages} labels={sceneLabels} heroImage={mainArtwork.imageSrc} motionRef={motionRef} onSelectArtwork={selectArtwork} onReady={onSceneReady} onFailed={onSceneFailed} />
        </div>
        <div className={`${styles.fallback} ${ready ? styles.fallbackHidden : ''}`}>
          <div className={styles.fallbackFrame}>
            <Image
              src={mainArtwork.imageSrc}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 760px) 70vw, 36vw"
              priority
            />
          </div>
          <div className={styles.fallbackGallery} aria-hidden="true">
            {works.map((artwork, index) => (
              <div
                key={artwork.id}
                className={styles.fallbackGalleryFrame}
                style={{
                  transform: `translate3d(calc(-50% + ${(index - galleryIndex) * 26}vw), -50%, 0) rotate(${(index - galleryIndex) * -4}deg) scale(${index === galleryIndex ? 1 : .78})`,
                  zIndex: workCount - Math.abs(index - galleryIndex),
                }}
              >
                <Image src={artwork.imageSrc} alt="" fill unoptimized={Boolean(artwork.isUploaded)} sizes="(max-width: 760px) 55vw, 27vw" />
              </div>
            ))}
          </div>
          <span className={styles.fallbackMote} />
          <span className={styles.fallbackMote} />
          <span className={styles.fallbackMote} />
        </div>
      </div>

      <section ref={el => { chaptersRef.current[0] = el }} className={`${styles.chapter} ${styles.hero}`} aria-labelledby="judul-beranda">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>GALERI SENI DIGITAL</span>
          <h1 id="judul-beranda">Ruang bagi <em>setiap karya<span>.</span></em></h1>
          <p>Temukan karya, kenali kreator, dan ikuti challenge seni dalam ruang pameran digital.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => jumpTo(1)}>Jelajahi Galeri <span aria-hidden="true">↗</span></button>
            <button type="button" className={styles.secondary} onClick={() => setDetail(mainArtwork)}>Detail Karya Utama</button>
          </div>
        </div>
        <div className={styles.scrollPrompt} aria-hidden="true" data-hidden={chapter !== 0}>
          <span>SCROLL UNTUK MENJELAJAH</span>
          <span className={styles.scrollMouse}><i /></span>
        </div>
      </section>

      <section ref={el => { chaptersRef.current[1] = el }} className={`${styles.chapter} ${styles.dimension}`} aria-labelledby="judul-dimensi">
        <div className={styles.dimensionCard}>
          <span className={styles.eyebrow}>02 — DIMENSI & LAPISAN</span>
          <h2 id="judul-dimensi">Lapisan demi <em>lapisan.</em></h2>
          <p>Perhatikan bagaimana bingkai, kanvas, dan warna memiliki ruangnya masing-masing.</p>
          <p className={styles.layerLabel}>Sorot Lapisan</p>
          <div className={styles.layerTags} role="group" aria-label="Sorot lapisan karya">
            {[
              ['all', 'Semua Lapisan'], ['backing', 'Rangka & Plakat'], ['frame', 'Bingkai & Lis Emas'],
              ['canvas', 'Kanvas'], ['glaze', 'Glaze / Vernis'], ['ribbon', 'Cat, Kuas & Pigmen'],
            ].map(([value, label]) => (
              <button type="button" key={value} aria-pressed={layer === value} onClick={() => setLayer(value)}>{label}</button>
            ))}
          </div>
          <p className={styles.detailNote}>Geser halaman untuk melihat karya dari sudut berbeda.</p>
        </div>
      </section>

      <section ref={el => { chaptersRef.current[2] = el }} className={`${styles.chapter} ${styles.gallery}`} aria-labelledby="judul-kurasi">
        <div className={styles.galleryCard}>
          <div className={styles.cardTop}>
            <span className={styles.eyebrow}>03 — KURASI GALERI</span>
            <span className={styles.counter}>{String(workCount ? galleryIndex + 1 : 0).padStart(2, '0')} / {String(workCount).padStart(2, '0')}</span>
          </div>
          <div className={styles.switcher} role="group" aria-label="Pilih karya pameran">
            {works.map((work, index) => (
              <button type="button" key={work.id} aria-label={`Lihat ${work.title}`} aria-current={index === galleryIndex ? 'true' : undefined} onClick={() => selectArtwork(index)} />
            ))}
          </div>
          {featured ? (
            <>
              <span className={styles.medium}>{featured.category}</span>
              <h2 id="judul-kurasi">{featured.title}</h2>
              <p className={styles.artist}>oleh {featured.artist}</p>
              <p className={styles.description}>Karya pilihan yang tersedia di Galeri ALTERIA. Lihat detailnya untuk mengenal karya dan kreatornya.</p>
              <div className={styles.cardActions}>
                <button type="button" className={styles.primary} onClick={() => setDetail(featured)}>Lihat Detail</button>
                <Link className={styles.secondary} href={`/karya/${featured.id}`}>Buka Halaman Karya</Link>
                {canLike && featured.creatorId !== null && !featured.isOwner && (
                  <Link className={styles.secondary} href={`/karya/${featured.id}#laporkan-karya`}>
                    Laporkan karya
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 id="judul-kurasi">Belum ada karya</h2>
              <p className={styles.description}>Karya yang sudah dipublikasikan akan tampil di sini.</p>
              <Link className={styles.primary} href="/galeri">Buka Galeri</Link>
            </>
          )}
        </div>
      </section>

      <section ref={el => { chaptersRef.current[3] = el }} className={`${styles.chapter} ${styles.finale}`} aria-labelledby="judul-penutup">
        <div className={styles.finaleCard}>
          <span className={styles.eyebrow}>04 — RUANG BERKARYA</span>
          <h2 id="judul-penutup">Tunjukkan karyamu di <em>ALTERIA<span>.</span></em></h2>
          <p>{activeChallenge ? `Challenge: ${activeChallenge.title}. Temukan ketentuan dan kirim karya melalui halaman challenge.` : 'Jelajahi karya seniman lain atau ikuti challenge yang tersedia.'}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/challenge">Lihat Challenge <span aria-hidden="true">↗</span></Link>
            <button type="button" className={styles.secondary} onClick={() => jumpTo(0)}>Kembali ke Atas</button>
          </div>
        </div>
      </section>

      <nav className={styles.rail} aria-label="Navigasi bab">
        <div className={styles.railTrack}><div className={styles.railFill} /></div>
        {names.map((name, index) => (
          <button type="button" key={name} onClick={() => jumpTo(index)} aria-current={chapter === index ? 'step' : undefined}>
            <span>{String(index + 1).padStart(2, '0')} {name}</span><i />
          </button>
        ))}
      </nav>
      <div className={styles.utility}>
        <div className={styles.chapterPill}><strong>A</strong><span>{String(chapter + 1).padStart(2,'0')} · {names[chapter]}</span></div>
        <div className={styles.utilityButtons}>
          <button type="button" className={styles.favButton} onClick={() => setFavoritesOpen(true)}>Favorit <span>{favorites.length}</span></button>
          {manual && <button type="button" onClick={resetView}>Reset Sudut</button>}
          <button type="button" onClick={toggleManual} aria-pressed={manual}>{manual ? 'Putar Manual' : 'Auto Orbit'}</button>
        </div>
      </div>
      {toast && <div className={styles.toast} role="status">{toast}</div>}

      {detail && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDetail(null) }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="studio-detail-title" ref={detailDialogRef} tabIndex={-1}>
            {detail.id && <ArtworkMoreMenu key={detail.id} artwork={detail} canReport={canLike} />}
            <button type="button" className={styles.close} aria-label="Tutup detail karya" onClick={() => setDetail(null)}>×</button>
            <div className={styles.modalArt}><Image src={detail.imageSrc} alt={detail.title} fill unoptimized={Boolean(detail.isUploaded || !detail.id)} sizes="(max-width: 720px) 90vw, 38vw" /></div>
            <div className={styles.modalCopy}>
              <span className={styles.eyebrow}>DETAIL KARYA</span>
              <h2 id="studio-detail-title">{detail.title}</h2>
              <p>oleh {detail.artist}</p>
              <dl><dt>Medium / kategori</dt><dd>{detail.category}</dd><dt>Informasi lainnya</dt><dd>{detail.id ? 'Lihat informasi pada halaman detail karya' : 'Ilustrasi pada beranda'}</dd></dl>
              {detail.id && <Link href={`/karya/${detail.id}`} className={styles.primary}>Buka detail lengkap ↗</Link>}
              {detail.id && canLike && !detail.isOwner && (
                <ArtworkFavorite key={detail.id} artwork={{
                  ...detail, favorited: favoriteOverrides[detail.id] ?? detail.favorited,
                }} onChange={(id, saved) => setFavoriteOverrides(previous => ({ ...previous, [id]: saved }))} />
              )}
            </div>
          </div>
        </div>
      )}
      {favoritesOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setFavoritesOpen(false) }}>
          <div className={styles.favoritesPanel} role="dialog" aria-modal="true" aria-labelledby="judul-favorit" ref={favoritesDialogRef} tabIndex={-1}>
            <button className={styles.close} type="button" aria-label="Tutup favorit" onClick={() => setFavoritesOpen(false)}>×</button>
            <span className={styles.eyebrow}>KOLEKSI TERSIMPAN</span>
            <h2 id="judul-favorit">Karya Favorit</h2>
            {favorites.length ? (
              <ul>{favorites.map(artwork => <li key={artwork.id}><Link href={`/karya/${artwork.id}`}>{artwork.title}<small>{artwork.artist}</small></Link></li>)}</ul>
            ) : <p>Belum ada karya favorit yang tersimpan.</p>}
            {canLike && <Link className={styles.secondary} href="/dashboard/member#karya-favorit">Kelola karya favorit</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
