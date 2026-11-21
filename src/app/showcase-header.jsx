import Image from 'next/image'
import Link from 'next/link'
import { dashboardPath } from '../lib/session'
import { roleLabels } from '../lib/user-roles'
import styles from './home.module.css'

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map(word => Array.from(word)[0]).join('').toUpperCase()
}

export default function ShowcaseHeader({ user, currentPage }) {
  const accountPath = user ? dashboardPath(user) : null
  const roleLabel = user ? roleLabels[user.role] : null
  const showRole = user?.role === 'admin' || user?.role === 'curator'
  const accountLabel = accountPath === '/curator/pending' ? 'Buka status akun Curator' : `Buka dashboard ${roleLabel}`

  return (
    <header className={styles.header}>
      <div className={`${styles.shell} ${styles.headerFrame}`}>
        <Link className={styles.wordmark} href="/" aria-current={currentPage === 'home' ? 'page' : undefined}>
          ALTERIA
        </Link>

        <nav className={styles.navigation} aria-label="Navigasi utama">
          <Link href="/galeri" aria-current={currentPage === 'galeri' ? 'page' : undefined}>Galeri</Link>
          <Link href="/challenge" aria-current={currentPage === 'challenge' ? 'page' : undefined}>Challenge</Link>
          {user?.role === 'member' && <Link href="/dashboard/member#karya-favorit">Karya Favorit</Link>}
        </nav>

        <div className={styles.account}>
          {accountPath ? (
            <Link className={styles.accountProfile} href={accountPath} aria-label={accountLabel} title={accountLabel}>
              {showRole && <span className={styles.accountRole}>{roleLabel}</span>}
              {user.hasAvatar ? (
                <Image className={styles.accountAvatar} src={`/media/profil/${user.id}`} alt="" width={44} height={44} unoptimized />
              ) : (
                <span className={styles.accountAvatar} aria-hidden="true">{getInitials(user.display_name) || roleLabel[0]}</span>
              )}
            </Link>
          ) : (
            <>
              <Link href="/login">Masuk</Link>
              <Link className={styles.solidButton} href="/register">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
