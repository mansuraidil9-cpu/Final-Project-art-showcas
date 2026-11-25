'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './login-atmosphere.module.css'

const modes = ['Galeri Melayang', 'Aliran Pigmen', 'Cahaya & Daun']
const modeStorageKey = 'alteria-auth-background-mode'
const dust = Array.from({ length: 58 }, (_, i) => ({
  x: ((i * 79.7) % 997) / 997,
  y: ((i * 43.3) % 991) / 991,
  size: .6 + (i % 4) * .34,
  phase: i * 1.77,
}))

function drawPainting(ctx, x, y, w, h, t, i) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(t * .00022 + i) * .025)
  ctx.fillStyle = 'rgba(62,48,31,.13)'
  ctx.fillRect(-w * .48, h * .48, w * 1.1, h * .12)
  ctx.fillStyle = '#8a704d'
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.fillStyle = '#f4ead8'
  ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6)
  const ix = -w / 2 + 8, iy = -h / 2 + 8, iw = w - 16, ih = h - 16
  const palettes = [
    ['#d6b477', '#78806a', '#a65e42'], ['#bbb28e', '#394638', '#d2a45e'],
    ['#d6b18a', '#6d6552', '#9d4936'], ['#82907a', '#e0c692', '#665446'],
  ][i % 4]
  ctx.fillStyle = palettes[0]
  ctx.fillRect(ix, iy, iw, ih)
  ctx.fillStyle = palettes[1]
  ctx.beginPath()
  ctx.moveTo(ix, iy + ih * .68)
  ctx.quadraticCurveTo(ix + iw * .45, iy + ih * (.25 + .08 * Math.sin(t * .0004 + i)), ix + iw, iy + ih * .66)
  ctx.lineTo(ix + iw, iy + ih)
  ctx.lineTo(ix, iy + ih)
  ctx.fill()
  ctx.fillStyle = palettes[2]
  ctx.beginPath()
  ctx.arc(ix + iw * (.3 + .4 * ((i % 3) / 3)), iy + ih * .31, Math.min(iw, ih) * .13, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,250,236,.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ix + iw * .14, iy + ih * .82)
  ctx.quadraticCurveTo(ix + iw * .55, iy + ih * .56, ix + iw * .88, iy + ih * .85)
  ctx.stroke()
  ctx.restore()
}

function drawGallery(ctx, w, h, t, pointer) {
  ctx.save()
  ctx.lineWidth = 1.3
  for (let i = 0; i < 7; i++) {
    const depth = i % 3
    const x = w * (.08 + (i * .151) % .84) + pointer.x * (depth + 1) * 7
    const y = h * (.18 + ((i * .217) % .58)) + Math.sin(t * .00038 + i * 1.8) * (9 + depth * 5) + pointer.y * (depth + 1) * 4
    const pw = (w < 600 ? 42 : 57) + depth * 13
    ctx.globalAlpha = .28 + depth * .07
    ctx.filter = depth === 0 ? 'blur(1.25px)' : 'none'
    drawPainting(ctx, x, y, pw, pw * 1.24, t, i)
  }
  ctx.filter = 'none'
  ctx.globalAlpha = .24
  ctx.strokeStyle = '#9e7e52'
  ctx.lineWidth = 1
  for (let j = 0; j < 3; j++) {
    ctx.beginPath()
    ctx.moveTo(-30, h * (.21 + j * .21))
    ctx.bezierCurveTo(w * .24, h * (.04 + j * .18) + Math.sin(t * .0002 + j) * 22, w * .68, h * (.42 + j * .11), w + 30, h * (.16 + j * .23))
    ctx.stroke()
  }
  ctx.restore()
}

