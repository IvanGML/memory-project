import { useEffect, useRef, useState } from 'react'
import MemoryCard from '../../components/ui/MemoryCard/MemoryCard'
import NavArrow from '../../components/ui/NavArrow/NavArrow'
import Reveal from '../../components/ui/Reveal/Reveal'
import SectionLabel from '../../components/ui/SectionLabel/SectionLabel'
import { cn, cssVars } from '../../lib/utils'
import type { Content } from '../../types/content'
import styles from './MemoriesSection.module.scss'

const AUTO_ADVANCE_MS = 9000
const SWIPE_THRESHOLD_PX = 50

export default function MemoriesSection({ content }: { content: Content }) {
  const memories = content.memories
  const memoryCount = memories.length
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchRef = useRef<{ x: number; active: boolean }>({ x: 0, active: false })

  const next = () => setActiveIndex((i) => (i + 1) % memoryCount)
  const prev = () => setActiveIndex((i) => (i - 1 + memoryCount) % memoryCount)

  useEffect(() => {
    if (paused || memoryCount === 0) return
    const t = setTimeout(
      () => setActiveIndex((i) => (i + 1) % memoryCount),
      AUTO_ADVANCE_MS,
    )
    return () => clearTimeout(t)
  }, [activeIndex, paused, memoryCount])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        setPaused(true)
        setActiveIndex((i) => (i + 1) % memoryCount)
      }
      if (e.key === 'ArrowLeft') {
        setPaused(true)
        setActiveIndex((i) => (i - 1 + memoryCount) % memoryCount)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [memoryCount])

  if (memoryCount === 0) return null

  return (
    <section
      className={styles.section}
      onTouchStart={(e) => {
        touchRef.current = { x: e.touches[0].clientX, active: true }
      }}
      onTouchEnd={(e) => {
        if (!touchRef.current.active) return
        const dx = e.changedTouches[0].clientX - touchRef.current.x
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
          setPaused(true)
          if (dx < 0) next()
          else prev()
        }
        touchRef.current.active = false
      }}
    >
      <Reveal>
        <SectionLabel>{content.ui.memoriesLabel ?? 'воспоминания'}</SectionLabel>
      </Reveal>

      <div className={styles.carousel}>
        {memories.map((m, i) => {
          const offset = i - activeIndex
          const active = i === activeIndex
          return (
            <div
              key={m.id}
              className={cn(styles.card, active && styles.active)}
              style={cssVars({ '--carousel-offset': offset })}
            >
              <MemoryCard memory={m} />
            </div>
          )
        })}

        <NavArrow
          dir="left"
          onClick={() => {
            setPaused(true)
            prev()
          }}
        />
        <NavArrow
          dir="right"
          onClick={() => {
            setPaused(true)
            next()
          }}
        />
      </div>

      <div className={styles.dots}>
        {memories.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPaused(true)
              setActiveIndex(i)
            }}
            aria-label={`${i + 1}`}
            className={cn(styles.dot, i === activeIndex && styles.activeDot)}
          />
        ))}
      </div>

      <div className={styles.counter}>
        {String(activeIndex + 1).padStart(2, '0')} /{' '}
        {String(memoryCount).padStart(2, '0')}
      </div>
    </section>
  )
}
