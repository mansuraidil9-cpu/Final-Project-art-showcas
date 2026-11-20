import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { maxArtworkImageBytes } from './artwork-fields.js'

const formats = new Set(['jpeg', 'png', 'webp'])
const webpFilename = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.webp$/

export async function normalizeImage(file, folder, maxDimension = 1800) {
  const image = sharp(Buffer.from(await file.arrayBuffer()), {
    failOn: 'error',
    limitInputPixels: 24_000_000,
  })
  const metadata = await image.metadata()
  if (!formats.has(metadata.format) || metadata.pages > 1) throw new Error('Format gambar tidak didukung.')

  const { data, info } = await image
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true })

  return { src: `/media/${folder}/${randomUUID()}.webp`, data, width: info.width, height: info.height }
}

export async function readImageUpload(formData, field, folder, { required = false, maxDimension } = {}) {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) {
    return required ? { error: 'Pilih file gambar.' } : {}
  }
  if (file.size > maxArtworkImageBytes) return { error: 'Ukuran gambar maksimal 5 MB.' }

  try {
    return { image: await normalizeImage(file, folder, maxDimension) }
  } catch {
    return { error: 'Pilih gambar JPEG, PNG, atau WebP yang bisa dibuka dan berukuran maksimal 24 megapiksel.' }
  }
}

export function isWebpFilename(file) {
  return webpFilename.test(file)
}

export function webpResponse(data) {
  return data ? new Response(data, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  }) : new Response(null, { status: 404 })
}
