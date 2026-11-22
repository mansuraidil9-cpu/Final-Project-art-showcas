'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import styles from './cinematic-gallery.module.css'

const works = [
  { image: '/alteria/great-wave.jpg', title: 'Gerak & Energi', note: 'Setiap karya membawa kita ke sudut pandang yang baru.' },
  { image: '/alteria/la-grande-jatte.jpg', title: 'Warna & Ritme', note: 'Lihat lebih dekat warna dan cerita yang tersembunyi.' },
  { image: '/alteria/wheat-field.jpg', title: 'Ruang & Rasa', note: 'Sebuah perjalanan yang dimulai dari satu karya.' },
]

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

export default function CinematicGallery() {
  const sectionRef = useRef(null)
  const panelsRef = useRef([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const home = document.querySelector('[data-alteria-home]')
    const hero = home?.querySelector('main > section:first-of-type')
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const small = window.matchMedia('(max-width: 760px)')
    let target = 0
    let shown = 0
    let heroTarget = 0
    let heroShown = 0
    let frame = 0
    let lastChapter = -1

    function update() {
      if (!section || document.hidden || reduced.matches) return
      const rect = section.getBoundingClientRect()
      target = clamp(-rect.top / Math.max(rect.height - innerHeight, 1), 0, 1)
      if (hero) {
        const bounds = hero.getBoundingClientRect()
        heroTarget = clamp(-bounds.top / Math.max(bounds.height * .72, 1), 0, 1)
      }
      if (!frame) frame = requestAnimationFrame(draw)
    }

    function draw() {
      frame = 0
      if (reduced.matches || document.hidden) return
      shown += (target - shown) * .14
      heroShown += (heroTarget - heroShown) * .16
      if (Math.abs(shown - target) < .0005) shown = target
      if (Math.abs(heroShown - heroTarget) < .0005) heroShown = heroTarget

      home?.style.setProperty('--alteria-hero-exit', heroShown.toFixed(4))
      section.style.setProperty('--gallery-travel', shown.toFixed(4))
      const travel = shown * 2
      panelsRef.current.forEach((panel, i) => {
        if (!panel) return
        const distance = i - travel
        const away = Math.abs(distance)
        const mobile = small.matches
        const x = distance * (mobile ? 74 : 58)
        const y = away * (mobile ? 3 : 7)
        const depth = 90 - away * (mobile ? 260 : 420)
        const angle = clamp(-distance * 45, -65, 65)
        const zoom = clamp(1 - away * .12, .72, 1)
        panel.style.transform = 'translate3d(calc(-50% + ' + x.toFixed(2) + 'vw),calc(-50% + ' + y.toFixed(2) + 'vh),' + depth.toFixed(1) + 'px) rotateY(' + angle.toFixed(1) + 'deg) scale(' + zoom.toFixed(3) + ')'
        panel.style.opacity = String(clamp(1.15 - away * .68, 0, 1))
        panel.style.zIndex = String(10 - Math.round(away * 2))
      })
      const chapter = Math.round(travel)
      if (chapter !== lastChapter) {
        lastChapter = chapter
        setActive(chapter)
      }
      if (shown !== target || heroShown !== heroTarget) frame = requestAnimationFrame(draw)
    }

    function onMotionChange() {
      cancelAnimationFrame(frame)
      frame = 0
      if (reduced.matches) {
        home?.style.removeProperty('--alteria-hero-exit')
        section.style.removeProperty('--gallery-travel')
        panelsRef.current.forEach(panel => {
          panel?.style.removeProperty('transform')
          panel?.style.removeProperty('opacity')
          panel?.style.removeProperty('z-index')
        })
        setActive(0)
      } else update()
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    document.addEventListener('visibilitychange', update)
    reduced.addEventListener('change', onMotionChange)
    small.addEventListener('change', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.removeEventListener('visibilitychange', update)
      reduced.removeEventListener('change', onMotionChange)
      small.removeEventListener('change', update)
      home?.style.removeProperty('--alteria-hero-exit')
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.experience} data-alteria-cinematic aria-label="Pameran seni tiga dimensi">
      <div className={styles.stage}>
        <div className={styles.light} aria-hidden="true" />
        <div className={styles.arch} aria-hidden="true" />
        <div className={styles.floor} aria-hidden="true" />
        <div className={styles.heading}>
          <p className={styles.eyebrow}>ALTERIA — RUANG PAMERAN</p>
          <p className={styles.headingTitle}>Masuk ke dalam <em>cerita karya.</em></p>
        </div>
        <div className={styles.perspective} aria-hidden="true">
          {works.map((work, index) => (
            <div className={styles.frame} key={work.image} ref={el => { panelsRef.current[index] = el }} data-first={index === 0 ? 'true' : undefined}>
              <div className={styles.canvas}>
                <Image src={work.image} alt="" fill sizes="(max-width: 760px) 80vw, 42vw" />
              </div>
              <span className={styles.frameLabel}>ALTERIA · 0{index + 1}</span>
            </div>
          ))}
        </div>
        <div className={styles.bottom}>
          <div className={styles.caption}>
            <span className={styles.eyebrow}>KARYA 0{active + 1} / 03</span>
            <h2>{works[active].title}</h2>
            <p>{works[active].note}</p>
            <Link className={styles.link} href="/galeri">Jelajahi semua karya <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={styles.progress} aria-label={'Karya ke-' + (active + 1) + ' dari 3'}>
            <div className={styles.ticks} aria-hidden="true">
              {works.map((work, i) => <span key={work.image} data-on={i === active ? 'true' : undefined} />)}
            </div>
            <p>SCROLL UNTUK MENJELAJAH ↓</p>
          </div>
        </div>
      </div>
    </section>
  )
}
