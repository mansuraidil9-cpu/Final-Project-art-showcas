import AccountPanel from '../../account-panel'
import { requireUser } from '../../../lib/session'

export default async function MemberDashboard() {
  const user = await requireUser('member')
  return <AccountPanel title="Dashboard Member" description={`Halo, ${user.display_name}.`} />
}
