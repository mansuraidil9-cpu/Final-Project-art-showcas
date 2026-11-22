import Link from 'next/link'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import { isValidEmail, newPasswordPattern, normalizeEmail } from '@/lib/account-validation.mjs'
import { requireUser } from '@/lib/session'
import styles from '../member-artworks.module.css'
import { saveAccount } from './account-actions'

export const metadata = { title: 'Pengaturan Akun | ALTERIA' }

export default async function MemberAccountPage({ searchParams }) {
  const user = await requireUser('member')
  const search = await searchParams
  const emailType = isValidEmail(normalizeEmail(user.email)) ? 'email' : 'text'

  return (
    <AccountPanel title="Pengaturan Akun" description="Ubah email atau kata sandi akunmu.">
      <div className={styles.formActions}>
        <Link href="/dashboard/member">Kembali ke Dashboard Member</Link>
      </div>
      {search?.hasil === 'akun' && <p className={styles.notice} role="status">Email akun berhasil diperbarui.</p>}
      <ActionForm action={saveAccount} submitLabel="Simpan perubahan">
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
    </AccountPanel>
  )
}
