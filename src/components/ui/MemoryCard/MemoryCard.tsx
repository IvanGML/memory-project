import type { Memory } from '../../../types/content'
import styles from './MemoryCard.module.scss'

export default function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <article className={styles.card}>
      {memory.from && <div className={styles.from}>{memory.from}</div>}
      {memory.title && <h3 className={styles.title}>{memory.title}</h3>}
      <p className={styles.body}>{memory.content}</p>
    </article>
  )
}
