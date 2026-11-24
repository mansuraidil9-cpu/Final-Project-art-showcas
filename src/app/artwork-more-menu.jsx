'use client'

import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useActionState, useEffect, useRef, useState } from 'react'
import { reportArtworkFromMenu } from './karya/[id]/report-action'
import { reportOptions } from '@/lib/report-options.mjs'
import styles from './artwork-more-menu.module.css'

export default function ArtworkMoreMenu({ artwork, canReport = false }) {
  const [opened, setOpened] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportType, setReportType] = useState('')
  const [details, setDetails] = useState('')
  const [notice, setNotice] = useState('')
  const [feedback, submit, pending] = useActionState(
    reportArtworkFromMenu.bind(null, artwork.id), null,
  )
  const popoverRef = useRef(null)
  const reportDialogRef = useRef(null)
  const triggerRef = useRef(null)

  const eligible = canReport && !artwork.isOwner
  const reportVisible = reportOpen && !feedback?.success

  useEffect(() => {
    if (!opened) return
    function outside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setOpened(false)
    }
    function escape(event) {
      if (event.key === 'Escape') setOpened(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [opened])

  useEffect(() => {
    if (!reportVisible) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = reportDialogRef.current
    const trigger = triggerRef.current
    ;(dialog?.querySelector('input[type="radio"]') || dialog?.querySelector('button') || dialog)?.focus()
    function keys(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setReportOpen(false)
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href]')]
        .filter(element => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keys)
    return () => {
      document.removeEventListener('keydown', keys)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [reportVisible])

  async function copyLink() {
    setOpened(false)
    const url = new URL('/karya/' + encodeURIComponent(artwork.id), window.location.origin).href
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard tidak tersedia')
      await navigator.clipboard.writeText(url)
      setNotice('Tautan karya berhasil disalin.')
    } catch {
      try {
        const temp = document.createElement('textarea')
        temp.value = url
        temp.readOnly = true
        temp.style.position = 'fixed'
        temp.style.opacity = '0'
        document.body.appendChild(temp)
        temp.select()
        const success = document.execCommand('copy')
        temp.remove()
        if (!success) throw new Error('Copy gagal')
        setNotice('Tautan karya berhasil disalin.')
      } catch {
        setNotice('Salin tautan ini: ' + url)
      }
    }
  }

  function openReport() {
    setOpened(false)
    setNotice('')
    setReportOpen(true)
  }

  return (
    <>
      <div className={styles.more} ref={popoverRef}>
      <button ref={triggerRef} type="button" className={styles.trigger}
        aria-label={'Opsi karya ' + artwork.title} aria-haspopup="menu"
        aria-expanded={opened} title="Opsi karya"
        onClick={() => setOpened(value => !value)}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>
      {opened && (
        <div className={styles.popover} role="menu" aria-label="Opsi karya">
          <button type="button" role="menuitem" onClick={copyLink}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2"/>
              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>
            </svg>Salin tautan
          </button>
          <button type="button" role="menuitem" onClick={openReport} disabled={Boolean(feedback?.success)}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M5 21V4m0 1c6-4 8 4 15 0v11c-7 4-9-4-15 0"/>
            </svg>{feedback?.success ? 'Sudah dilaporkan' : 'Laporkan karya'}
          </button>
        </div>
      )}
      {(notice || feedback?.success) && <p className={styles.notice} role="status">
        {notice || (feedback?.success ? 'Laporan berhasil dikirim untuk ditinjau Admin.' : '')}
      </p>}
      </div>
      {reportVisible && createPortal(
        <div className={styles.backdrop} data-artwork-report-dialog="true"
          onMouseDown={event => { if (event.currentTarget === event.target && !pending) setReportOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby={'report-title-' + artwork.id}
            ref={reportDialogRef} tabIndex={-1} className={styles.dialog}>
            <header className={styles.heading}>
              <h2 id={'report-title-' + artwork.id}>Laporkan Karya</h2>
              <button type="button" className={styles.close} aria-label="Tutup formulir laporan"
                onClick={() => setReportOpen(false)} disabled={pending}>×</button>
            </header>
            <div className={styles.body}>
              <p>Bantu kami menjaga ruang pameran tetap aman dan orisinal.</p>
              <div className={styles.artworkSummary}>
                <Image src={artwork.imageSrc} alt="" width={52} height={52} unoptimized={artwork.isUploaded} />
                <span><strong>{artwork.title}</strong><small>oleh {artwork.artist}</small></span>
              </div>
              {!eligible ? (
                <div className={styles.guest}>
                  {artwork.isOwner ? <p>Kamu tidak dapat melaporkan karya milikmu sendiri.</p> : (
                    <p>Masuk sebagai Member untuk mengirim laporan.</p>
                  )}
                  {!artwork.isOwner && <Link href="/login" className={styles.submit}>Masuk sebagai Member</Link>}
                </div>
              ) : (
                <form action={submit} className={styles.form} aria-busy={pending}>
                  <fieldset disabled={pending}>
                    <legend>Pilih alasan</legend>
                    {reportOptions.map(option => (
                      <label key={option.value} className={styles.radioRow}>
                        <input type="radio" name="reportType" value={option.value}
                          checked={reportType === option.value}
                          onChange={event => setReportType(event.target.value)} required />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label className={styles.field}>
                    Detail tambahan {reportType === 'other' ? '(wajib)' : '(opsional)'}
                    <textarea name="details" value={details} onChange={event => setDetails(event.target.value)}
                      placeholder="Jelaskan singkat alasan laporan Anda..." maxLength={300} rows={3}
                      required={reportType === 'other'} disabled={pending} />
                    <small>{details.length}/300</small>
                  </label>
                  {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
                  <footer className={styles.actions}>
                    <button type="button" className={styles.cancel} disabled={pending}
                      onClick={() => setReportOpen(false)}>Batal</button>
                    <button type="submit" className={styles.submit} disabled={pending || !reportType}>
                      {pending ? 'Mengirim…' : 'Kirim Laporan'}
                    </button>
                  </footer>
                </form>
              )}
            </div>
          </section>
        </div>, document.body,
      )}
    </>
  )
}
