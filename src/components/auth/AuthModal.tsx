import { useId, useState } from 'react'
import type { RegisterInput } from '../../auth/authService'
import { useAuth } from '../../auth/useAuth'
import Modal from '../ui/Modal'
import LoginForm from './LoginForm'
import PendingNotice from './PendingNotice'
import RegisterForm from './RegisterForm'

export type AuthView = 'login' | 'register' | 'pending'

/**
 * One persistent `Modal` whose content switches between the three views.
 * Keeping the dialog mounted across switches avoids replaying the scrim
 * fade and re-applying the scroll lock.
 */
export default function AuthModal({
  initialView,
  ui,
  onClose,
}: {
  initialView: AuthView
  ui: Record<string, string>
  onClose: () => void
}) {
  const [view, setView] = useState<AuthView>(initialView)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const titleId = useId()
  const { login, register } = useAuth()

  const onLogin = async (email: string, password: string) => {
    await login(email, password)
    // No imperative navigate: `PublicOnly` in App.tsx redirects to /memory
    // as soon as the auth context has a user.
    onClose()
  }

  const onRegister = async (input: RegisterInput) => {
    await register(input)
    setPendingEmail(input.email)
    setView('pending')
  }

  return (
    <Modal onClose={onClose} labelledBy={titleId} closeLabel={ui.authClose ?? 'закрыть'}>
      {view === 'login' && (
        <LoginForm
          ui={ui}
          titleId={titleId}
          onSubmit={onLogin}
          onSwitchToRegister={() => setView('register')}
        />
      )}
      {view === 'register' && (
        <RegisterForm
          ui={ui}
          titleId={titleId}
          onSubmit={onRegister}
          onSwitchToLogin={() => setView('login')}
        />
      )}
      {view === 'pending' && (
        <PendingNotice
          ui={ui}
          titleId={titleId}
          email={pendingEmail ?? (ui.authPendingEmailSample ?? 'имя@почта.ру')}
          onClose={onClose}
          onSwitchToLogin={() => setView('login')}
        />
      )}
    </Modal>
  )
}
