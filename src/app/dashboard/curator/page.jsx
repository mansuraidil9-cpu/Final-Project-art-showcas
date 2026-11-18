import AccountPanel from '../../account-panel'
import { requireUser } from '../../../lib/session'

export default async function CuratorDashboard() {
  const user = await requireUser('curator')
  return <AccountPanel title="Dashboard Curator" description={`Halo, ${user.display_name}.`} />
}
