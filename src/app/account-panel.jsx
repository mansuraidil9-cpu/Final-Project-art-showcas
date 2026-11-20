import Link from 'next/link'
import { signOut } from './auth-actions'
import styles from './auth.module.css'

export default function AccountPanel({ title, description, children, wide = false }) {
  return (
    <div className={styles.screen}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <Link className={styles.back} href="/">Kembali ke beranda</Link>
        </header>
        <main className={`${styles.panel} ${wide ? styles.widePanel : ''} py-12`}>
          <h1>{title}</h1>
          {description && <p className={styles.intro}>{description}</p>}
          <div className="grid gap-4">
            {children}
            <form action={signOut}>
              <button className={styles.submit} type="submit">Keluar</button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
