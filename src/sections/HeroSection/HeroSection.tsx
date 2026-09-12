import AuthCta from '../../components/auth/AuthCta/AuthCta'
import { cn } from '../../lib/utils'
import type { Content } from '../../types/content'
import styles from './HeroSection.module.scss'

function ScrollHint({
  visible,
  ui,
}: {
  visible: boolean
  ui: Record<string, string>
}) {
  return (
    <div className={cn(styles.scrollHint, visible && styles.visible)}>
      <span>{ui.scrollHint ?? 'дальше'}</span>
      <div className={styles.scrollHintBar} />
    </div>
  )
}

export default function HeroSection({
  content,
  visible,
  variant,
}: {
  content: Content
  visible: boolean
  /** `public` swaps the scroll hint for the auth doorway and fits one screen. */
  variant: 'public' | 'private'
}) {
  const isPublic = variant === 'public'
  return (
    <section className={cn(styles.section, isPublic && styles.public)}>
      <div className={styles.grid}>
        <div className={cn(styles.imageCol, visible && styles.visible)}>
          <div className={styles.image} />
        </div>
        <div className={cn(styles.textCol, visible && styles.visible)}>
          <div className={styles.label}>{content.ui.inMemory ?? 'в память'}</div>
          <h1 className={styles.name}>{content.name}</h1>
          <div className={styles.years}>{content.years}</div>
          <p className={styles.subtitle}>{content.subtitle}</p>
        </div>
      </div>
      {isPublic ? (
        <AuthCta ui={content.ui} visible={visible} />
      ) : (
        <ScrollHint visible={visible} ui={content.ui} />
      )}
    </section>
  )
}
