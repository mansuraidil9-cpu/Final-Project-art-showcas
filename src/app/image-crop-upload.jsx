'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { maxArtworkImageBytes } from '@/lib/artwork-fields'
import { CROP_RATIOS, getCanvasSize, getExportSize, layout } from '@/lib/image-crop-geometry.mjs'
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

function draw(canvas, img, zoom, pan) {
  if (!canvas || !img) return
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas
  const box = layout(img, width, height, zoom, pan)
  // Biarkan alpha tetap transparan: jangan tambahkan latar krem sebelum menggambar.
  context.clearRect(0, 0, width, height)
  context.drawImage(img, box.left, box.top, box.drawWidth, box.drawHeight)
}

async function exportEdited(canvas, img, zoom, pan, fileName, resizeRatio, avatar) {
  if (!canvas || !img) throw new Error('Foto belum siap. Coba lagi.')
  const outputSize = getExportSize(canvas, img, zoom, resizeRatio, avatar)
  const output = document.createElement('canvas')
  output.width = outputSize.width
  output.height = outputSize.height
  draw(output, img, zoom, pan)
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/webp', 0.87))
  if (!blob) throw new Error('Foto tidak berhasil diproses.')
  if (blob.size > maxArtworkImageBytes) throw new Error(LIMIT_TEXT)
  const base = fileName.replace(/\.[^.]+$/, '').slice(0, 90) || 'foto'
  return new File([blob], base + '-crop.webp', { type: 'image/webp' })
}

