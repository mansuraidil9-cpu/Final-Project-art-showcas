'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function PageTransition() {
  const pathname = usePathname()
  const previous = useRef(pathname)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const start = window.requestAnimationFrame(() => setRunning(true))
    const timeout = window.setTimeout(() => setRunning(false), 830)
    return () => {
      window.cancelAnimationFrame(start)
      window.clearTimeout(timeout)
    }
  }, [pathname])

  return <div className={`studio-curtain ${running ? 'studio-curtain--run' : ''}`} aria-hidden="true"><span /></div>
}
