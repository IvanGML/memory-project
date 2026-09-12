import { useId, useState, type FormEvent } from 'react'
import {
  hasErrors,
  validateLogin,
  type Errors,
  type LoginValues,
} from '../../../auth/validators'
import Button from '../../ui/Button/Button'
import { ModalBody, ModalFooter, ModalHeader } from '../../ui/Modal/Modal'
import TextField from '../../ui/TextField/TextField'
import AuthSwitch from '../AuthSwitch/AuthSwitch'
import { errorText } from '../errorText'
import styles from './LoginForm.module.scss'

const EMPTY: LoginValues = { email: '', password: '' }

export default function LoginForm({
  ui,
  titleId,
  onSubmit,
  onSwitchToRegister,
}: {
  ui: Record<string, string>
  titleId: string
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void
}) {
  const formId = useId()
  const [values, setValues] = useState<LoginValues>(EMPTY)
  const [errors, setErrors] = useState<Errors<LoginValues>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof LoginValues) => (value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) {
      const fresh = validateLogin(next)
      setErrors((prev) => ({ ...prev, [field]: fresh[field] }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateLogin(values)
    setErrors(errs)
    if (hasErrors(errs)) return
    setSubmitting(true)
    try {
      await onSubmit(values.email, values.password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ModalHeader
        titleId={titleId}
        title={ui.authTitleLogin ?? 'Войти'}
        lede={ui.authLedeLogin ?? 'Вход в личное пространство памяти.'}
      />
      <ModalBody>
        <form id={formId} onSubmit={handleSubmit} noValidate className={styles.form}>
          <TextField
            label={ui.authEmail ?? 'Email'}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder={ui.authEmailPlaceholder ?? 'имя@почта.ру'}
            value={values.email}
            onChange={update('email')}
            error={errorText(ui, errors.email)}
          />
          <TextField
            label={ui.authPassword ?? 'Пароль'}
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={update('password')}
            error={errorText(ui, errors.password)}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" type="submit" form={formId} disabled={submitting}>
          {ui.authSubmitLogin ?? 'Войти'}
        </Button>
        <AuthSwitch
          question={ui.authNoAccount ?? 'Нет аккаунта?'}
          action={ui.authGoRegister ?? 'Зарегистрироваться'}
          onAction={onSwitchToRegister}
        />
      </ModalFooter>
    </>
  )
}
