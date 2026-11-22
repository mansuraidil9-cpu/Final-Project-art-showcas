import styles from './hero-paint.module.css'

// Percikan cat bergerak, tetapi wajah Mona Lisa tetap diam.
const droplets = Array.from({ length: 18 }, (_, index) => index)

export default function HeroMotion({ className, titleId, children }) {
  return (
    <section className={className} aria-labelledby={titleId}>
      {children}
      <div className={styles.paintFlight} aria-hidden="true">
        {droplets.map(index => <span className={styles.droplet} key={index} />)}
      </div>
    </section>
  )
}
