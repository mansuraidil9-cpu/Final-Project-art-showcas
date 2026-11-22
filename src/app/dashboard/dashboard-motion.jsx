'use client'

import { useEffect, useRef } from 'react'

export default function DashboardMotion({ children }) {
  const container = useRef(null)

  useEffect(() => {
    const panel = container.current
    if (!panel || !window.IntersectionObserver || typeof panel.animate !== 'function') return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return

    const running = new Set()
    const stopAnimations = () => {
      for (const animation of running) animation.cancel()
      running.clear()
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue
        currentObserver.unobserve(target)
        if (motion.matches || target.matches(':focus-within')) continue

        const animation = target.animate([
          { opacity: .88, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' })
        running.add(animation)
        animation.onfinish = () => running.delete(animation)
      }
    }, { rootMargin: '0px 0px -24px' })

    for (const section of panel.querySelectorAll(':scope > section, :scope > ul')) observer.observe(section)
    motion.addEventListener('change', stopAnimations)

    return () => {
      observer.disconnect()
      motion.removeEventListener('change', stopAnimations)
      stopAnimations()
    }
  }, [])

  return <div ref={container} className="grid gap-4">{children}</div>
}
