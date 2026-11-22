import Link from 'next/link'
import styles from './home.module.css'

export default function ShowcaseFooter() {
  return (
    <footer className={styles.footer}>
      <div>
        <Link className={styles.wordmark} href="/">ALTERIA</Link>
        <p className={styles.footerNote}>Ruang untuk melihat dan berbagi karya.</p>
      </div>
      <nav aria-label="Navigasi kaki halaman" className={styles.footerLinks}>
        <Link href="/galeri">Galeri</Link>
        <Link href="/challenge">Challenge</Link>
        <a className={styles.textLink} href="#atas">
          Kembali ke atas <span className={`${styles.arrow} ${styles.arrowUp}`} aria-hidden="true" />
        </a>
      </nav>
    </footer>
  )
}
