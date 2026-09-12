import type { FieldError } from '../../auth/validators'

const UI_KEY: Record<FieldError, string> = {
  required: 'authErrRequired',
  email: 'authErrEmail',
  passwordShort: 'authErrPasswordShort',
  passwordMismatch: 'authErrPasswordMismatch',
  phone: 'authErrPhone',
  relationshipShort: 'authErrRelationshipShort',
}

const FALLBACK: Record<FieldError, string> = {
  required: 'Обязательное поле',
  email: 'Проверьте адрес почты',
  passwordShort: 'Не короче 8 символов',
  passwordMismatch: 'Пароли не совпадают',
  phone: 'Телефон: от 10 до 15 цифр',
  relationshipShort: 'Расскажите чуть подробнее — не меньше 20 символов',
}

/** Maps a validator code to user-facing text at the i18n boundary. */
export function errorText(
  ui: Record<string, string>,
  code: FieldError | undefined,
): string | undefined {
  if (!code) return undefined
  return ui[UI_KEY[code]] ?? FALLBACK[code]
}
