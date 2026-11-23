'use client'

import { useEffect, useRef } from 'react'

// URL dari Galeri/Studio membuka laporan yang sama dengan halaman detail.
// Formulir/otorisasi tetap dijalankan oleh server action yang sudah ada.
export default function ArtworkReportDetails({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    function openFromShortcut() {
      if (window.location.hash !== '#laporkan-karya' || !ref.current) return
      ref.current.open = true
      requestAnimationFrame(() => {
        ref.current?.querySelector('textarea[name="reason"]')?.focus({ preventScroll: true })
      })
    }
    openFromShortcut()
    window.addEventListener('hashchange', openFromShortcut)
    return () => window.removeEventListener('hashchange', openFromShortcut)
  }, [])

  return <details id="laporkan-karya" ref={ref} className="mt-4 scroll-mt-28">{children}</details>
}
