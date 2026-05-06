import Reveal from '../components/ui/Reveal'
import { useLocalStorageFlag } from '../hooks/useLocalStorageFlag'
import { INTRO_SEEN_KEY, cn } from '../lib/utils'
import type { Content } from '../types/content'
import styles from './FinalSection.module.scss'

export default function FinalSection({ content }: { content: Content }) {
  const introSeen = useLocalStorageFlag(INTRO_SEEN_KEY)

  const replay = () => {
    introSeen.clear()
    window.location.reload()
  }

  return (
    <section className={styles.section}>
      <Reveal>
        <div className={cn(styles.divider, styles.top)} />
      </Reveal>
      {content.finalLines.map((line, i) => (
        <Reveal key={i} delay={i * 400}>
          <p
            className={cn(
              styles.line,
              i === content.finalLines.length - 1 && styles.last,
            )}
          >
            {line}
          </p>
        </Reveal>
      ))}
      <Reveal delay={content.finalLines.length * 400 + 200}>
        <div className={cn(styles.divider, styles.bottom)} />
      </Reveal>
      <Reveal delay={content.finalLines.length * 400 + 600}>
        <button
          onClick={replay}
          className={styles.replay}
          aria-label="посмотреть сначала"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={styles.replayIcon}
          >
            <path
              d="M12 7a5 5 0 1 1-1.5-3.5M12 1.5V4h-2.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{content.ui.replayIntro ?? 'сначала'}</span>
        </button>
      </Reveal>
    </section>
  )
}
