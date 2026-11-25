import Link from 'next/link'
import { redirect } from 'next/navigation'
import AccountPanel from '@/app/account-panel'
import ProfileLogout from '@/app/dashboard/profile-logout'
import styles from '@/app/dashboard/member/member-artworks.module.css'
import { dashboardPath, requireUser } from '@/lib/session'

export default async function CuratorProfilePage() {
  const user = await requireUser()
  if (user.role !== 'curator' || user.curator_status !== 'approved') redirect(dashboardPath(user))

  return (
    <AccountPanel title="Profil Curator" description={user.display_name}>
      <div className={styles.formActions}>
        <Link href={dashboardPath(user)}>
          {user.curator_status === 'approved' ? 'Kembali ke Dashboard Curator' : 'Kembali ke status akun'}
        </Link>
      </div>
      <ProfileLogout />
    </AccountPanel>
  )
}
