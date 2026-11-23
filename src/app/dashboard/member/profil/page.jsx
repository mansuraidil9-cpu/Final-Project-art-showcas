import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import ProfileLogout from '@/app/dashboard/profile-logout'
import { getPublicCreator } from '@/lib/artworks'
import { requireUser } from '@/lib/session'
import styles from '../member-artworks.module.css'
import { saveProfile } from './profile-actions'

export default async function MemberProfilePage() {
  const user = await requireUser('member')
  const profile = await getPublicCreator(user.id)

  return (
    <AccountPanel title="Edit Profil" wide>
      <div className={styles.formActions}>
        <Link href="/dashboard/member">Kembali ke Dashboard Member</Link>
        <Link href={`/kreator/${user.id}`}>Lihat profil publik</Link>
        <Link href="/dashboard/member/akun">Pengaturan akun</Link>
      </div>
      <section className={styles.section} aria-labelledby="profil-publik">
        <header className={styles.sectionHeader}><h2 id="profil-publik">Profil Publik</h2></header>
        <ActionForm action={saveProfile} submitLabel="Simpan profil">
          <div className={styles.field}>
            <label htmlFor="profile-display-name">Nama tampilan</label>
            <input id="profile-display-name" name="name" maxLength={120} defaultValue={profile.displayName} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="profile-bio">Bio</label>
            <textarea id="profile-bio" name="bio" rows={4} maxLength={500} defaultValue={profile.bio} />
          </div>
          <div className={styles.field}>
            <label htmlFor="profile-links">Tautan eksternal</label>
            <textarea id="profile-links" name="links" rows={4} maxLength={2000} defaultValue={profile.links.join('\n')} aria-describedby="profile-links-hint" />
            <p className={styles.hint} id="profile-links-hint">Maksimal lima tautan HTTP atau HTTPS, satu per baris.</p>
          </div>
          {profile.hasAvatar && (
            <figure className={styles.currentImage}>
              <Image src={`/media/profil/${user.id}`} alt="" width={120} height={120} unoptimized />
            </figure>
          )}
          <div className={styles.field}>
            <label htmlFor="profile-photo">Foto profil</label>
            <input id="profile-photo" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="avatar-hint" />
            <p className={styles.hint} id="avatar-hint">JPEG, PNG, atau WebP hingga 5 MB.</p>
          </div>
        </ActionForm>
      </section>
      <ProfileLogout />
    </AccountPanel>
  )
}
