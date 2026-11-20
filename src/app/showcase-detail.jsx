import Link from 'next/link'
import styles from './home.module.css'
import ShowcaseFooter from './showcase-footer'

export default function ShowcaseDetail({ backHref, backLabel, children, showFooter = false }) {
  return (
    <div className={styles.home} id={showFooter ? 'atas' : undefined}>
      <div className={styles.shell}>
        <header className={styles.detailHeader}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <Link className={styles.detailBackLink} href={backHref}>{backLabel}</Link>
        </header>
        <main>{children}</main>
        {showFooter && <ShowcaseFooter />}
      </div>
    </div>
  )
}
