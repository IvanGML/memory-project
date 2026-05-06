import { useState } from 'react'
import Reveal from '../components/ui/Reveal'
import SectionLabel from '../components/ui/SectionLabel'
import type { Content } from '../types/content'
import styles from './FilmSection.module.scss'

export default function FilmSection({ content }: { content: Content }) {
  const [playing, setPlaying] = useState(false)
  return (
    <section className={styles.section}>
      <Reveal>
        <SectionLabel>{content.ui.filmLabel ?? 'фильм'}</SectionLabel>
      </Reveal>
      <Reveal delay={120}>
        <h2 className={styles.title}>{content.filmTitle}</h2>
      </Reveal>
      <Reveal delay={240}>
        <div onClick={() => setPlaying(true)} className={styles.preview}>
          <div className={styles.glow} />
          <div className={styles.playButton}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className={styles.playIcon}
            >
              <path d="M6 4 L20 12 L6 20 Z" fill="rgba(255,255,255,0.95)" />
            </svg>
          </div>
          <div className={styles.hint}>
            {playing ? content.filmHint.playing : content.filmHint.idle}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
