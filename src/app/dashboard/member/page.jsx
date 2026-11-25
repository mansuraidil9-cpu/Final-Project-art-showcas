import HomeLink from '../../home-link'
import ProfileLogout from '../profile-logout'
import { getMemberArtworks, getMemberFavorites, getPublicCreator } from '../../../lib/artworks'
import { getMemberChallengeSubmissions } from '@/lib/challenges'
import { requireUser } from '../../../lib/session'
import MemberDashboardWorkspace from './member-dashboard-workspace'

export const metadata = { title: 'Dashboard Member | ALTERIA' }

const notices = new Map([
  ['diunggah', 'Karya berhasil diunggah.'],
  ['diedit', 'Perubahan karya berhasil disimpan.'],
  ['dihapus', 'Karya berhasil dihapus.'],
])

export default async function MemberDashboard({ searchParams }) {
  const user = await requireUser('member')
  const notice = notices.get((await searchParams)?.hasil)
  const [artworks, favorites, submissions, publicProfile] = await Promise.all([
    getMemberArtworks(user.id).catch(error => {
      console.error('Karya Member gagal dimuat.', error.code ?? error.name)
      return null
    }),
    getMemberFavorites(user.id).catch(error => {
      console.error('Karya favorit gagal dimuat.', error.code ?? error.name)
      return null
    }),
    getMemberChallengeSubmissions(user.id),
    getPublicCreator(user.id).catch(error => {
      console.error('Profil publik gagal dimuat.', error.code ?? error.name)
      return null
    }),
  ])

  return (
    <MemberDashboardWorkspace
      user={{
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        avatarSrc: user.avatarSrc ?? null,
      }}
      profile={{
        displayName: publicProfile?.displayName ?? user.display_name,
        bio: publicProfile?.bio ?? '',
        links: publicProfile?.links ?? [],
        hasAvatar: Boolean(publicProfile?.hasAvatar),
      }}
      artworks={artworks}
      favorites={favorites}
      submissions={submissions}
      notice={notice ?? null}
      homeLink={<HomeLink />}
      logout={<ProfileLogout />}
    />
  )
}
