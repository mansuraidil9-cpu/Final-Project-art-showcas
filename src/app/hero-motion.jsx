'use client'

import { useEffect, useRef } from 'react'
import { createPortraitRenderer } from './portrait-renderer'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function HeroMotion({ className, titleId, children }) {
  const section = useRef(null)

  useEffect(() => {
    const hero = section.current
    const source = hero?.querySelector('[data-portrait-source]')
    const canvas = hero?.querySelector('[data-portrait-canvas]')
    if (!source || !canvas || !CSS.supports('mask-image', 'radial-gradient(#000, transparent)')) return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia('(max-width: 760px)')
    const finePointer = window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)')
    let renderer = null
    let textureSource = ''
    let contextLost = false
    let visible = false
    let pointer = null
    let frame = 0
    let started = 0
    let previousDraw = 0
    let pitch = 0
    let yaw = 0

    function schedule() {
      if (!frame && visible && !preference.matches && !document.hidden && !contextLost) {
        frame = window.requestAnimationFrame(draw)
      }
    }

    function stop() {
      window.cancelAnimationFrame(frame)
      frame = 0
      started = 0
      previousDraw = 0
      pitch = 0
      yaw = 0
      pointer = null
      hero.removeAttribute('data-portrait-ready')
    }

    function releaseTexture() {
      renderer?.dispose()
      renderer = null
      textureSource = ''
    }

    function resizeCanvas() {
      if (!source.naturalWidth || !canvas.clientWidth) return

      const width = Math.ceil(Math.min(1280, source.naturalWidth, canvas.clientWidth * Math.min(window.devicePixelRatio, 1.35)))
      const height = Math.round(width * source.naturalHeight / source.naturalWidth)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    function draw(time) {
      frame = 0
      if (!source.complete || !source.naturalWidth || !canvas.clientWidth) return
      if ((source.naturalWidth < source.naturalHeight) !== mobile.matches) return

      if (textureSource !== source.currentSrc) {
        releaseTexture()
        textureSource = source.currentSrc
        resizeCanvas()
        renderer = createPortraitRenderer(canvas, source, mobile.matches)
      }
      if (!renderer) return

      const step = previousDraw ? time - previousDraw : 16.7
      if (step >= 15) {
        started ||= time
        previousDraw = time
        const phase = (time - started) / 900
        const bounds = hero.getBoundingClientRect()
        const progress = clamp(-bounds.top / bounds.height, 0, 1)
        const cursor = finePointer.matches ? pointer : null
        const pointerX = cursor ? clamp((cursor.x - bounds.left) / bounds.width * 2 - 1, -1, 1) : 0
        const pointerY = cursor ? clamp((cursor.y - bounds.top) / bounds.height * 2 - 1, -1, 1) : 0
        const targetPitch = Math.sin(phase - .4) * .045 - pointerY * .11 - progress * .19
        const targetYaw = Math.sin(phase) * .18 + pointerX * .22 + progress * .17
        const ease = 1 - Math.exp(-Math.min(step, 55) / 95)
        pitch += (clamp(targetPitch, -.24, .2) - pitch) * ease
        yaw += (clamp(targetYaw, -.33, .33) - yaw) * ease
        renderer.draw(pitch, yaw)
        if (!hero.hasAttribute('data-portrait-ready')) hero.setAttribute('data-portrait-ready', '')
      }
      schedule()
    }

    function onImageOrLayoutChange() {
      resizeCanvas()
      schedule()
    }

    function onPointerMove(event) {
      if (!finePointer.matches || event.pointerType === 'touch') return
      pointer = { x: event.clientX, y: event.clientY }
    }

    function onPointerLeave() {
      pointer = null
    }

    function onPreferenceChange() {
      if (preference.matches) {
        stop()
        releaseTexture()
      } else {
        schedule()
      }
    }

    function onBreakpointChange() {
      stop()
      schedule()
    }

    function onTabVisibilityChange() {
      if (document.hidden) stop()
      else schedule()
    }

    function onContextLost(event) {
      event.preventDefault()
      contextLost = true
      stop()
      releaseTexture()
    }

    function onContextRestored() {
      contextLost = false
      schedule()
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
      else stop()
    })
    visibility.observe(hero)

    const resize = new ResizeObserver(onImageOrLayoutChange)
    resize.observe(canvas)
    source.addEventListener('load', onImageOrLayoutChange)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    hero.addEventListener('pointermove', onPointerMove, { passive: true })
    hero.addEventListener('pointerleave', onPointerLeave)
    preference.addEventListener('change', onPreferenceChange)
    mobile.addEventListener('change', onBreakpointChange)
    document.addEventListener('visibilitychange', onTabVisibilityChange)

    return () => {
      stop()
      releaseTexture()
      visibility.disconnect()
      resize.disconnect()
      source.removeEventListener('load', onImageOrLayoutChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerleave', onPointerLeave)
      preference.removeEventListener('change', onPreferenceChange)
      mobile.removeEventListener('change', onBreakpointChange)
      document.removeEventListener('visibilitychange', onTabVisibilityChange)
    }
  }, [])

  return <section ref={section} className={className} aria-labelledby={titleId}>{children}</section>
}
