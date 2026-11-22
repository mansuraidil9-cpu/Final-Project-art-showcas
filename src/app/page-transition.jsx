'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Subtle transition when entering a page. */
export default function PageTransition() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    const previous = previousPathname.current
    previousPathname.current = pathname
    if (!previous || !pathname || previous === pathname) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const main = document.querySelector('main')
    if (motion.matches || typeof main?.animate !== 'function') return

    const animation = main.animate([
      { opacity: .55, transform: 'translate3d(0, 18px, 0)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)', filter: 'blur(0px)' },
    ], { duration: 540, easing: 'cubic-bezier(.22, 1, .36, 1)' })

    const stopIfReduced = () => {
      if (motion.matches) animation.cancel()
    }
    motion.addEventListener('change', stopIfReduced)

    return () => {
      motion.removeEventListener('change', stopIfReduced)
      animation.cancel()
    }
  }, [pathname])

  return null
}
