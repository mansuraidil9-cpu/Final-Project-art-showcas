'use client'

import { useEffect } from 'react'

/** Animasi ringan untuk konten beranda yang muncul saat scroll. */
export default function ScrollExperience() {
  useEffect(() => {
    const root = document.querySelector('[data-alteria-home]')
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const targets = [...root.querySelectorAll('main section:not(:first-child), main article, main h2')]
    let observer

    function initialize() {
      observer?.disconnect()
      targets.forEach(element => {
        element.removeAttribute('data-alteria-reveal')
        element.removeAttribute('data-alteria-visible')
      })
      if (reduced.matches || !('IntersectionObserver' in window)) return

      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-alteria-visible', '')
          observer.unobserve(entry.target)
        }
      }, { threshold: 0.08, rootMargin: '0px 0px 30px 0px' })

      targets.forEach(element => {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.95) return
        element.setAttribute('data-alteria-reveal', '')
        observer.observe(element)
      })
    }

    initialize()
    reduced.addEventListener('change', initialize)
    return () => {
      reduced.removeEventListener('change', initialize)
      observer?.disconnect()
      targets.forEach(element => {
        element.removeAttribute('data-alteria-reveal')
        element.removeAttribute('data-alteria-visible')
      })
    }
  }, [])

  return null
}
