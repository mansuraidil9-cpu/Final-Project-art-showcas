import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import styles from '@/app/dashboard/member/member-artworks.module.css'
import { requireUser } from '@/lib/session'
import { saveAdminAvatar } from './profile-actions'

export default async function AdminProfilePage() {
  const user = await requireUser('admin')

  return (
    <AccountPanel title="Foto Profil Admin">
      <div className={styles.formActions}>
        <Link href="/dashboard/admin">Kembali ke Dashboard Admin</Link>
      </div>
      {user.avatarSrc && (
        <figure className={styles.currentImage}>
          <figcaption>Foto saat ini</figcaption>
          <Image src={user.avatarSrc} alt="" width={160} height={160} unoptimized />
        </figure>
      )}
      <ActionForm action={saveAdminAvatar} submitLabel="Simpan foto profil">
        <div className={styles.field}>
          <label htmlFor="admin-avatar">Foto profil</label>
          <input id="admin-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="admin-avatar-hint" required />
          <p className={styles.hint} id="admin-avatar-hint">JPEG, PNG, atau WebP hingga 5 MB.</p>
        </div>
      </ActionForm>
    </AccountPanel>
  )
}
