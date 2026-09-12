import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn, cssVars } from '../../../lib/utils'
import styles from './Reveal.module.scss'

export default function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible(true)
        })
      },
      { threshold: 0.12, rootMargin: '-40px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(styles.reveal, visible && styles.visible)}
      style={cssVars({ '--reveal-delay': `${delay}ms` })}
    >
      {children}
    </div>
  )
}
