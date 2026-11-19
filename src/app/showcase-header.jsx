import Link from 'next/link'
import { dashboardPath } from '../lib/session'
import styles from './home.module.css'

export default function ShowcaseHeader({ user, currentPage }) {
  const accountPath = user ? dashboardPath(user) : null

  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-current={currentPage === 'home' ? 'page' : undefined}>
        ALTERIA
      </Link>

      <nav className={styles.navigation} aria-label="Navigasi utama">
        <Link href="/galeri" aria-current={currentPage === 'galeri' ? 'page' : undefined}>Galeri</Link>
        <Link href="/challenge" aria-current={currentPage === 'challenge' ? 'page' : undefined}>Challenge</Link>
      </nav>

      <div className={styles.account}>
        {accountPath ? (
          <Link className={styles.solidButton} href={accountPath}>
            {accountPath === '/curator/pending' ? 'Status akun' : 'Dashboard'}
          </Link>
        ) : (
          <>
            <Link href="/login">Masuk</Link>
            <Link className={styles.solidButton} href="/register">Daftar</Link>
          </>
        )}
      </div>
    </header>
  )
}
