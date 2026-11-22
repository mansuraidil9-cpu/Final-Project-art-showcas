'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollExperience() {
  const pathname = usePathname()
  useEffect(() => {
    const root = document
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const targets = [...root.querySelectorAll('main article, main h2')]
    let observer

    function reset() {
      observer?.disconnect()
      targets.forEach(el => el.removeAttribute('data-studio-reveal'))
      if (reduced.matches || !('IntersectionObserver' in window)) return
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-studio-reveal', 'visible')
          observer.unobserve(entry.target)
        }
      }, { threshold:.06, rootMargin:'0px 0px 20px 0px' })
      targets.forEach(el => {
        if (el.getBoundingClientRect().top < innerHeight * .94) return
        el.setAttribute('data-studio-reveal', 'waiting')
        observer.observe(el)
      })
    }
    reset()
    reduced.addEventListener('change', reset)
    return () => {
      observer?.disconnect()
      reduced.removeEventListener('change', reset)
      targets.forEach(el => el.removeAttribute('data-studio-reveal'))
    }
  }, [pathname])
  return null
}
