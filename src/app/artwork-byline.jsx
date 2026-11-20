import Link from 'next/link'
import { roleLabels } from '../lib/user-roles'

export default function ArtworkByline({ artwork, className }) {
  return (
    <p className={className}>
      {artwork.creatorId ? (
        <>
          <Link href={`/kreator/${artwork.creatorId}`}>{artwork.artist}</Link>
          {' · '}{roleLabels[artwork.creatorRole]}
        </>
      ) : artwork.artist}
      {artwork.date && ` · ${artwork.date}`}
    </p>
  )
}
