import { redirect } from 'next/navigation'
import AuthPage from '../auth-page'
import { dashboardPath, getCurrentUser } from '../../lib/session'

export const metadata = { title: 'Masuk | ALTERIA' }

export default async function Login() {
  const user = await getCurrentUser()
  if (user) redirect(dashboardPath(user))

  return <AuthPage variant="login" />
}
