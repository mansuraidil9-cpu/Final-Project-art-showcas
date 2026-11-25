import Image from 'next/image'
import Link from 'next/link'
import { dashboardPath } from '../lib/session'
import { roleLabels } from '../lib/user-roles'
import styles from './home.module.css'

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map(word => Array.from(word)[0]).join('').toUpperCase()
}

export default function ShowcaseHeader({ user, currentPage, favoritesCount }) {
  const accountPath = user ? dashboardPath(user) : null
  const displayName = user?.display_name.trim()
  const roleLabel = user ? roleLabels[user.role] : null
  const accountRoleLabel = user?.role === 'curator' && user.curator_status === 'pending'
    ? 'Menunggu'
    : user?.role === 'curator' && user.curator_status === 'rejected'
      ? 'Ditolak'
      : roleLabel
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
          {user?.role === 'member' && (
            <>
              <Link href="/dashboard/member#kelola-karya">Karya Saya</Link>
              <Link href="/dashboard/member#karya-favorit">Karya Favorit {Number.isInteger(favoritesCount) && <span className={styles.favoriteBadge}>{favoritesCount}</span>}</Link>
            </>
          )}
        </nav>
        <div className={styles.account}>
          {accountPath ? (
            <Link className={styles.accountProfile} href={accountPath} aria-label={`${accountLabel} untuk ${displayName}`} title={displayName}>
              <span className={styles.accountIdentity}>
                <span className={styles.accountName}>{displayName}</span>
                {showRole && <span className={styles.accountRole}>{accountRoleLabel}</span>}
              </span>
              {user.avatarSrc ? (
                <Image className={styles.accountAvatar} src={user.avatarSrc} alt="" width={44} height={44} unoptimized />
              ) : (
                <span className={styles.accountAvatar} aria-hidden="true">{getInitials(displayName) || roleLabel[0]}</span>
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
