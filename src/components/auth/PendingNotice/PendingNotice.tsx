import Button from '../../ui/Button/Button'
import { ModalBody, ModalFooter, ModalHeader } from '../../ui/Modal/Modal'
import AuthNote from '../AuthNote/AuthNote'
import AuthSwitch from '../AuthSwitch/AuthSwitch'
import styles from './PendingNotice.module.scss'

/** «Заявка на рассмотрении» — the calm no-form state after registering. */
export default function PendingNotice({
  ui,
  titleId,
  email,
  onClose,
  onSwitchToLogin,
}: {
  ui: Record<string, string>
  titleId: string
  email: string
  onClose: () => void
  onSwitchToLogin: () => void
}) {
  return (
    <>
      <ModalHeader
        titleId={titleId}
        title={ui.authTitlePending ?? 'Заявка на рассмотрении'}
        lede={ui.authLedePending ?? 'Заявка отправлена ранее. Доступ пока не открыт.'}
      />
      <ModalBody>
        <div className={styles.content}>
          <div className={styles.status}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.email}>{email}</span>
            <span className={styles.tag}>{ui.authPendingTag ?? 'на проверке'}</span>
          </div>
          <AuthNote>
            {ui.authNotePending ??
              'Каждая заявка рассматривается лично. Если указанных сведений окажется недостаточно для подтверждения, будет сделан звонок по номеру телефона из заявки. После подтверждения доступ открывается — вход выполняется с той же почтой и паролем.'}
          </AuthNote>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" autoFocus onClick={onClose} className={styles.ok}>
          {ui.authOk ?? 'Понятно'}
        </Button>
        <AuthSwitch
          question={ui.authOtherEmail ?? 'Другая почта?'}
          action={ui.authLoginAgain ?? 'Войти заново'}
          onAction={onSwitchToLogin}
        />
      </ModalFooter>
    </>
  )
}
