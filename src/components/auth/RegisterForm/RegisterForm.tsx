import { useId, useState, type FormEvent } from 'react'
import type { RegisterInput } from '../../../auth/authService'
import {
  hasErrors,
  validateRegister,
  type Errors,
  type RegisterValues,
} from '../../../auth/validators'
import Button from '../../ui/Button/Button'
import { ModalBody, ModalFooter, ModalHeader } from '../../ui/Modal/Modal'
import TextField from '../../ui/TextField/TextField'
import AuthNote from '../AuthNote/AuthNote'
import AuthSwitch from '../AuthSwitch/AuthSwitch'
import { errorText } from '../errorText'
import styles from './RegisterForm.module.scss'

const EMPTY: RegisterValues = {
  email: '',
  phone: '',
  password: '',
  confirm: '',
  relationship: '',
}

export default function RegisterForm({
  ui,
  titleId,
  onSubmit,
  onSwitchToLogin,
}: {
  ui: Record<string, string>
  titleId: string
  onSubmit: (input: RegisterInput) => Promise<void>
  onSwitchToLogin: () => void
}) {
  const formId = useId()
  const [values, setValues] = useState<RegisterValues>(EMPTY)
  const [errors, setErrors] = useState<Errors<RegisterValues>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof RegisterValues) => (value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) {
      const fresh = validateRegister(next)
      setErrors((prev) => ({
        ...prev,
        [field]: fresh[field],
        // the confirmation depends on the password, re-check it too
        ...(field === 'password' ? { confirm: fresh.confirm } : {}),
      }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateRegister(values)
    setErrors(errs)
    if (hasErrors(errs)) return
    setSubmitting(true)
    try {
      await onSubmit({
        email: values.email,
        phone: values.phone,
        password: values.password,
        relationship: values.relationship,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ModalHeader
        titleId={titleId}
        title={ui.authTitleRegister ?? 'Создать аккаунт'}
        lede={
          ui.authLedeRegister ??
          'Укажите, кем вы были для Ларисы Ивановны. Каждая заявка рассматривается лично.'
        }
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
            label={ui.authPhone ?? 'Телефон'}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={ui.authPhonePlaceholder ?? '+7 900 000-00-00'}
            value={values.phone}
            onChange={update('phone')}
            error={errorText(ui, errors.phone)}
          />
          <TextField
            label={ui.authPassword ?? 'Пароль'}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update('password')}
            error={errorText(ui, errors.password)}
          />
          <TextField
            label={ui.authPasswordConfirm ?? 'Повторите пароль'}
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={update('confirm')}
            error={errorText(ui, errors.confirm)}
          />
          <TextField
            label={ui.authRelationship ?? 'Кем вы были для Ларисы Ивановны'}
            multiline
            placeholder={
              ui.authRelationshipPlaceholder ??
              'Пример: Здравствуйте, меня зовут Лидия Александровна. Мы работали вместе с Ларисой Ивановной в Гомельоблдорстрое в 2002–2005 годах.'
            }
            value={values.relationship}
            onChange={update('relationship')}
            error={errorText(ui, errors.relationship)}
          />
          <AuthNote>
            {ui.authNoteRegister ??
              'Каждая заявка рассматривается лично. Если указанных сведений окажется недостаточно для подтверждения, будет сделан звонок по указанному номеру телефона.'}
          </AuthNote>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" type="submit" form={formId} disabled={submitting}>
          {ui.authSubmitRegister ?? 'Зарегистрироваться'}
        </Button>
        <AuthSwitch
          question={ui.authHaveAccount ?? 'Уже есть аккаунт?'}
          action={ui.authGoLogin ?? 'Войти'}
          onAction={onSwitchToLogin}
        />
      </ModalFooter>
    </>
  )
}
