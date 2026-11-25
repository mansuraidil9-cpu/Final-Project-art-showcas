import Link from 'next/link'
import { getPlatformStats, getPlatformUsers } from '@/lib/administration'
import { getArtworkCategories } from '@/lib/categories'
import AccountPanel from '../../account-panel'
import { pool } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'
import styles from '../member/member-artworks.module.css'
import CuratorQueue from './curator-queue'
import { CategoryManagement, PlatformStats, UserManagement } from './admin-sections'

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Makassar',
})

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

  return (
    <AccountPanel title="Dashboard Admin" description={`Halo, ${user.display_name}.`} wide>
      <div className={styles.formActions}>
        <Link href="/dashboard/admin/profil">Ubah foto profil</Link>
      </div>
      <PlatformStats stats={stats} />
      <CuratorQueue registrations={registrations} />
      <UserManagement users={users} role={role} />
      <CategoryManagement categories={categories} />
    </AccountPanel>
  )
}
