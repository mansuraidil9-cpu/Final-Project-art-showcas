import { getUploadedArtworkImage } from '@/lib/artworks'
import { isWebpFilename, webpResponse } from '@/lib/uploads'

export async function GET(_request, { params }) {
  const { file } = await params
  if (!isWebpFilename(file)) return webpResponse(null)
  return webpResponse(await getUploadedArtworkImage(`/media/karya/${file}`))
}
