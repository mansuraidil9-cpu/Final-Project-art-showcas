// Helper murni untuk editor unggahan; bisa diuji tanpa React/browser.
export const CROP_RATIOS = Object.freeze({
  original: null,
  square: 1,
  landscape: 4 / 3,
  wide: 16 / 9,
  portrait: 4 / 5,
})

export function layout(img, width, height, zoom, pan) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * zoom
  const drawWidth = img.naturalWidth * scale
  const drawHeight = img.naturalHeight * scale
  const limitX = Math.max(0, (drawWidth - width) / 2)
  const limitY = Math.max(0, (drawHeight - height) / 2)
  const centerX = Math.max(-limitX, Math.min(limitX, pan.x * width))
  const centerY = Math.max(-limitY, Math.min(limitY, pan.y * height))
  return { drawWidth, drawHeight, left: (width - drawWidth) / 2 + centerX, top: (height - drawHeight) / 2 + centerY }
}

export function getCanvasSize(ratio) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 4 / 3
  const longSide = 800
  return safeRatio >= 1
    ? { width: longSide, height: Math.max(1, Math.round(longSide / safeRatio)) }
    : { width: Math.max(1, Math.round(longSide * safeRatio)), height: longSide }
}

export function getExportSize(canvas, img, zoom, resizeRatio, avatar) {
  if (!canvas || !img) return null
  const fillScale = Math.max(
    canvas.width / img.naturalWidth,
    canvas.height / img.naturalHeight,
  ) * zoom
  const cropWidth = Math.min(img.naturalWidth, canvas.width / fillScale)
  const cropHeight = Math.min(img.naturalHeight, canvas.height / fillScale)
  const limit = avatar ? 512 : 1800
  const longest = Math.min(limit, Math.max(cropWidth, cropHeight)) * resizeRatio
  const ratio = canvas.width / canvas.height
  const width = Math.max(1, Math.round(longest * Math.min(1, ratio)))
  const height = Math.max(1, Math.round(longest / Math.max(1, ratio)))
  return { width, height }
}
