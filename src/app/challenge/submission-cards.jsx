import Image from 'next/image'
import Link from 'next/link'
import styles from '@/app/dashboard/member/member-artworks.module.css'

function CardBody({ submission }) {
  return (
    <>
      <div className={styles.thumbnail}>
        <Image src={submission.imageSrc} alt={submission.imageAlt} fill
          sizes="(max-width: 520px) 90vw, 18rem" unoptimized />
      </div>
      <div className={styles.cardBody}>
        {submission.rank !== null && <p>Juara {submission.rank}</p>}
        <h3>{submission.title}</h3>
        <p>{submission.artist}</p>
        {submission.hasArtwork === false && <p>Karya asli sudah tidak tersedia. Hasil juara tetap diarsipkan.</p>}
      </div>
    </>
  )
}

export default function SubmissionCards({ submissions }) {
  return (
    <ul className={styles.artworks}>
      {submissions.map(submission => (
        <li key={submission.id} className={styles.card}>
          {submission.hasArtwork === false ? (
            <div className="block"><CardBody submission={submission} /></div>
          ) : (
            <Link href={'/karya/' + submission.artworkId} className="block">
              <CardBody submission={submission} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
