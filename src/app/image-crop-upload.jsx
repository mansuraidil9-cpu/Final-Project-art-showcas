'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { maxArtworkImageBytes } from '@/lib/artwork-fields'
import styles from './image-crop-upload.module.css'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const LIMIT_TEXT = 'Ukuran gambar maksimal 5 MB.'

function placeFile(input, file) {
  if (!input) return
  if (!file) {
    input.value = ''
    return
  }
  const transfer = new DataTransfer()
  transfer.items.add(file)
  input.files = transfer.files
}

function layout(img, width, height, zoom, pan) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * zoom
  const drawWidth = img.naturalWidth * scale
  const drawHeight = img.naturalHeight * scale
  const limitX = Math.abs(drawWidth - width) / 2
  const limitY = Math.abs(drawHeight - height) / 2
  const centerX = Math.max(-limitX, Math.min(limitX, pan.x * width))
  const centerY = Math.max(-limitY, Math.min(limitY, pan.y * height))
  return { drawWidth, drawHeight, left: (width - drawWidth) / 2 + centerX, top: (height - drawHeight) / 2 + centerY }
}

function draw(canvas, img, zoom, pan) {
  if (!canvas || !img) return
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas
  const box = layout(img, width, height, zoom, pan)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#FBF8F3'
  context.fillRect(0, 0, width, height)
  context.drawImage(img, box.left, box.top, box.drawWidth, box.drawHeight)
}

async function exportEdited(canvas, img, zoom, pan, fileName) {
  if (!canvas || !img) throw new Error('Foto belum siap. Coba lagi.')
  const output = document.createElement('canvas')
  const isSquare = canvas.width === canvas.height
  output.width = isSquare ? 800 : 1600
  output.height = isSquare ? 800 : 1200
  draw(output, img, zoom, pan)
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/webp', 0.87))
  if (!blob) throw new Error('Foto tidak berhasil diproses.')
  // WebP adalah format yang didukung oleh penyimpanan karya dan profil ALTERIA.
  if (blob.size > maxArtworkImageBytes) throw new Error(LIMIT_TEXT)
  const base = fileName.replace(/\.[^.]+$/, '').slice(0, 90) || 'foto'
  return new File([blob], base + '-disesuaikan.webp', { type: 'image/webp' })
}

