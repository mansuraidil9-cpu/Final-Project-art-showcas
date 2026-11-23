'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ArtworkFavorite from '../../artwork-favorite'
import ArtworkDelete from './artwork-delete'
import { saveProfile } from './profil/profile-actions'
import authStyles from '../../auth.module.css'
import styles from './member-dashboard.module.css'

function initialsOf(name) {
  return String(name || 'Member').trim().split(/\s+/).slice(0, 2)
    .map(word => Array.from(word)[0] || '').join('').toUpperCase() || 'M'
}

function Avatar({ src, name, large = false }) {
  return (
    <span className={large ? styles.avatarLarge : styles.avatarSmall} aria-hidden="true">
      <span className={styles.avatarInner}>
        {src ? <Image src={src} alt="" fill unoptimized sizes={large ? '112px' : '44px'} /> : (
          <span className={styles.avatarInitial}>{initialsOf(name)}</span>
        )}
      </span>
    </span>
  )
}

function Dialog({ title, eyebrow, children, onClose, wide = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const box = dialogRef.current
    const first = box?.querySelector('[data-initial-focus], button, input, a[href], textarea, select')
    ;(first || box)?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !box) return
      const elements = Array.from(box.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'))
        .filter(item => item.getClientRects().length > 0)
      if (!elements.length) return
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault()
        elements[elements.length - 1].focus()
      } else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) {
        event.preventDefault()
        elements[0].focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const returnTarget = previouslyFocused?.isConnected
        ? previouslyFocused : document.querySelector('[data-profile-trigger]')
      returnTarget?.focus()
    }
  }, [onClose])

  return (
    <div className={styles.dialogShade} onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title}
        tabIndex={-1} className={wide ? styles.dialogWide : styles.dialog}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className={styles.iconButton} aria-label={'Tutup ' + title}
            onClick={onClose} data-initial-focus>×</button>
        </div>
        <div className={styles.dialogContent}>{children}</div>
      </section>
    </div>
  )
}

