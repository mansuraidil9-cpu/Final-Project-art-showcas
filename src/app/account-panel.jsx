import Link from 'next/link'
import DashboardMotion from './dashboard/dashboard-motion'
import HomeLink from './home-link'
import styles from './auth.module.css'

export default function AccountPanel({ title, description, children, wide = false, headerAction = null }) {
  return (
    <div className={styles.screen}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          {headerAction ? (
            <div className={styles.headerActions}>
              <HomeLink />
              {headerAction}
            </div>
          ) : <HomeLink />}
        </header>
        <main className={`${styles.panel} ${styles.accountPanel} ${wide ? styles.widePanel : ''}`}>
          <h1>{title}</h1>
          {description && <p className={styles.intro}>{description}</p>}
          <DashboardMotion>{children}</DashboardMotion>
        </main>
      </div>
    </div>
  )
}
