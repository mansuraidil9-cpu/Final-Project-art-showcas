import AccountPanel from '../../account-panel'
import { pool } from '../../../lib/db.mjs'
import { requireUser } from '../../../lib/session'
import CuratorQueue from './curator-queue'

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Makassar',
})

export default async function AdminDashboard() {
  const user = await requireUser('admin')
  const { rows } = await pool.query(
    `SELECT id, display_name, email, created_at
     FROM users
     WHERE role = 'curator' AND curator_status = 'pending'
     ORDER BY created_at, id`,
  )
  const registrations = rows.map(row => ({
    id: row.id,
    name: row.display_name,
    email: row.email,
    createdAt: row.created_at.toISOString(),
    dateLabel: dateFormat.format(row.created_at),
  }))

  return (
    <AccountPanel title="Dashboard Admin" description={`Halo, ${user.display_name}.`} wide>
      <CuratorQueue registrations={registrations} />
    </AccountPanel>
  )
}