function ProfileEditor({ profile, initialName, avatarSrc, onCancel, onPreview, onSaved }) {
  const [feedback, submit, pending] = useActionState(saveProfile, null)
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(profile.bio || '')
  const [links, setLinks] = useState((profile.links || []).join('\n'))
  const [initialMode, setInitialMode] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (feedback?.success) onSaved(name)
  }, [feedback, name, onSaved])

  function validateImage(event) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const valid = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    const message = !valid ? 'Pilih JPG, PNG, atau WebP.' :
      file.size > 5 * 1024 * 1024 ? 'Ukuran gambar maksimal 5 MB.' : ''
    setError(message)
    if (message) {
      event.currentTarget.value = ''
      return
    }
    setInitialMode(false)
    onPreview({ file, initials: false })
  }

  function useInitials() {
    setInitialMode(true)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    onPreview({ file: null, initials: true })
  }

  return (
    <form action={submit} className={styles.editorForm} aria-busy={pending}>
      <input type="hidden" name="removeAvatar" value={initialMode ? 'yes' : 'no'} />
      <div className={styles.photoEditor}>
        <Avatar src={avatarSrc} name={name} large />
        <div className={styles.photoEditorActions}>
          <strong>Foto Profil</strong>
          <p>JPG, PNG, atau WebP, maksimal 5 MB. Pratinjau langsung muncul di kedua avatar dan popover.</p>
          <div className={styles.inlineActions}>
            <label className={styles.primarySmall}>
              Unggah Foto
              <input ref={inputRef} type="file" name="avatar"
                accept="image/jpeg,image/png,image/webp" onChange={validateImage}
                className={styles.visuallyHiddenInput} />
            </label>
            <button type="button" className={styles.secondarySmall} onClick={useInitials}>
              Gunakan Inisial
            </button>
          </div>
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
      <div className={styles.field}>
        <label htmlFor="member-name">Nama tampilan</label>
        <input id="member-name" name="name" type="text" required maxLength={120}
          value={name} onChange={event => setName(event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="member-bio">Bio singkat</label>
        <textarea id="member-bio" name="bio" rows={3} maxLength={500}
          value={bio} onChange={event => setBio(event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="member-links">Tautan portofolio (opsional)</label>
        <textarea id="member-links" name="links" rows={2} maxLength={2000}
          value={links} onChange={event => setLinks(event.target.value)} />
        <p className={styles.smallNote}>Maksimal lima tautan HTTP/HTTPS, satu per baris.</p>
      </div>
      <div className={styles.dialogActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={pending}>Batal</button>
        <button type="submit" className={styles.primaryButton} disabled={pending || Boolean(error)}>
          {pending ? 'Menyimpan…' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}

function CuratorRequest({ action, onClose, onSaved }) {
  const [feedback, submit, pending] = useActionState(action, null)
  useEffect(() => {
    if (feedback?.success) onSaved()
  }, [feedback, onSaved])
  return (
    <form action={submit} className={styles.editorForm} aria-busy={pending}>
      <p>Ajukan akses untuk membuat challenge dan meninjau karya peserta. Pengajuan akan masuk ke antrean Admin.</p>
      <p className={styles.smallNote}>Pengajuan ini menggunakan sistem persetujuan Curator yang sudah ada di ALTERIA.</p>
      {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
      <div className={styles.dialogActions}>
        <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={pending}>Batal</button>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? 'Mengirim…' : 'Kirim Pengajuan'}
        </button>
      </div>
    </form>
  )
}

function GalleryCards({ artworks, saved = false, onPreview }) {
  return (
    <ul className={styles.artworkGrid}>
      {artworks.map(artwork => (
        <li className={styles.artworkCard} key={artwork.id}>
          <button type="button" className={styles.artworkPreview} onClick={() => onPreview(artwork)}
            aria-label={'Pratinjau ' + artwork.title}>
            <Image src={artwork.imageSrc} alt="" fill unoptimized={artwork.isUploaded}
              sizes="(max-width: 620px) 90vw, (max-width: 1000px) 46vw, 350px" />
            <span className={styles.previewOverlay}>Lihat pratinjau</span>
          </button>
          <div className={styles.artworkBody}>
            <p className={styles.artworkCategory}>{artwork.category}</p>
            <h3>{artwork.title}</h3>
            <p className={styles.artworkLikes}>{Number(artwork.likes || 0).toLocaleString('id-ID')} apresiasi</p>
            <div className={styles.artworkActions}>
              <Link href={'/karya/' + artwork.id}>Detail</Link>
              {saved ? <ArtworkFavorite artwork={artwork} variant="dashboard" /> : (
                <>
                  <Link href={'/dashboard/member/karya/' + artwork.id + '/edit'}>Edit</Link>
                  <ArtworkDelete id={artwork.id} title={artwork.title} />
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ArtworkWorkspace({ artworks, error, notice, onPreview }) {
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Terbaru')
  const categories = useMemo(() => {
    const categoriesFromData = artworks?.map(art => art.category) || []
    return ['Semua', ...new Set(['Lukisan', 'Seni cetak', 'Keramik', ...categoriesFromData])]
  }, [artworks])

  const visible = useMemo(() => {
    const term = query.toLocaleLowerCase('id').trim()
    return (artworks || []).filter(art =>
      (category === 'Semua' || art.category === category) &&
      (!term || [art.title, art.category, art.artist, ...(art.tags || [])]
        .join(' ').toLocaleLowerCase('id').includes(term)))
      .sort((a, b) => sort === 'Populer'
        ? Number(b.likes || 0) - Number(a.likes || 0)
        : new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }, [artworks, category, query, sort])

  function resetFilters() {
    setCategory('Semua')
    setQuery('')
    setSort('Terbaru')
  }

  return (
    <section id="kelola-karya" className={styles.workspaceSection} aria-labelledby="judul-kelola">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>ARSIP & PORTOFOLIO</p>
          <h2 id="judul-kelola">Kelola Karya</h2>
        </div>
        <Link className={styles.primaryButton} href="/dashboard/member/karya/baru">+ Unggah karya</Link>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">Karya belum bisa dimuat.</p>}
      <div className={styles.filterRow}>
        <div className={styles.categoryTabs} aria-label="Filter kategori karya" role="group">
          {categories.map(item => (
            <button key={item} type="button" aria-pressed={category === item}
              onClick={() => setCategory(item)}>{item}</button>
          ))}
          <button type="button" disabled title="Status Draft belum tersedia pada penyimpanan karya saat ini">Draft</button>
        </div>
        <div className={styles.searchAndSort}>
          <label className={styles.search}>
            <span className="sr-only">Cari karya milikmu</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)}
              placeholder="Cari karya..." />
          </label>
          <div className={styles.sortTabs} role="group" aria-label="Urutan karya">
            {['Terbaru', 'Populer'].map(item => (
              <button type="button" key={item} aria-pressed={sort === item}
                onClick={() => setSort(item)}>{item}</button>
            ))}
          </div>
        </div>
      </div>
      {visible.length ? <GalleryCards artworks={visible} onPreview={onPreview} /> : !error && (
        <div className={styles.emptyState}>
          <span aria-hidden="true" className={styles.emptyIcon}>▧</span>
          <h3>{(artworks || []).length ? 'Tidak ada karya yang cocok' : 'Belum ada karya yang diunggah'}</h3>
          <p>{(artworks || []).length ? 'Coba ubah kategori atau pencarian.' : 'Koleksi pribadimu akan tampil di sini setelah mengunggah karya pertama.'}</p>
          <div className={styles.inlineActions}>
            {(artworks || []).length > 0 && <button className={styles.secondaryButton} type="button" onClick={resetFilters}>Reset filter</button>}
            <Link className={styles.primaryButton} href="/dashboard/member/karya/baru">+ Unggah karya</Link>
          </div>
        </div>
      )}
    </section>
  )
}

export default function MemberDashboardWorkspace({
  user, profile, artworks, favorites, submissions, notice, curatorAction, homeLink, logout,
}) {
  const router = useRouter()
  const [modal, setModal] = useState(null)
  const [preview, setPreview] = useState(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [forceInitials, setForceInitials] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName)
  const [flash, setFlash] = useState('')
  const popoverRef = useRef(null)
  const selectedAvatar = forceInitials ? null : (avatarPreview || user.avatarSrc || null)

  useEffect(() => {
    return () => { if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])

  useEffect(() => {
    if (!popoverOpen) return
    function outside(event) {
      if (!popoverRef.current?.contains(event.target)) setPopoverOpen(false)
    }
    function keydown(event) {
      if (event.key === 'Escape') setPopoverOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', keydown)
    }
  }, [popoverOpen])

  useEffect(() => {
    if (!flash) return
    const timeout = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(timeout)
  }, [flash])

  const dismissModal = useCallback(() => {
    setModal(null)
    setPreview(null)
    if (modal === 'profile') {
      setAvatarPreview(null)
      setForceInitials(false)
      setDisplayName(user.displayName)
    }
  }, [modal, user.displayName])

  function previewAvatar({ file, initials }) {
    if (initials) {
      setAvatarPreview(null)
      setForceInitials(true)
    } else if (file) {
      setAvatarPreview(URL.createObjectURL(file))
      setForceInitials(false)
    }
  }

  const profileSaved = useCallback(name => {
    setDisplayName(name)
    setModal(null)
    setFlash('Profil berhasil diperbarui.')
    router.refresh()
  }, [router])

  const curatorSaved = useCallback(() => {
    setModal(null)
    setFlash('Pengajuan Curator sudah dikirim untuk ditinjau Admin.')
    router.refresh()
  }, [router])

  function openPreview(artwork) {
    setPreview(artwork)
    setModal('preview')
  }

  const totalLikes = (artworks || []).reduce((sum, item) => sum + Number(item.likes || 0), 0)
  const joinedChallenges = new Set(submissions.map(item => item.challengeId)).size

  return (
    <div className={authStyles.screen + ' ' + styles.memberPage}>
      <div className={styles.memberShell}>
        <header className={authStyles.header}>
          <Link href="/" className={authStyles.wordmark}>ALTERIA</Link>
          <div className={styles.topActions}>
            <div className={styles.profileMenu} ref={popoverRef}>
              <button type="button" className={styles.avatarTrigger}
                aria-label="Buka profil singkat" aria-expanded={popoverOpen} data-profile-trigger
                onClick={() => setPopoverOpen(value => !value)}>
                <Avatar src={selectedAvatar} name={displayName} />
              </button>
              {popoverOpen && (
                <div className={styles.profilePopover}>
                  <div className={styles.popoverIdentity}>
                    <Avatar src={selectedAvatar} name={displayName} />
                    <div>
                      <strong>{displayName}</strong>
                      <p>{user.email}</p>
                      <span>Member · Aktif</span>
                    </div>
                  </div>
                  {profile.bio && <p className={styles.popoverBio}>{profile.bio}</p>}
                  <div className={styles.popoverLinks}>
                    <button type="button" onClick={() => { setPopoverOpen(false); setModal('profile') }}>Edit profil</button>
                    <Link href="/dashboard/member/akun">Pengaturan akun</Link>
                    <Link href={'/kreator/' + user.id}>Lihat profil publik</Link>
                  </div>
                  {logout}
                </div>
              )}
            </div>
            {homeLink}
          </div>
        </header>

        <main className={styles.dashboardMain}>
          <section className={styles.memberHero} aria-labelledby="member-dashboard-title">
            <div className={styles.memberIdentity}>
              <div className={styles.heroAvatarWrap}>
                <button type="button" className={styles.heroAvatarButton}
                  aria-label="Ganti foto profil" title="Ganti foto profil"
                  onClick={() => setModal('profile')}>
                  <Avatar src={selectedAvatar} name={displayName} large />
                  <span className={styles.photoOverlay}>Ganti foto</span>
                </button>
                <button type="button" className={styles.cameraBadge}
                  onClick={() => setModal('profile')} aria-label="Unggah foto profil" title="Unggah foto profil">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </button>
              </div>
              <div className={styles.memberIntro}>
                <p className={styles.eyebrow}>MEMBER ALTERIA</p>
                <h1 id="member-dashboard-title">Dashboard Member</h1>
                <div className={styles.greeting}>
                  <p>Halo, <strong>{displayName}</strong>.</p>
                  <span className={styles.roleBadge}>Member · Aktif</span>
                </div>
                {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModal('profile')}>Edit profil</button>
                  <Link href="/dashboard/member/akun" className={styles.subtleButton}>Pengaturan akun</Link>
                </div>
              </div>
            </div>
            <div className={styles.statsPanel} aria-label="Ringkasan aktivitas Member">
              <div><strong>{(artworks || []).length.toLocaleString('id-ID')}</strong><span>Karya Terunggah</span></div>
              <div><strong>{totalLikes.toLocaleString('id-ID')}</strong><span>Total Apresiasi</span></div>
              <div><strong>{joinedChallenges.toLocaleString('id-ID')}</strong><span>Challenge Diikuti</span></div>
            </div>
          </section>

          {flash && <p className={styles.notice} role="status">{flash}</p>}

          <section className={styles.curatorCard} aria-labelledby="akses-curator">
            <div>
              <p className={styles.eyebrow}>PERAN KOMUNITAS</p>
              <h2 id="akses-curator">Akses Curator</h2>
              <p>Ajukan akses untuk membuat challenge dan meninjau karya peserta.</p>
              {user.curatorStatus === 'rejected' && <p className={styles.error} role="status">Pengajuan sebelumnya ditolak. Kamu dapat mengajukan ulang.</p>}
            </div>
            <div className={styles.curatorAction}>
              {user.curatorStatus === 'approved' ? (
                <Link className={styles.primaryButton} href="/dashboard/curator">Buka Dashboard Curator</Link>
              ) : user.curatorStatus === 'pending' ? (
                <span className={styles.pendingBadge} role="status">Pengajuan Sedang Ditinjau</span>
              ) : (
                <button className={styles.primaryButton} type="button" onClick={() => setModal('curator')}>
                  {user.curatorStatus === 'rejected' ? 'Ajukan ulang akses Curator' : 'Ajukan akses Curator'}
                </button>
              )}
            </div>
          </section>

          <ArtworkWorkspace artworks={artworks} error={artworks === null} notice={notice} onPreview={openPreview} />

          <section id="karya-favorit" className={styles.workspaceSection} aria-labelledby="judul-favorit">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>KOLEKSI TERSIMPAN</p>
                <h2 id="judul-favorit">Karya Favorit</h2>
              </div>
              <Link className={styles.subtleButton} href="/galeri">Jelajahi galeri</Link>
            </div>
            {favorites === null ? <p className={styles.error} role="alert">Karya favorit belum bisa dimuat.</p>
              : favorites.length ? (
                <>
                  <p className="sr-only" role="status">{favorites.length} karya favorit</p>
                  <GalleryCards artworks={favorites} saved onPreview={openPreview} />
                </>
              ) : <div className={styles.emptyState}><h3>Belum ada karya favorit</h3><p>Simpan karya dari Galeri untuk membangun koleksimu.</p></div>}
          </section>

          <section id="submisi-member" className={styles.workspaceSection} aria-labelledby="judul-submisi">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>AKTIVITAS KOMUNITAS</p>
                <h2 id="judul-submisi">Submisi Challenge</h2>
              </div>
            </div>
            {submissions.length ? (
              <ul className={styles.submissionGrid}>
                {submissions.map(item => (
                  <li key={item.id}>
                    <span>{item.withdrawn ? 'Ditarik' : item.rank ? 'Juara ' + item.rank : 'Tenggat ' + item.deadlineLabel}</span>
                    <h3>{item.title}</h3>
                    <Link href={'/challenge/' + item.challengeId}>{item.challengeTitle}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <h3>Belum ada submisi challenge</h3>
                <p>Ikuti tantangan komunitas dan bagikan karyamu.</p>
                <Link className={styles.secondaryButton} href="/challenge">Lihat challenge</Link>
              </div>
            )}
          </section>
        </main>
      </div>

      {modal === 'profile' && (
        <Dialog title="Edit Profil" eyebrow="IDENTITAS KREATOR" onClose={dismissModal}>
          <ProfileEditor
            profile={profile} initialName={displayName} avatarSrc={selectedAvatar}
            onCancel={dismissModal} onPreview={previewAvatar} onSaved={profileSaved}
          />
        </Dialog>
      )}
      {modal === 'curator' && (
        <Dialog title="Ajukan Akses Curator" eyebrow="PERAN KOMUNITAS" onClose={dismissModal}>
          <CuratorRequest action={curatorAction} onClose={dismissModal} onSaved={curatorSaved} />
        </Dialog>
      )}
      {modal === 'preview' && preview && (
        <Dialog title={preview.title} eyebrow="PRATINJAU KARYA" onClose={dismissModal} wide>
          <div className={styles.lightbox}>
            <div className={styles.lightboxImage}>
              <Image src={preview.imageSrc} alt={preview.title} fill unoptimized={preview.isUploaded}
                sizes="(max-width: 820px) 95vw, 580px" />
            </div>
            <div className={styles.lightboxInfo}>
              <p className={styles.eyebrow}>{preview.category}</p>
              <h3>{preview.title}</h3>
              <p>{Number(preview.likes || 0).toLocaleString('id-ID')} apresiasi</p>
              <div className={styles.inlineActions}>
                <Link href={'/karya/' + preview.id} className={styles.primaryButton}>Buka Detail</Link>
                <button type="button" className={styles.secondaryButton} onClick={dismissModal}>Tutup</button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
