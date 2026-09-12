import { useEffect, useRef, useState } from 'react'
import { clamp, cn, cssVars, easeOut } from '../../lib/utils'
import styles from './IntroOverlay.module.scss'

const INTRO_DURATION_MS = 4200
const FADE_OUT_MS = 900
const SKIP_FADE_MS = 600

export default function IntroOverlay({
  onComplete,
  ui,
}: {
  onComplete: () => void
  ui: Record<string, string>
}) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [fading, setFading] = useState(false)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf: number
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts
      const elapsed = ts - startRef.current
      setElapsedMs(elapsed)
      if (elapsed < INTRO_DURATION_MS) raf = requestAnimationFrame(step)
      else {
        setFading(true)
        setTimeout(onComplete, FADE_OUT_MS)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  const skip = () => {
    setFading(true)
    setTimeout(onComplete, SKIP_FADE_MS)
  }
  const progress = Math.min(1, elapsedMs / INTRO_DURATION_MS)

  const haloSize = easeOut(clamp(progress / 0.4, 0, 1)) * 600 + 40
  const haloOp =
    easeOut(clamp(progress / 0.3, 0, 1)) *
    0.85 *
    (progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1)

  const birdOp =
    progress < 0.22
      ? easeOut(progress / 0.22)
      : progress > 0.8
        ? Math.max(0, 1 - (progress - 0.8) / 0.2)
        : 1
  const birdY = Math.sin(progress * Math.PI) * -24 - 6
  const breath = 1 + Math.sin(progress * Math.PI * 2) * 0.015
  const bank = Math.sin(progress * Math.PI * 1.4) * 3

  return (
    <div
      onClick={skip}
      className={cn(styles.overlay, fading && styles.fading)}
      style={cssVars({
        '--halo-size': `${haloSize}px`,
        '--halo-op': haloOp,
        '--bird-y': `${birdY}px`,
        '--breath': breath,
        '--bank': `${bank}deg`,
        '--bird-op': birdOp,
      })}
    >
      <div className={styles.halo} />
      <div className={styles.bird} aria-hidden="true" />

      <button
        onClick={(e) => {
          e.stopPropagation()
          skip()
        }}
        className={cn(styles.skip, progress > 0.3 && styles.skipVisible)}
      >
        {ui.skipIntro ?? 'пропустить'}
      </button>
    </div>
  )
}
