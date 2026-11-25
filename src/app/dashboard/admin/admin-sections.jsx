import Link from 'next/link'
import { roleLabels } from '@/lib/user-roles'
import ActionForm from '../action-form'
import styles from './admin-dashboard.module.css'
import { removeCategory, removeUser, saveCategory } from './admin-actions'

const statLabels = {
  admins: ['Admin', 'Pengelola platform'],
  members: ['Member', 'Komunitas Alteria'],
  curators: ['Curator', 'Kurator terdaftar'],
  artworks: ['Karya', 'Karya di galeri'],
  reports: ['Laporan tertunda', 'Menunggu peninjauan'],
  challenges: ['Challenge aktif', 'Sedang berlangsung'],
}

const icons = [
  <><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20z"/></>,
  <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.2a5.5 5.5 0 0 1 11 0V20M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20"/></>,
  <><path d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/></>,
  <><rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="9" cy="9" r="1.5"/><path d="m5 17 5-5 3 3 2-2 4 4"/></>,
  <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
  <><path d="M4 19V5m0 1h13l-2 3 2 3H4"/></>,
]

function formatUserRoles(user) {
  const status = user.role === 'curator'
    ? ({ pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[user.curator_status])
    : null
  return status ? `${roleLabels[user.role]} · ${status}` : roleLabels[user.role]
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'A'
}

export function PlatformStats({ stats }) {
  return (
    <section className={styles.section} aria-labelledby="statistik-platform">
      <header className={styles.sectionHeader}><div><p className={styles.kicker}>Sekilas platform</p><h2 id="statistik-platform">Statistik platform</h2></div></header>
      <dl className={styles.statsGrid}>
        {Object.entries(statLabels).map(([key, [label, description]], index) => (
          <div className={`${styles.statCard} ${key === 'reports' && Number(stats[key]) > 0 ? styles.statAlert : ''}`} key={key}>
            <dt><svg aria-hidden="true" viewBox="0 0 24 24">{icons[index]}</svg>{label}</dt>
            <dd>{Number(stats[key]).toLocaleString('id-ID')}</dd>
            <p>{description}</p>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function UserManagement({ users, role }) {
  return (
    <section id="pengguna" className={styles.section} aria-labelledby="kelola-pengguna">
      <header className={styles.sectionHeader}><div><p className={styles.kicker}>Komunitas</p><h2 id="kelola-pengguna">Kelola pengguna</h2></div><span className={styles.count}>{users.length} akun</span></header>
      <nav className={styles.filters} aria-label="Filter peran">
        <Link href="/dashboard/admin#pengguna" aria-current={role === null ? 'page' : undefined}>Semua</Link>
        {Object.entries(roleLabels).map(([key, label]) => <Link href={`/dashboard/admin?peran=${key}#pengguna`} key={key} aria-current={role === key ? 'page' : undefined}>{label}</Link>)}
      </nav>
      {users.length === 0 ? <p className={styles.empty}>Belum ada akun untuk peran ini.</p> : (
        <ul className={styles.userGrid}>
          {users.map(user => (
            <li className={styles.userCard} key={user.id}>
              <div className={styles.userIntro}><span className={styles.userAvatar}>{initials(user.display_name)}</span><span className={styles.roleBadge}>{formatUserRoles(user)}</span></div>
              <h3>{user.display_name}</h3><p className={styles.userEmail}>{user.email}</p>
              <div className={styles.userFooter}><span>Terdaftar di Alteria</span>
                {user.role !== 'admin' && <details className={styles.deleteDetails}><summary>Hapus akun</summary><ActionForm action={removeUser.bind(null, user.id)} submitLabel="Hapus akun ini" danger><label className={styles.confirm}><input type="checkbox" name="confirmed" value="yes" required />Challenge milik akun ini beserta arsip juaranya ikut terhapus. Arsip juara karya akun ini di challenge Curator lain tetap tersimpan.</label></ActionForm></details>}
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
      <header className={styles.sectionHeader}><div><p className={styles.kicker}>Taksonomi galeri</p><h2 id="kelola-kategori">Kategori karya</h2></div><span className={styles.count}>{categories.length} kategori</span></header>
      <div className={styles.categoryAdd}><ActionForm action={saveCategory.bind(null, null)} submitLabel="Tambah kategori"><label className={styles.field}>Nama kategori baru<input name="name" maxLength={80} required /></label></ActionForm></div>
      {categories.length ? <ul className={styles.categoryList}>
        {categories.map((name, index) => (
          <li className={styles.categoryCard} key={name}>
            <details><summary>{name}<span aria-hidden="true">＋</span></summary>
              <div className={styles.categoryForms}>
                <ActionForm action={saveCategory.bind(null, name)} submitLabel="Ubah nama"><label className={styles.field}>Nama kategori<input name="name" maxLength={80} defaultValue={name} required /></label></ActionForm>
                <ActionForm action={removeCategory.bind(null, name)} submitLabel="Hapus kategori" danger><div className={styles.field}><label htmlFor={`replacement-${index}`}>Kategori pengganti</label><select id={`replacement-${index}`} name="replacement" defaultValue=""><option value="">Pilih jika kategori digunakan</option>{categories.filter(category => category !== name).map(category => <option key={category} value={category}>{category}</option>)}</select></div></ActionForm>
              </div>
            </details>
          </li>
        ))}
      </ul> : <p className={styles.empty}>Belum ada kategori karya.</p>}
    </section>
  )
}
