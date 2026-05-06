import type { ReactNode } from 'react'
import styles from './SectionLabel.module.scss'

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className={styles.label}>
      <span className={styles.rule} />
      {children}
      <span className={styles.rule} />
    </div>
  )
}
