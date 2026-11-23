import { signOut } from '../auth-actions'
import styles from '../auth.module.css'

export default function ProfileLogout() {
  return (
    <form action={signOut} className={styles.profileLogout}>
      <button className={styles.submit} type="submit">Logout</button>
    </form>
  )
}
