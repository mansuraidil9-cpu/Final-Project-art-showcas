import { getWinnerSnapshotImage } from '@/lib/challenges'
import { webpResponse } from '@/lib/uploads'

export async function GET(_request, { params }) {
  const { challengeId, rank } = await params
  const data = await getWinnerSnapshotImage(challengeId, rank)
  return webpResponse(data)
}
