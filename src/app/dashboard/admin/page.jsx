import AccountPanel from '../../account-panel'
import { requireUser } from '../../../lib/session'

export default async function AdminDashboard() {
  const user = await requireUser('admin')
  return <AccountPanel title="Dashboard Admin" description={`Halo, ${user.display_name}.`} />
}
