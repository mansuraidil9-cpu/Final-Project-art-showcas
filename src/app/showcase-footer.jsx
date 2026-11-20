import Link from 'next/link'
import styles from './home.module.css'

export default function ShowcaseFooter() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.wordmark} href="/">ALTERIA</Link>
      <a className={styles.textLink} href="#atas">
        Kembali ke atas <span className={`${styles.arrow} ${styles.arrowUp}`} aria-hidden="true" />
      </a>
    </footer>
  )
}
