import { useTheme } from '../../../hooks/useTheme'
import { cn } from '../../../lib/utils'
import styles from './ThemeToggle.module.scss'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label="Theme"
      aria-pressed={isDark}
    >
      <span className={cn(styles.icon, isDark ? styles.sun : styles.moon)} />
    </button>
  )
}