export default function ImageCropUpload({
  id, name, label, shape = 'landscape', required = false, inputRef,
  onApplied, onError, resetSignal = 0,
}) {
  const internalInput = useRef(null)
  const imageRef = useRef(null)
  const dragRef = useRef(null)
  const sourceRef = useRef(null)
  const appliedRef = useRef(null)
  const previewUrlRef = useRef(null)
  const canvasRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [appliedName, setAppliedName] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isAvatar = shape === 'circle'
  const width = isAvatar ? 600 : 800
  const height = isAvatar ? 600 : 600

  const setInput = useCallback(file => {
    placeFile(internalInput.current, file)
  }, [])

  useEffect(() => {
    if (inputRef) inputRef.current = internalInput.current
    return () => {
      if (inputRef) inputRef.current = null
    }
  }, [inputRef])

  useEffect(() => {
    sourceRef.current = null
    appliedRef.current = null
    setInput(null)
    internalInput.current?.setCustomValidity('')
    setPending(null)
    setAppliedName('')
    setError('')
  }, [resetSignal, setInput])

  useEffect(() => {
    imageRef.current = null
    setLoaded(false)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    if (!pending) return undefined
    const url = URL.createObjectURL(pending)
    previewUrlRef.current = url
    const picture = new window.Image()
    let live = true
    picture.onload = () => {
      if (!live) return
      imageRef.current = picture
      setLoaded(true)
    }
    picture.onerror = () => {
      if (!live) return
      setError('Gambar tidak dapat dibuka. Pilih foto lain.')
    }
    picture.src = url
    return () => {
      live = false
      imageRef.current = null
      URL.revokeObjectURL(url)
      if (previewUrlRef.current === url) previewUrlRef.current = null
    }
  }, [pending])

  useEffect(() => {
    if (loaded) draw(canvasRef.current, imageRef.current, zoom, pan)
  }, [loaded, zoom, pan, pending])

  function selectPhoto(event) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    // Jangan kirim file asli sebelum pengguna menekan Terapkan.
    setInput(appliedRef.current)
    const message = !ALLOWED.has(file.type) ? 'Gunakan foto JPG, PNG, atau WebP.'
      : file.size > maxArtworkImageBytes ? LIMIT_TEXT : ''
    setError(message)
    onError?.(message)
    if (message) {
      internalInput.current?.setCustomValidity(message)
      return
    }
    // Blokir pengiriman sebelum hasil pengaturan foto diterapkan.
    internalInput.current?.setCustomValidity('Tekan Terapkan ukuran foto sebelum menyimpan.')
    sourceRef.current = file
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setPending(file)
  }

  function onPointerDown(event) {
    if (!loaded || saving) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX, y: event.clientY,
      width: event.currentTarget.getBoundingClientRect().width,
      height: event.currentTarget.getBoundingClientRect().height,
    }
  }

  function onPointerMove(event) {
    if (!dragRef.current) return
    const drag = dragRef.current
    const deltaX = (event.clientX - drag.x) / drag.width
    const deltaY = (event.clientY - drag.y) / drag.height
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
    setPan(position => {
      const canvas = canvasRef.current
      const img = imageRef.current
      if (!canvas || !img) return position
      const base = layout(img, canvas.width, canvas.height, zoom, { x: 0, y: 0 })
      const boundX = Math.abs(base.drawWidth - canvas.width) / (2 * canvas.width)
      const boundY = Math.abs(base.drawHeight - canvas.height) / (2 * canvas.height)
      return {
        x: Math.max(-boundX, Math.min(boundX, position.x + deltaX)),
        y: Math.max(-boundY, Math.min(boundY, position.y + deltaY)),
      }
    })
  }

  function stopDragging() { dragRef.current = null }

  async function applyPhoto() {
    if (!loaded || saving) return
    setSaving(true)
    try {
      const editedFile = await exportEdited(canvasRef.current, imageRef.current, zoom, pan, sourceRef.current.name)
      appliedRef.current = editedFile
      setInput(editedFile)
      internalInput.current?.setCustomValidity('')
      setAppliedName(editedFile.name)
      onApplied?.(editedFile)
      setPending(null)
      setError('')
      onError?.('')
    } catch (exception) {
      setError(exception.message || 'Gambar belum bisa diproses.')
      onError?.(exception.message || 'Gambar belum bisa diproses.')
    } finally {
      setSaving(false)
    }
  }

  // Karya seni sering punya ukuran asli yang tidak sama dengan bingkai 4:3.
  // Member boleh tetap mengunggah foto asli agar tidak terpotong.
  function useOriginal() {
    if (!sourceRef.current || saving) return
    appliedRef.current = sourceRef.current
    setInput(sourceRef.current)
    internalInput.current?.setCustomValidity('')
    setAppliedName(sourceRef.current.name)
    onApplied?.(sourceRef.current)
    setPending(null)
    setError('')
    onError?.('')
  }

  function cancelEditing() {
    setInput(appliedRef.current)
    internalInput.current?.setCustomValidity('')
    setPending(null)
    setError('')
    onError?.('')
  }

  function reopen() {
    if (!sourceRef.current) return
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setPending(sourceRef.current)
  }

  return (
    <div className={styles.uploader}>
      <label className={styles.fileLabel} htmlFor={id}>{label}</label>
      <input ref={internalInput} id={id} type="file" name={name}
        className={styles.fileInput} accept="image/jpeg,image/png,image/webp"
        required={required} onChange={selectPhoto}
        aria-describedby={id + '-help'} />
      <p id={id + '-help'} className={styles.hint}>
        Pilih JPG, PNG, atau WebP (maksimal 5 MB). Foto bisa diperbesar,
        diperkecil, dan digeser sebelum disimpan.
      </p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {appliedName && !pending && (
        <div className={styles.applied}>
          <span>Foto siap diunggah: {appliedName}</span>
          <button type="button" onClick={reopen}>Atur ulang ukuran</button>
        </div>
      )}
      {pending && (
        <section className={styles.editor} aria-label={'Atur ukuran ' + label}>
          <p className={styles.editorHeading}>Sesuaikan foto</p>
          <p className={styles.hint}>Geser gambar dengan jari atau mouse, lalu atur besar-kecilnya.</p>
          <div className={isAvatar ? styles.circlePreview : styles.landscapePreview}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={stopDragging} onPointerCancel={stopDragging}
            aria-label="Geser foto untuk mengubah posisinya">
            <canvas ref={canvasRef} width={width} height={height} />
            {!loaded && <span className={styles.loading}>Memuat foto…</span>}
          </div>
          <div className={styles.zoomControl}>
            <button type="button" aria-label="Perkecil foto" onClick={() => setZoom(value => Math.max(.5, +(value - .1).toFixed(2)))} disabled={saving}>−</button>
            <label htmlFor={id + '-zoom'}>Ukuran foto</label>
            <input id={id + '-zoom'} type="range" min="0.5" max="3" step="0.05"
              value={zoom} onChange={event => setZoom(Number(event.target.value))}
              disabled={!loaded || saving} aria-valuetext={Math.round(zoom * 100) + '%'} />
            <button type="button" aria-label="Perbesar foto" onClick={() => setZoom(value => Math.min(3, +(value + .1).toFixed(2)))} disabled={saving}>+</button>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className={styles.editorActions}>
            <button type="button" className={styles.cancel} onClick={cancelEditing} disabled={saving}>Batal</button>
            {!isAvatar && (
              <button type="button" className={styles.cancel} onClick={useOriginal} disabled={!loaded || saving}>
                Gunakan foto asli
              </button>
            )}
            <button type="button" className={styles.apply} onClick={applyPhoto} disabled={!loaded || saving}>
              {saving ? 'Memproses…' : 'Terapkan ukuran'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
