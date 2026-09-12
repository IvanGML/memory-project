import styles from './AuthSwitch.module.scss'

/** «Нет аккаунта? Зарегистрироваться» — the quiet line that flips views. */
export default function AuthSwitch({
  question,
  action,
  onAction,
}: {
  question: string
  action: string
  onAction: () => void
}) {
  return (
    <p className={styles.switch}>
      {question}{' '}
      <button type="button" onClick={onAction} className={styles.link}>
        {action}
      </button>
    </p>
  )
}
