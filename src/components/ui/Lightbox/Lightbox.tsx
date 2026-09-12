import { useEffect } from 'react'
import type { GalleryItem } from '../../../types/content'
import { cn } from '../../../lib/utils'
import styles from './Lightbox.module.scss'

export default function Lightbox({
  gallery,
  idx,
  onClose,
  onChange,
  ui,
}: {
  gallery: GalleryItem[]
  idx: number
  onClose: () => void
  onChange: (i: number) => void
  ui: Record<string, string>
}) {
  const n = gallery.length
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((idx + 1) % n)
      if (e.key === 'ArrowLeft') onChange((idx - 1 + n) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, n, onChange, onClose])

  const item = gallery[idx]
  return (
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={(e) => e.stopPropagation()} className={styles.frame}>
        <img src={item.src} alt={item.label ?? ''} className={styles.image} />
        {item.label && <div className={styles.label}>{item.label}</div>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onChange((idx - 1 + n) % n)
        }}
        aria-label="prev"
        className={cn(styles.nav, styles.prev)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path
            d="M12 4 L6 10 L12 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onChange((idx + 1) % n)
        }}
        aria-label="next"
        className={cn(styles.nav, styles.next)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path
            d="M8 4 L14 10 L8 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button onClick={onClose} aria-label="close" className={styles.close}>
        {ui.lightboxClose ?? 'закрыть'}
      </button>
      <div className={styles.counter}>
        {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </div>
    </div>
  )
}
