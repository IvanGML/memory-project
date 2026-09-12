import type { MouseEvent, ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'outline' | 'text'

export default function Button({
  variant = 'outline',
  type = 'button',
  form,
  onClick,
  disabled,
  autoFocus,
  className,
  children,
}: {
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  /** id of a `<form>` this button submits — lets a footer button own a body form. */
  form?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={cn(styles.button, styles[variant], className)}
    >
      {children}
    </button>
  )
}
