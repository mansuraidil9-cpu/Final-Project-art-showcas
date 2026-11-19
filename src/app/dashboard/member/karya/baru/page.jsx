import AccountPanel from '@/app/account-panel'
import { requireUser } from '@/lib/session'
import ArtworkForm from '../../artwork-form'

export const metadata = { title: 'Unggah Karya | ALTERIA' }

export default async function NewArtworkPage() {
  await requireUser('member')

  return (
    <AccountPanel title="Unggah Karya" description="Tambahkan karyamu ke galeri ALTERIA." wide>
      <ArtworkForm />
    </AccountPanel>
  )
}
