export type FieldError =
  | 'required'
  | 'email'
  | 'passwordShort'
  | 'passwordMismatch'
  | 'phone'
  | 'relationshipShort'

export type LoginValues = { email: string; password: string }
export type RegisterValues = LoginValues & {
  phone: string
  confirm: string
  relationship: string
}
export type Errors<T> = Partial<Record<keyof T, FieldError>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?\d{10,15}$/
const PASSWORD_MIN = 8
const RELATIONSHIP_MIN = 20

export const validateEmail = (v: string): FieldError | undefined => {
  const t = v.trim()
  if (!t) return 'required'
  return EMAIL_RE.test(t) ? undefined : 'email'
}

export const validatePassword = (v: string): FieldError | undefined => {
  if (!v) return 'required'
  return v.length < PASSWORD_MIN ? 'passwordShort' : undefined
}

export const validateConfirm = (
  v: string,
  password: string,
): FieldError | undefined => {
  if (!v) return 'required'
  return v !== password ? 'passwordMismatch' : undefined
}

export const validatePhone = (v: string): FieldError | undefined => {
  const digits = v.replace(/[\s()-]/g, '')
  if (!digits) return 'required'
  return PHONE_RE.test(digits) ? undefined : 'phone'
}

export const validateRelationship = (v: string): FieldError | undefined => {
  const t = v.trim()
  if (!t) return 'required'
  return t.length < RELATIONSHIP_MIN ? 'relationshipShort' : undefined
}

export function validateLogin(v: LoginValues): Errors<LoginValues> {
  return {
    email: validateEmail(v.email),
    password: validatePassword(v.password),
  }
}

export function validateRegister(v: RegisterValues): Errors<RegisterValues> {
  return {
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
    password: validatePassword(v.password),
    confirm: validateConfirm(v.confirm, v.password),
    relationship: validateRelationship(v.relationship),
  }
}

export const hasErrors = (errors: object): boolean =>
  Object.values(errors).some(Boolean)
