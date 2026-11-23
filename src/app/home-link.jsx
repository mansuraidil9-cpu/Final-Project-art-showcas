import Link from 'next/link'
import styles from './auth.module.css'

export default function HomeLink() {
  return (
    <Link className={styles.back} href="/" aria-label="Kembali ke beranda" title="Kembali ke beranda">
      <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3.5 10.5 8.5-7 8.5 7M5.5 9v11h5v-5h3v5h5V9" />
      </svg>
    </Link>
  )
}
