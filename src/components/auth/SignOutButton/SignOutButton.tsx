import { useAuth } from '../../../auth/useAuth'
import styles from './SignOutButton.module.scss'

/**
 * Quiet fixed pill next to the theme toggle, rendered only on `/memory`.
 * No imperative navigate: `RequireAuth` in App.tsx redirects to `/` as soon
 * as the auth context loses its user.
 */
export default function SignOutButton({ ui }: { ui: Record<string, string> }) {
  const { logout } = useAuth()

  return (
    <button type="button" onClick={() => void logout()} className={styles.signOut}>
      {ui.authSignOut ?? 'Выйти'}
    </button>
  )
}
