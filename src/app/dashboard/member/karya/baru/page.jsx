import AccountPanel from '@/app/account-panel'
import { getArtworkCategories } from '@/lib/categories'
import { requireUser } from '@/lib/session'
import ArtworkForm from '../../artwork-form'

export const metadata = { title: 'Unggah Karya | ALTERIA' }

export default async function NewArtworkPage() {
  await requireUser('member')
  const categories = await getArtworkCategories()

  return (
    <AccountPanel title="Unggah Karya" description="Tambahkan karyamu ke galeri ALTERIA." wide>
      <ArtworkForm categories={categories} />
    </AccountPanel>
  )
}