function drawPigment(ctx, w, h, t, pointer) {
  const palette = ['#9e7e52', '#68745e', '#c29a5b', '#9c5a44', '#4e5b47', '#e1c89d']
  ctx.save()
  for (let i = 0; i < palette.length; i++) {
    const base = h * (.56 + i * .065)
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, base)
    for (let x = 0; x <= w + 18; x += 18) {
      const y = base + Math.sin(x * .005 + t * (.00026 + i * .000025) + i) * (22 + i * 4) + Math.cos(x * .002 + t * .00016) * 20 + Math.exp(-Math.pow((x - pointer.x * w) / 180, 2)) * pointer.y * 13
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = palette[i]
    ctx.globalAlpha = .115 + (i % 3) * .018
    ctx.fill()
  }
  ctx.translate(w * .77, h * .35)
  ctx.rotate(t * .000035)
  ctx.strokeStyle = 'rgba(158,126,82,.38)'
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.ellipse(0, 0, 35 + i * 16, 14 + i * 7, .6, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBranch(ctx, x, y, scale, t, phase) {
  ctx.save()
  ctx.filter = 'blur(1.25px)'
  ctx.translate(x, y)
  ctx.rotate(Math.sin(t * .00042 + phase) * .08)
  ctx.scale(scale, scale)
  ctx.strokeStyle = 'rgba(58,69,48,.26)'
  ctx.fillStyle = 'rgba(64,79,55,.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(44, -72, 142, -165)
  ctx.stroke()
  for (let i = 0; i < 9; i++) {
    const f = .12 + i * .088
    const lx = 142 * f, ly = -165 * f
    const side = i % 2 ? -1 : 1
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(side * (.55 + .12 * Math.sin(t * .0004 + i)))
    ctx.beginPath()
    ctx.ellipse(side * 14, 0, 18, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawSunlight(ctx, w, h, t) {
  const beam = ctx.createLinearGradient(w * .1, 0, w * .8, h)
  beam.addColorStop(0, 'rgba(255,248,222,0)')
  beam.addColorStop(.48, 'rgba(255,248,222,.24)')
  beam.addColorStop(1, 'rgba(255,248,222,0)')
  ctx.fillStyle = beam
  ctx.beginPath()
  ctx.moveTo(w * .08, 0); ctx.lineTo(w * .43, 0); ctx.lineTo(w * .91, h); ctx.lineTo(w * .54, h); ctx.fill()
  ctx.save()
  ctx.translate(w * .22, h * .14)
  ctx.rotate(-.32)
  ctx.fillStyle = 'rgba(73,65,46,.06)'
  ctx.beginPath()
  ctx.roundRect(0, 0, w * .24, h * .3, [90, 90, 4, 4])
  ctx.fill()
  ctx.fillRect(w * .105, 0, 12, h * .3)
  ctx.fillRect(0, h * .14, w * .24, 10)
  ctx.restore()
  drawBranch(ctx, w * 1.02, h * .72, Math.min(1.05, w / 950), t, 1)
  drawBranch(ctx, w * 1.04, h * .49, Math.min(.78, w / 1250), t, 3)
}

export default function LoginAtmosphere() {
  const canvasRef = useRef(null)
  const modeRef = useRef(0)
  const previousModeRef = useRef(0)
  const [mode, setMode] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, frame = 0, savedModeFrame = 0, lastTime = 0
    let previousMode = modeRef.current, transitionAt = 0
    const pointer = { x: .5, y: .5 }
    const ripples = []
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint(performance.now())
    }
    const drawMode = (index, time) => {
      if (index === 0) drawGallery(ctx, width, height, time, pointer)
      else if (index === 1) drawPigment(ctx, width, height, time, pointer)
      else drawSunlight(ctx, width, height, time)
    }
    const paint = time => {
      if (!width || !height) return
      ctx.clearRect(0, 0, width, height)
      if (transitionAt && time - transitionAt < 900) {
        const progress = (time - transitionAt) / 900
        ctx.save(); ctx.globalAlpha = 1 - progress; drawMode(previousMode, time); ctx.restore()
        ctx.save(); ctx.globalAlpha = progress; drawMode(modeRef.current, time); ctx.restore()
      } else {
        transitionAt = 0
        drawMode(modeRef.current, time)
      }
      dust.forEach(p => {
        const flicker = .35 + .65 * ((Math.sin(time * .001 + p.phase) + 1) / 2)
        ctx.fillStyle = `rgba(166,134,88,${flicker * .34})`
        ctx.beginPath()
        ctx.arc(p.x * width, ((p.y * height - time * (.004 + p.size * .002)) % height + height) % height, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]
        const progress = (time - ripple.at) / 1050
        if (progress >= 1) { ripples.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, 10 + progress * 68, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(166,134,88,${(1 - progress) * .32})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    const animate = time => {
      frame = 0
      if (document.hidden) return
      if (time - lastTime >= 16) { paint(time); lastTime = time }
      if (!reduceMotion.matches) frame = requestAnimationFrame(animate)
    }
    const start = () => { if (!document.hidden && !reduceMotion.matches && !frame) frame = requestAnimationFrame(animate) }
    const onVisibility = () => { if (document.hidden && frame) cancelAnimationFrame(frame); frame = 0; start() }
    const onPointer = event => { pointer.x = event.clientX / Math.max(width, 1); pointer.y = event.clientY / Math.max(height, 1) }
    const onInput = event => {
      if (event.target instanceof HTMLInputElement && event.target.type !== 'submit') {
        const rect = event.target.getBoundingClientRect()
        ripples.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, at: performance.now() })
      }
    }
    const onMode = () => { previousMode = previousModeRef.current; transitionAt = performance.now(); if (reduceMotion.matches) paint(performance.now()); else start() }
    const onMotionChange = () => { if (reduceMotion.matches && frame) cancelAnimationFrame(frame); frame = 0; paint(performance.now()); start() }
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('input', onInput)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('alteria-mode-change', onMode)
    reduceMotion.addEventListener('change', onMotionChange)
    try {
      const savedMode = Number(window.localStorage.getItem(modeStorageKey))
      if (Number.isInteger(savedMode) && savedMode >= 0 && savedMode < modes.length && savedMode !== modeRef.current) {
        previousModeRef.current = modeRef.current
        modeRef.current = savedMode
        savedModeFrame = requestAnimationFrame(() => setMode(savedMode))
        onMode()
      }
    } catch {}
    resize()
    start()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (savedModeFrame) cancelAnimationFrame(savedModeFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('input', onInput)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('alteria-mode-change', onMode)
      reduceMotion.removeEventListener('change', onMotionChange)
    }
  }, [])

  const selectMode = index => {
    previousModeRef.current = modeRef.current
    modeRef.current = index
    setMode(index)
    try { window.localStorage.setItem(modeStorageKey, String(index)) } catch {}
    window.dispatchEvent(new Event('alteria-mode-change'))
  }

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.safeZone} data-visible="true" aria-hidden="true" />
      <div className={styles.switcher} role="group" aria-label="Pilih animasi latar">
        {modes.map((label, index) => <button key={label} type="button" aria-pressed={mode === index} onClick={() => selectMode(index)}>{label}</button>)}
      </div>
    </>
  )
}
