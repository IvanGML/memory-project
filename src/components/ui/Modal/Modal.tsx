import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Modal.module.scss'

/**
 * Generic dialog shell. Content is composed from the three region
 * components below (header / scrolling body / footer) so the card can
 * cap itself at 90vh and only the body scrolls.
 *
 * Mounted conditionally by the parent (same pattern as `Lightbox`).
 * The parent is responsible for returning focus to the opener on close.
 */
export default function Modal({
  onClose,
  labelledBy,
  closeLabel,
  children,
}: {
  onClose: () => void
  /** id of the element that names the dialog (the `ModalHeader` title). */
  labelledBy: string
  closeLabel: string
  children: ReactNode
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const pointerDownOnBackdrop = useRef(false)

  // Keep the latest onClose in a ref so the Escape listener subscribes once,
  // however often the parent re-creates the callback.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    // Views mark their first control `autoFocus`; this is the fallback.
    const card = cardRef.current
    if (card && !card.contains(document.activeElement)) {
      card.querySelector<HTMLElement>('input, textarea, button')?.focus()
    }
  }, [])

  return (
    <div
      className={styles.backdrop}
      onPointerDown={(e) => {
        pointerDownOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        // Close only for a click that started AND ended on the scrim, so a
        // text-selection drag out of an input never dismisses the form.
        if (pointerDownOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={styles.card}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={styles.close}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 2 12 12M12 2 2 12"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ModalHeader({
  titleId,
  title,
  lede,
}: {
  titleId: string
  title: string
  lede?: string
}) {
  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {lede && <p className={styles.lede}>{lede}</p>}
    </div>
  )
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}
