import { revalidatePath } from 'next/cache'

export function refreshChallengePages(id) {
  revalidatePath('/')
  revalidatePath('/challenge')
  revalidatePath(`/challenge/${id}`)
  revalidatePath('/dashboard/member')
  revalidatePath('/dashboard/curator')
  revalidatePath(`/dashboard/curator/challenge/${id}`)
  revalidatePath('/dashboard/admin')
}
