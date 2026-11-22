import Image from 'next/image'
import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import { isValidEmail, newPasswordPattern, normalizeEmail } from '@/lib/account-validation.mjs'
import { getPublicCreator } from '@/lib/artworks'
import { requireUser } from '@/lib/session'
import styles from '../member-artworks.module.css'
import { saveAccount, saveProfile } from './profile-actions'

export default async function MemberProfilePage({ searchParams }) {
  const user = await requireUser('member')
  const [profile, search] = await Promise.all([getPublicCreator(user.id), searchParams])
  const emailType = isValidEmail(normalizeEmail(user.email)) ? 'email' : 'text'

  return (
    <AccountPanel title="Profil dan Akun" wide>
      <div className={styles.formActions}>
        <Link href="/dashboard/member">Kembali ke Dashboard Member</Link>
        <Link href={`/kreator/${user.id}`}>Lihat profil publik</Link>
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
      <section className={styles.section} aria-labelledby="akun-privat">
        <header className={styles.sectionHeader}><h2 id="akun-privat">Akun Privat</h2></header>
        {search?.hasil === 'akun' && <p className={styles.notice} role="status">Email akun berhasil diperbarui.</p>}
        <ActionForm action={saveAccount} submitLabel="Simpan akun">
          <div className={styles.field}>
            <label htmlFor="account-email">Email</label>
            <input id="account-email" type={emailType} inputMode="email" name="email" defaultValue={user.email} maxLength={254} autoComplete="email" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="account-current">Kata sandi saat ini</label>
            <input id="account-current" type="password" name="currentPassword" maxLength={128} autoComplete="current-password" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="account-new">Kata sandi baru</label>
            <input id="account-new" type="password" name="newPassword" minLength={8} maxLength={128} pattern={newPasswordPattern} autoComplete="new-password" aria-describedby="account-password-hint" />
            <p className={styles.hint} id="account-password-hint">8 sampai 128 karakter tanpa spasi atau karakter tak terlihat. Kosongkan jika hanya ingin mengubah email.</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="account-confirm">Konfirmasi kata sandi baru</label>
            <input id="account-confirm" type="password" name="confirmation" maxLength={128} pattern={newPasswordPattern} autoComplete="new-password" />
          </div>
        </ActionForm>
      </section>
    </AccountPanel>
  )
}
