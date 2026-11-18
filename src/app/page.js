import Image from 'next/image'
import Link from 'next/link'
import { dashboardPath, getCurrentUser } from '../lib/session'
import GalleryExplorer from './gallery-explorer'
import styles from './home.module.css'

export default async function Home() {
  const user = await getCurrentUser()
  const accountPath = user ? dashboardPath(user) : null

  return (
    <div className={styles.home} id="atas">
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>

          <nav className={styles.navigation} aria-label="Navigasi utama">
            <a href="#galeri">Galeri</a>
            <a href="#challenge">Challenge</a>
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

        <main>
          <section className={styles.hero} aria-labelledby="judul-beranda">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Galeri seni digital</p>
              <h1 id="judul-beranda">
                Temukan Karya,<br />
                <em>Kenali Kreatornya.</em>
              </h1>
              <p className={styles.intro}>
                Jelajahi karya lintas medium dan ikuti challenge dari para kurator.
              </p>
              <a className={styles.textLink} href="#galeri">
                Jelajahi Galeri <span className={`${styles.arrow} ${styles.arrowDown}`} aria-hidden="true" />
              </a>
            </div>

            <figure className={styles.heroFigure}>
              <div className={styles.heroImage}>
                <Image
                  src="/alteria/paris-rainy-day.jpg"
                  alt="Dua orang berpayung melintasi jalan berbatu di Paris."
                  fill
                  preload
                  sizes="(max-width: 760px) 94vw, 55vw"
                />
              </div>
              <figcaption className={styles.heroCaption}>
                <cite>Paris Street; Rainy Day</cite>
                <span>Gustave Caillebotte, 1877</span>
              </figcaption>
            </figure>
          </section>

          <GalleryExplorer />
        </main>

        <footer className={styles.footer}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <a className={styles.textLink} href="#atas">
            Kembali ke atas <span className={`${styles.arrow} ${styles.arrowUp}`} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  )
}
