import Link from 'next/link'
import styles from './home.module.css'

export default function ShowcaseDetail({ backHref, backLabel, children }) {
  return (
    <div className={styles.home}>
      <div className={styles.shell}>
        <header className={styles.detailHeader}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <Link className={styles.detailBackLink} href={backHref}>{backLabel}</Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
