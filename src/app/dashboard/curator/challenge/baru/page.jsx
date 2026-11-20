import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import { requireUser } from '@/lib/session'
import { saveChallenge } from '../../challenge-actions'
import ChallengeFields from '../../challenge-fields'
import styles from '../../../member/member-artworks.module.css'

export default async function CreateChallenge() {
  await requireUser('curator')

  return (
    <AccountPanel title="Buat Challenge" wide>
      <div className={styles.formActions}><Link href="/dashboard/curator">Kembali ke Kelola Challenge</Link></div>
      <ActionForm action={saveChallenge.bind(null, null)} submitLabel="Terbitkan challenge">
        <ChallengeFields />
      </ActionForm>
    </AccountPanel>
  )
}
