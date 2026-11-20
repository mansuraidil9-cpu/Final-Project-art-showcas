import { getUploadedChallengeBanner } from '@/lib/challenges'
import { isWebpFilename, webpResponse } from '@/lib/uploads'

export async function GET(_request, { params }) {
  const { file } = await params
  if (!isWebpFilename(file)) return webpResponse(null)
  return webpResponse(await getUploadedChallengeBanner(`/media/challenge/${file}`))
}
