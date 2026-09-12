import type { ReactNode } from 'react'
import styles from './AuthNote.module.scss'

/** Left-ruled aside used by the register and pending views. */
export default function AuthNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>
}
