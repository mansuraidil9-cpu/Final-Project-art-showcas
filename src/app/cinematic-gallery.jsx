'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import styles from './cinematic-gallery.module.css'

const works = [
  { image: '/alteria/great-wave.jpg', title: 'Gerak & Energi', note: 'Setiap karya membawa kita ke sudut pandang yang baru.' },
  { image: '/alteria/la-grande-jatte.jpg', title: 'Warna & Ritme', note: 'Lihat lebih dekat warna dan cerita yang tersembunyi.' },
  { image: '/alteria/wheat-field.jpg', title: 'Ruang & Rasa', note: 'Sebuah perjalanan yang dimulai dari satu karya.' },
]
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/** Galeri digeser horizontal, halaman tetap bisa discroll vertikal. */
export default function CinematicGallery() {
  const [active, setActive] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const start = useRef(null)
  const suppressClick = useRef(false)

  function goTo(index) {
    setActive(clamp(index, 0, works.length - 1))
    setDragOffset(0)
  }
  function pointerDown(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    if (!start.current || start.current.id !== event.pointerId) return
    setDragOffset(clamp(event.clientX - start.current.x, -180, 180))
  }
  function pointerUp(event) {
    if (!start.current || start.current.id !== event.pointerId) return
    const diff = event.clientX - start.current.x
    start.current = null
    setDragOffset(0)
    if (Math.abs(diff) > 45) {
      suppressClick.current = true
      goTo(active + (diff < 0 ? 1 : -1))
    }
  }
  function touchStart(event) {
    const touch = event.changedTouches[0]
    start.current = { x: touch.clientX, y: touch.clientY, touch: true }
  }
  function touchEnd(event) {
    if (!start.current?.touch) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.current.x
    const dy = touch.clientY - start.current.y
    start.current = null
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goTo(active + (dx < 0 ? 1 : -1))
    }
  }
  function keyboard(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(active + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(active - 1)
    }
  }

  return (
    <section className={styles.experience} data-alteria-cinematic aria-label="Ruang pameran 3D ALTERIA">
      <div className={styles.stage}>
        <div className={styles.light} aria-hidden="true" />
        <div className={styles.heading}>
          <p className={styles.eyebrow}>ALTERIA — RUANG PAMERAN</p>
          <p className={styles.headingTitle}>Masuk ke dalam <em>cerita karya.</em></p>
          <p className={styles.dragHint}>Geser lukisan untuk menjelajahi karya.</p>
        </div>
        <div
          className={styles.perspective}
          role="group"
          aria-label="Geser karya ke kiri atau kanan"
          tabIndex={0}
          onKeyDown={keyboard}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => { start.current = null; setDragOffset(0) }}
          onLostPointerCapture={() => { start.current = null; setDragOffset(0) }}
          onTouchStart={touchStart}
          onTouchEnd={touchEnd}
          onClickCapture={event => {
            if (suppressClick.current) {
              event.stopPropagation()
              suppressClick.current = false
            }
          }}
        >
          {works.map((work, index) => {
            const distance = index - active - dragOffset / 420
            const offset = Math.abs(distance)
            return (
              <div
                className={styles.frame}
                key={work.image}
                aria-hidden="true"
                style={{
                  transform: `translate3d(calc(-50% + ${distance * 72}vw), calc(-50% + ${offset * 5}vh), ${90 - offset * 350}px) rotateY(${clamp(-distance * 43, -65, 65)}deg) scale(${clamp(1 - offset * .13, .75, 1)})`,
                  opacity: clamp(1.12 - offset * .42, 0, 1),
                  zIndex: 10 - Math.round(offset * 2),
                }}
              >
                <div className={styles.canvas}>
                  <Image src={work.image} alt="" fill sizes="(max-width: 760px) 80vw, 42vw" />
                </div>
                <span className={styles.frameLabel}>ALTERIA · 0{index + 1}</span>
              </div>
            )
          })}
        </div>
        <div className={styles.bottom}>
          <div className={styles.caption} aria-live="polite" aria-atomic="true">
            <span className={styles.eyebrow}>KARYA 0{active + 1} / 03</span>
            <h2>{works[active].title}</h2>
            <p>{works[active].note}</p>
            <Link className={styles.link} href="/galeri">Jelajahi semua karya <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={styles.controls}>
            <div className={styles.buttons}>
              <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Karya sebelumnya">←</button>
              <button type="button" onClick={() => goTo(active + 1)} disabled={active === works.length - 1} aria-label="Karya berikutnya">→</button>
            </div>
            <div className={styles.ticks} aria-label={`Karya ke-${active + 1} dari ${works.length}`}>
              {works.map((work, i) => (
                <button type="button" key={work.image} onClick={() => goTo(i)} className={styles.tick} aria-label={`Tampilkan karya ${i + 1}`} aria-current={active === i ? 'true' : undefined} />
              ))}
            </div>
            <p className={styles.scrollHint}>SCROLL KE BAWAH UNTUK LANJUT ↓</p>
          </div>
        </div>
      </div>
    </section>
  )
}
