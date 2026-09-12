import { useId } from 'react'
import { cn } from '../../lib/utils'
import styles from './TextField.module.scss'

/**
 * The single form-field primitive: label + control + quiet error line.
 * Intentionally a closed prop list (not `InputHTMLAttributes`) so one
 * component can render either an `<input>` or a `<textarea>`.
 */
export default function TextField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  multiline = false,
  placeholder,
  autoComplete,
  inputMode,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: 'text' | 'email' | 'password' | 'tel'
  multiline?: boolean
  placeholder?: string
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'text'
  autoFocus?: boolean
}) {
  const id = useId()
  const errorId = `${id}-error`
  const shared = {
    id,
    value,
    placeholder,
    autoComplete,
    autoFocus,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          className={cn(styles.control, styles.textarea)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          inputMode={inputMode}
          className={styles.control}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
