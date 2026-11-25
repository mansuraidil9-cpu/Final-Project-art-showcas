'use client'

import { useEffect, useRef } from 'react'
import { useState } from 'react'
import ActionForm from '@/app/dashboard/action-form'
import ArtworkReportFields from '@/app/artwork-report-fields'

// URL dari Galeri/Studio membuka laporan yang sama dengan halaman detail.
// Formulir/otorisasi tetap dijalankan oleh server action yang sudah ada.
export default function ArtworkReportDetails({ action }) {
  const ref = useRef(null)
  const [reportType, setReportType] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    function openFromShortcut() {
      if (window.location.hash !== '#laporkan-karya' || !ref.current) return
      ref.current.open = true
      requestAnimationFrame(() => {
        ref.current?.querySelector('textarea[name="details"]')?.focus({ preventScroll: true })
      })
    }
    openFromShortcut()
    window.addEventListener('hashchange', openFromShortcut)
    return () => window.removeEventListener('hashchange', openFromShortcut)
  }, [])

  return (
    <details id="laporkan-karya" ref={ref} className="mt-4 scroll-mt-28">
      <summary className="cursor-pointer text-sm underline underline-offset-4">Laporkan karya</summary>
      <ActionForm action={action} submitLabel="Kirim laporan">
        <ArtworkReportFields reportType={reportType} details={details}
          onReportTypeChange={setReportType} onDetailsChange={setDetails} />
      </ActionForm>
    </details>
  )
}
