import { useRef, useState, type MouseEvent } from 'react'
import { cn } from '../../../lib/utils'
import Button from '../../ui/Button/Button'
import AuthModal, { type AuthView } from '../AuthModal/AuthModal'
import styles from './AuthCta.module.scss'

/**
 * The public hero's footer: a thin rule, the «Авторизоваться» doorway and
 * the auth modal it opens. Owns the modal state — nothing outside the
 * public hero needs it.
 */
export default function AuthCta({
  ui,
  visible,
}: {
  ui: Record<string, string>
  visible: boolean
}) {
  const [view, setView] = useState<AuthView | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const open = (next: AuthView) => (e: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = e.currentTarget
    setView(next)
  }

  const close = () => {
    setView(null)
    openerRef.current?.focus()
  }

  return (
    <>
      {/* `inert` keeps the not-yet-revealed controls out of the tab order.
          Needs Firefox ≥ 112 / Safari ≥ 15.5; older browsers just ignore it. */}
      <div className={cn(styles.footer, visible && styles.visible)} inert={!visible}>
        <span className={styles.rule} aria-hidden="true" />
        <Button variant="outline" onClick={open('login')}>
          {ui.authSignIn ?? 'Авторизоваться'}
        </Button>
        {/* TEMP (no backend yet): direct entry points into the other modal
            views so they can be reviewed. Remove with the real auth flow. */}
        <div className={styles.devLinks}>
          <Button variant="text" onClick={open('register')}>
            {ui.authDevRegister ?? 'тест: регистрация'}
          </Button>
          <Button variant="text" onClick={open('pending')}>
            {ui.authDevPending ?? 'тест: заявка'}
          </Button>
        </div>
      </div>
      {view && <AuthModal initialView={view} ui={ui} onClose={close} />}
    </>
  )
}
