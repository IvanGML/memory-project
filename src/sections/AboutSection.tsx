import Reveal from '../components/ui/Reveal'
import SectionLabel from '../components/ui/SectionLabel'
import type { Content } from '../types/content'
import styles from './AboutSection.module.scss'

export default function AboutSection({ content }: { content: Content }) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <SectionLabel>{content.ui.aboutLabel ?? 'о ней'}</SectionLabel>
        </Reveal>
        {content.about.map((p, i) => (
          <Reveal key={i} delay={i * 100}>
            <p className={styles.paragraph}>{p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
