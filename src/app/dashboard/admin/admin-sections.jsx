import Link from 'next/link'
import { roleLabels } from '@/lib/user-roles'
import ActionForm from '../action-form'
import styles from '../member/member-artworks.module.css'
import { removeCategory, removeUser, saveCategory } from './admin-actions'

const statLabels = {
  admins: 'Admin',
  members: 'Member',
  curators: 'Curator',
  artworks: 'Karya',
  reports: 'Laporan tertunda',
  challenges: 'Challenge aktif',
}

const curatorStatusLabels = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const memberCuratorLabels = {
  pending: 'Pengajuan Curator menunggu',
  approved: 'Curator',
  rejected: 'Pengajuan Curator ditolak',
}

function formatUserRoles(user) {
  const labels = user.role === 'member' ? memberCuratorLabels : curatorStatusLabels
  const curatorLabel = labels[user.curator_status]
  return curatorLabel ? `${roleLabels[user.role]} · ${curatorLabel}` : roleLabels[user.role]
}

export function PlatformStats({ stats }) {
  return (
    <section className={styles.section} aria-labelledby="statistik-platform">
      <header className={styles.sectionHeader}>
        <h2 id="statistik-platform">Statistik Platform</h2>
        <Link className={styles.primaryButton} href="/dashboard/admin/moderasi">Buka moderasi</Link>
      </header>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(statLabels).map(([key, label]) => (
          <div className={`${styles.card} p-3`} key={key}>
            <dt className={styles.hint}>{label}</dt>
            <dd className="mt-1 text-2xl">{stats[key].toLocaleString('id-ID')}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.hint}>Member yang disetujui ikut dihitung sebagai Curator.</p>
    </section>
  )
}

export function UserManagement({ users, role }) {
  return (
    <section id="pengguna" className={styles.section} aria-labelledby="kelola-pengguna">
      <header className={styles.sectionHeader}><h2 id="kelola-pengguna">Kelola Pengguna</h2></header>
      <nav className={styles.cardActions} aria-label="Filter peran">
        <Link href="/dashboard/admin#pengguna" aria-current={role === null ? 'page' : undefined}>Semua</Link>
        {Object.entries(roleLabels).map(([key, label]) => (
          <Link href={`/dashboard/admin?peran=${key}#pengguna`} key={key} aria-current={role === key ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
      {users.length === 0 ? <p className={styles.empty}>Belum ada akun untuk peran ini.</p> : (
        <ul className={styles.artworks}>
          {users.map(user => (
            <li className={styles.card} key={user.id}>
              <div className={styles.cardBody}>
                <p>{formatUserRoles(user)}</p>
                <h3>{user.display_name}</h3>
                <p>{user.email}</p>
                {user.role !== 'admin' && (
                  <details className="mt-3 text-sm">
                    <summary className={styles.deleteLink}>Hapus akun</summary>
                    <ActionForm action={removeUser.bind(null, user.id)} submitLabel="Hapus akun ini" danger>
                      <label className="flex items-start gap-2">
                        <input type="checkbox" name="confirmed" value="yes" required />
                        Hapus akun ini beserta karya atau challenge miliknya.
                      </label>
                    </ActionForm>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CategoryManagement({ categories }) {
  return (
    <section className={styles.section} aria-labelledby="kelola-kategori">
      <header className={styles.sectionHeader}><h2 id="kelola-kategori">Kategori Karya</h2></header>
      <ActionForm action={saveCategory.bind(null, null)} submitLabel="Tambah kategori">
        <label className={styles.field}>
          Nama kategori baru
          <input name="name" maxLength={80} required />
        </label>
      </ActionForm>
      <ul className={styles.artworks}>
        {categories.map((name, index) => (
          <li className={styles.card} key={name}>
            <details className={styles.cardBody}>
              <summary className="cursor-pointer">{name}</summary>
              <div className="mt-3 grid gap-4">
                <ActionForm action={saveCategory.bind(null, name)} submitLabel="Ubah nama">
                  <label className={styles.field}>
                    Nama kategori
                    <input name="name" maxLength={80} defaultValue={name} required />
                  </label>
                </ActionForm>
                <ActionForm action={removeCategory.bind(null, name)} submitLabel="Hapus kategori" danger>
                  <div className={styles.field}>
                    <label htmlFor={`replacement-${index}`}>Kategori pengganti</label>
                    <select id={`replacement-${index}`} name="replacement" defaultValue="">
                      <option value="">Pilih jika kategori digunakan</option>
                      {categories.filter(category => category !== name).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </ActionForm>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
