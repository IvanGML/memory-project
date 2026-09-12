import { cn } from '../../../lib/utils'
import styles from './NavArrow.module.scss'

export default function NavArrow({
  dir,
  onClick,
}: {
  dir: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(styles.arrow, styles[dir])}
      aria-label={dir}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        {dir === 'left' ? (
          <path
            d="M12 4 L6 10 L12 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M8 4 L14 10 L8 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  )
}
