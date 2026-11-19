import { getUploadedArtworkImage } from '../../../../lib/artworks'

const artworkFile = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.webp$/

export async function GET(_request, { params }) {
  const { file } = await params
  if (!artworkFile.test(file)) return new Response(null, { status: 404 })

  const data = await getUploadedArtworkImage(`/media/karya/${file}`)
  if (!data) return new Response(null, { status: 404 })

  return new Response(data, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
