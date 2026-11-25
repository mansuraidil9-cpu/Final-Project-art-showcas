import Link from 'next/link'
import Image from 'next/image'
import { getPlatformStats, getPlatformUsers } from '@/lib/administration'
import { getArtworkCategories } from '@/lib/categories'
import HomeLink from '../../home-link'
import { pool } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'
import styles from './admin-dashboard.module.css'
import CuratorQueue from './curator-queue'
import { CategoryManagement, PlatformStats, UserManagement } from './admin-sections'

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Makassar',
})

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'A'
}

function Avatar({ user, small = false }) {
  const size = small ? 42 : 80
  return (
    <span className={`${styles.avatar} ${small ? styles.avatarSmall : ''}`}>
      {user.avatarSrc ? <Image src={user.avatarSrc} alt="" width={size} height={size} unoptimized /> : initials(user.display_name)}
    </span>
  )
}

export default async function AdminDashboard({ searchParams }) {
  const user = await requireUser('admin')
  const requestedRole = (await searchParams)?.peran
  const role = ['admin', 'member', 'curator'].includes(requestedRole) ? requestedRole : null
  const [stats, users, categories, { rows }] = await Promise.all([
    getPlatformStats(),
    getPlatformUsers(role),
    getArtworkCategories(),
    pool.query(
      `SELECT id, display_name, email, role,
              COALESCE(curator_applied_at, created_at) AS applied_at,
              curator_applied_at::text AS application_version
       FROM users
       WHERE role = 'curator' AND curator_status = 'pending'
       ORDER BY applied_at, id`,
    ),
  ])
  const registrations = rows.map(row => ({
    id: row.id,
    name: row.display_name,
    email: row.email,
    role: row.role,
    appliedAt: row.applied_at.toISOString(),
    applicationVersion: row.application_version ?? '',
    dateLabel: dateFormat.format(row.applied_at),
  }))
  const pendingCount = Number(stats.reports) + registrations.length

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>ALTERIA <span>ADMIN</span></Link>
        <nav className={styles.topActions} aria-label="Navigasi admin">
          <HomeLink />
          <Link href="/dashboard/admin/profil" aria-label="Profil admin" title="Profil admin"><Avatar user={user} small /></Link>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="admin-title">
          <div className={styles.identity}>
            <Avatar user={user} />
            <div className={styles.identityCopy}>
              <p className={styles.kicker}>Panel Administrasi</p>
              <h1 id="admin-title">Selamat datang, {user.display_name}</h1>
              <p className={styles.email}>{user.email}</p>
              <span className={styles.adminBadge}>Admin Utama</span>
              <Link className={styles.profileLink} href="/dashboard/admin/profil">Ubah foto profil <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <aside className={styles.readiness} aria-label="Ringkasan moderasi">
            <p className={styles.kicker}>Kesiapan moderasi</p>
            <p className={styles.readinessTitle}>{pendingCount ? `${pendingCount} hal menunggu` : 'Semua tertangani'}</p>
            <p className={styles.readinessText}>{registrations.length} pengajuan curator · {Number(stats.reports)} laporan karya</p>
            <Link href="/dashboard/admin/moderasi">Buka moderasi <span aria-hidden="true">↗</span></Link>
          </aside>
        </section>
        <div className={styles.content}>
          <PlatformStats stats={stats} />
          <CuratorQueue registrations={registrations} />
          <UserManagement users={users} role={role} />
          <CategoryManagement categories={categories} />
        </div>
      </main>
    </div>
  )
}