export default function ImageCropUpload({
  id, name, label, shape = 'landscape', required = false, inputRef,
  onApplied, onError,
}) {
  const internalInput = useRef(null)
  const imageRef = useRef(null)
  const dragRef = useRef(null)
  const sourceRef = useRef(null)
  const appliedSourceRef = useRef(null)
  const appliedRef = useRef(null)
  const canvasRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [appliedName, setAppliedName] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [cropRatio, setCropRatio] = useState(shape === 'circle' ? 'square' : 'original')
  const [naturalRatio, setNaturalRatio] = useState(4 / 3)
  const [resizeRatio, setResizeRatio] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isAvatar = shape === 'circle'
  const ratio = isAvatar ? 1 : CROP_RATIOS[cropRatio] ?? naturalRatio
  const { width, height } = getCanvasSize(ratio)
  const outputSize = loaded
    ? getExportSize({ width, height }, imageRef.current, zoom, resizeRatio, isAvatar)
    : null

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
    imageRef.current = null
    if (!pending) return undefined
    const url = URL.createObjectURL(pending)
    const picture = new window.Image()
    let live = true
    picture.onload = () => {
      if (!live) return
      imageRef.current = picture
      setNaturalRatio(picture.naturalWidth / picture.naturalHeight)
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
    setLoaded(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setCropRatio(isAvatar ? 'square' : 'original')
    setResizeRatio(1)
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
      const boundX = Math.max(0, (base.drawWidth - canvas.width) / (2 * canvas.width))
      const boundY = Math.max(0, (base.drawHeight - canvas.height) / (2 * canvas.height))
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
      const editedFile = await exportEdited(
        canvasRef.current, imageRef.current, zoom, pan,
        sourceRef.current.name, resizeRatio, isAvatar,
      )
      appliedRef.current = editedFile
      appliedSourceRef.current = sourceRef.current
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
    appliedSourceRef.current = sourceRef.current
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
    sourceRef.current = appliedSourceRef.current
    internalInput.current?.setCustomValidity('')
    setPending(null)
    setError('')
    onError?.('')
  }

  function reopen() {
    if (!sourceRef.current) return
    // Jangan sampai submit memakai hasil lama ketika pengguna sedang mengedit.
    setInput(null)
    internalInput.current?.setCustomValidity('Tekan Terapkan crop & ukuran sebelum menyimpan.')
    setLoaded(false)
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
        JPG, PNG, atau WebP (maksimal 5 MB). Pilih area potong (crop),
        lalu tentukan seberapa kecil hasilnya sebelum disimpan.
      </p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {appliedName && !pending && (
        <div className={styles.applied}>
          <span>Foto siap diunggah: {appliedName}</span>
          <button type="button" onClick={reopen}>Edit crop & ukuran</button>
        </div>
      )}
      {pending && (
        <section className={styles.editor} aria-label={'Crop dan perkecil ' + label}>
          <p className={styles.editorHeading}>Crop &amp; perkecil foto</p>
          <div className={styles.controlBlock}>
            <strong>1 · Potong foto (crop)</strong>
            {!isAvatar ? (
              <label className={styles.choiceRow} htmlFor={id + '-ratio'}>
                Rasio crop
                <select id={id + '-ratio'} value={cropRatio}
                  onChange={event => { setCropRatio(event.target.value); setPan({ x: 0, y: 0 }); setZoom(1) }}
                  disabled={saving}>
                  <option value="original">Proporsi asli (tanpa potong)</option>
                  <option value="landscape">4:3 · Mendatar</option>
                  <option value="wide">16:9 · Lebar</option>
                  <option value="square">1:1 · Persegi</option>
                  <option value="portrait">4:5 · Potret</option>
                </select>
              </label>
            ) : <p className={styles.hint}>Foto profil menggunakan crop persegi (ditampilkan bulat).</p>}
            <p className={styles.hint}>Geser foto dengan jari atau mouse untuk menentukan bagian yang ingin dipotong.</p>
            <div className={isAvatar ? styles.circlePreview : styles.landscapePreview}
              style={{ aspectRatio: `${width} / ${height}` }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={stopDragging} onPointerCancel={stopDragging}
              aria-label="Geser foto untuk menentukan bagian crop">
              <canvas ref={canvasRef} width={width} height={height} />
              {loaded && <div className={styles.cropGrid} aria-hidden="true" />}
              {!loaded && <span className={styles.loading}>Memuat foto…</span>}
            </div>
            <div className={styles.zoomControl}>
              <button type="button" aria-label="Perkecil area crop" onClick={() => setZoom(value => Math.max(1, +(value - .1).toFixed(2)))} disabled={!loaded || saving}>−</button>
              <label htmlFor={id + '-zoom'}>Zoom crop</label>
              <input id={id + '-zoom'} type="range" min="1" max="3" step="0.05"
                value={zoom} onChange={event => setZoom(Number(event.target.value))}
                disabled={!loaded || saving} aria-valuetext={Math.round(zoom * 100) + '%'} />
              <button type="button" aria-label="Perbesar area crop" onClick={() => setZoom(value => Math.min(3, +(value + .1).toFixed(2)))} disabled={!loaded || saving}>+</button>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
          <div className={styles.controlBlock}>
            <strong>2 · Perkecil hasil gambar</strong>
            <label className={styles.choiceRow} htmlFor={id + '-resize'}>
              Ukuran hasil (piksel)
              <select id={id + '-resize'} value={resizeRatio}
                onChange={event => setResizeRatio(Number(event.target.value))} disabled={saving}>
                <option value="1">100% · Ukuran terbesar</option>
                <option value="0.75">75% · Sedikit lebih kecil</option>
                <option value="0.5">50% · Setengah resolusi</option>
                <option value="0.25">25% · Ukuran kecil</option>
              </select>
            </label>
            {outputSize && (
              <p className={styles.hint} aria-live="polite">
                Perkiraan hasil: {outputSize.width.toLocaleString('id-ID')} × {outputSize.height.toLocaleString('id-ID')} piksel.
                {isAvatar ? ' Foto profil akan diproses maksimal 512 px.' : ' Karya diproses maksimal 1.800 px.'}
              </p>
            )}
            <p className={styles.hint}>Perkecil resolusi tidak mengubah bagian foto yang dipotong.</p>
          </div>
          <div className={styles.editorActions}>
            <button type="button" className={styles.cancel} onClick={cancelEditing} disabled={saving}>Batal</button>
            {!isAvatar && (
              <button type="button" className={styles.cancel} onClick={useOriginal} disabled={!loaded || saving}>
                Gunakan foto asli
              </button>
            )}
            <button type="button" className={styles.apply} onClick={applyPhoto} disabled={!loaded || saving}>
              {saving ? 'Memproses…' : 'Terapkan crop & ukuran'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
