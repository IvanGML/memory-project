import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ─── Content types ──────────────────────────────────────────────
type Memory = {
  id: string
  from?: string
  title?: string
  content: string
}

type GalleryItem = {
  src: string
  label?: string
  tall?: boolean
}

type Content = {
  name: string
  fullName?: string
  years: string
  subtitle: string
  about: string[]
  filmTitle: string
  filmHint: { idle: string; playing: string }
  memories: Memory[]
  gallery: GalleryItem[]
  finalLines: string[]
  ui: Record<string, string>
}

const FALLBACK: Content = {
  name: '',
  years: '',
  subtitle: '',
  about: [],
  filmTitle: '',
  filmHint: { idle: '', playing: '' },
  memories: [],
  gallery: [],
  finalLines: [],
  ui: {},
}

// ─── Utilities ──────────────────────────────────────────────────
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

const INTRO_SEEN_KEY = 'memorial:introSeen'

// ─── Reveal-on-scroll wrapper ───────────────────────────────────
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 1000ms cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 1000ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--sans)',
        fontSize: 11,
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 44,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <span style={{ width: 32, height: 1, background: 'var(--muted)', opacity: 0.5 }} />
      {children}
      <span style={{ width: 32, height: 1, background: 'var(--muted)', opacity: 0.5 }} />
    </div>
  )
}

// ─── Intro: dove + halo ─────────────────────────────────────────
function IntroOverlay({
  onComplete,
  ui,
}: {
  onComplete: () => void
  ui: Record<string, string>
}) {
  const [t, setT] = useState(0)
  const [fading, setFading] = useState(false)
  const startRef = useRef<number | null>(null)
  const duration = 4200

  useEffect(() => {
    let raf: number
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts
      const elapsed = ts - startRef.current
      setT(elapsed)
      if (elapsed < duration) raf = requestAnimationFrame(step)
      else {
        setFading(true)
        setTimeout(onComplete, 900)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  const skip = () => {
    setFading(true)
    setTimeout(onComplete, 600)
  }
  const progress = Math.min(1, t / duration)

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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--bg)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 900ms cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: haloSize,
          height: haloSize,
          marginLeft: -haloSize / 2,
          marginTop: -haloSize / 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--halo) 0%, transparent 70%)',
          opacity: haloOp,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 'min(420px, 68vw)',
          aspectRatio: '676 / 391',
          transform: `translate(-50%, -50%) translateY(${birdY}px) scale(${breath}) rotate(${bank}deg)`,
          opacity: birdOp,
        }}
      >
        <img
          src="/assets/dove.png"
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          skip()
        }}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 32,
          background: 'transparent',
          border: 'none',
          color: 'var(--muted)',
          fontFamily: 'var(--sans)',
          fontSize: 12,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          opacity: progress > 0.3 ? 0.55 : 0,
          transition: 'opacity 500ms',
        }}
      >
        {ui.skipIntro ?? 'пропустить'}
      </button>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────
function ScrollHint({ visible, ui }: { visible: boolean; ui: Record<string, string> }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--sans)',
        fontSize: 10,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        opacity: visible ? 0.55 : 0,
        transition: 'opacity 1400ms ease 1800ms',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span>{ui.scrollHint ?? 'дальше'}</span>
      <div
        style={{
          width: 1,
          height: 28,
          background: 'var(--muted)',
          animation: 'scrollHint 2.4s ease-in-out infinite',
        }}
      />
    </div>
  )
}

function HeroSection({ content, visible }: { content: Content; visible: boolean }) {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative',
      }}
    >
      <div
        className="hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.1fr)',
          gap: 'clamp(32px, 6vw, 80px)',
          alignItems: 'center',
          maxWidth: 1100,
          width: '100%',
        }}
      >
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-20px)',
            transition:
              'opacity 1400ms cubic-bezier(0.4,0,0.2,1) 200ms, transform 1400ms cubic-bezier(0.4,0,0.2,1) 200ms',
          }}
        >
          <div
            style={{
              aspectRatio: '4/5',
              width: '100%',
              background: 'url(/assets/hero.jpg) center 18% / cover',
              boxShadow: '0 12px 60px rgba(58,47,34,0.18)',
              filter: 'sepia(0.08) contrast(1.02)',
            }}
          />
        </div>
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition:
              'opacity 1400ms cubic-bezier(0.4,0,0.2,1) 500ms, transform 1400ms cubic-bezier(0.4,0,0.2,1) 500ms',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 12,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 24,
            }}
          >
            {content.ui.inMemory ?? 'в память'}
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(44px, 6.4vw, 80px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            {content.name}
          </h1>
          <div
            style={{
              marginTop: 20,
              fontFamily: 'var(--sans)',
              fontSize: 14,
              letterSpacing: '0.28em',
              color: 'var(--muted)',
            }}
          >
            {content.years}
          </div>
          <p
            style={{
              marginTop: 36,
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(18px, 1.6vw, 22px)',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.6,
              color: 'var(--text)',
              opacity: 0.82,
              maxWidth: 420,
              margin: '36px 0 0',
            }}
          >
            {content.subtitle}
          </p>
        </div>
      </div>
      <ScrollHint visible={visible} ui={content.ui} />
    </section>
  )
}

// ─── About ──────────────────────────────────────────────────────
function AboutSection({ content }: { content: Content }) {
  return (
    <section
      style={{
        padding: 'clamp(100px, 16vh, 180px) 24px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <Reveal>
          <SectionLabel>{content.ui.aboutLabel ?? 'о ней'}</SectionLabel>
        </Reveal>
        {content.about.map((p, i) => (
          <Reveal key={i} delay={i * 100}>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(18px, 1.45vw, 22px)',
                lineHeight: 1.75,
                color: 'var(--text)',
                marginBottom: 28,
                textWrap: 'pretty',
              }}
            >
              {p}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ─── Film ───────────────────────────────────────────────────────
function FilmSection({ content }: { content: Content }) {
  const [playing, setPlaying] = useState(false)
  return (
    <section
      style={{
        padding: 'clamp(100px, 16vh, 180px) 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Reveal>
        <SectionLabel>{content.ui.filmLabel ?? 'фильм'}</SectionLabel>
      </Reveal>
      <Reveal delay={120}>
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(30px, 3.8vw, 44px)',
            fontWeight: 400,
            lineHeight: 1.2,
            textAlign: 'center',
            color: 'var(--text)',
            margin: '0 0 56px',
            maxWidth: 620,
          }}
        >
          {content.filmTitle}
        </h2>
      </Reveal>
      <Reveal delay={240}>
        <div
          onClick={() => setPlaying(true)}
          className="film-preview"
          style={{
            width: 'min(900px, 100%)',
            aspectRatio: '16/9',
            position: 'relative',
            cursor: 'pointer',
            borderRadius: 2,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #2a2420 0%, #1a1612 100%)',
            boxShadow: '0 16px 60px rgba(58,47,34,0.2)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(200,170,120,0.18), transparent 60%)',
            }}
          />
          <div
            className="play-button"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
              <path d="M6 4 L20 12 L6 20 Z" fill="rgba(255,255,255,0.95)" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 22,
              left: 26,
              fontFamily: 'var(--sans)',
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {playing ? content.filmHint.playing : content.filmHint.idle}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

// ─── Memories ───────────────────────────────────────────────────
function NavArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="nav-arrow"
      aria-label={dir}
      style={{
        position: 'absolute',
        [dir === 'left' ? 'left' : 'right']: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        {dir === 'left' ? (
          <path
            d="M12 4 L6 10 L12 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M8 4 L14 10 L8 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  )
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <article style={{ padding: '0 16px', textAlign: 'center' }}>
      {memory.from && (
        <div
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 20,
          }}
        >
          {memory.from}
        </div>
      )}
      {memory.title && (
        <h3
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(26px, 2.6vw, 34px)',
            fontWeight: 400,
            lineHeight: 1.25,
            color: 'var(--text)',
            margin: '0 0 32px',
          }}
        >
          {memory.title}
        </h3>
      )}
      <p
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(19px, 1.5vw, 22px)',
          lineHeight: 1.7,
          color: 'var(--text)',
          margin: 0,
          textWrap: 'pretty',
        }}
      >
        {memory.content}
      </p>
    </article>
  )
}

function MemoriesSection({ content }: { content: Content }) {
  const memories = content.memories
  const n = memories.length
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchRef = useRef<{ x: number; active: boolean }>({ x: 0, active: false })

  const next = () => setIdx((i) => (i + 1) % n)
  const prev = () => setIdx((i) => (i - 1 + n) % n)

  useEffect(() => {
    if (paused || n === 0) return
    const t = setTimeout(() => setIdx((i) => (i + 1) % n), 9000)
    return () => clearTimeout(t)
  }, [idx, paused, n])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        setPaused(true)
        setIdx((i) => (i + 1) % n)
      }
      if (e.key === 'ArrowLeft') {
        setPaused(true)
        setIdx((i) => (i - 1 + n) % n)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n])

  if (n === 0) return null

  return (
    <section
      style={{
        padding: 'clamp(100px, 16vh, 180px) 0',
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={(e) => {
        touchRef.current = { x: e.touches[0].clientX, active: true }
      }}
      onTouchEnd={(e) => {
        if (!touchRef.current.active) return
        const dx = e.changedTouches[0].clientX - touchRef.current.x
        if (Math.abs(dx) > 50) {
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

      <div
        style={{
          position: 'relative',
          minHeight: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 clamp(24px, 6vw, 80px)',
        }}
      >
        {memories.map((m, i) => {
          const offset = i - idx
          const active = i === idx
          return (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 'min(640px, calc(100% - clamp(48px, 12vw, 160px)))',
                transform: `translateX(calc(-50% + ${offset * 50}px))`,
                opacity: active ? 1 : 0,
                pointerEvents: active ? 'auto' : 'none',
                transition:
                  'opacity 700ms cubic-bezier(0.4,0,0.2,1), transform 700ms cubic-bezier(0.4,0,0.2,1)',
              }}
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

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
        {memories.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPaused(true)
              setIdx(i)
            }}
            aria-label={`${i + 1}`}
            style={{
              width: i === idx ? 28 : 6,
              height: 6,
              borderRadius: 3,
              background: 'var(--text)',
              opacity: i === idx ? 0.8 : 0.2,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: 20,
          fontFamily: 'var(--sans)',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </div>
    </section>
  )
}

// ─── Gallery ────────────────────────────────────────────────────
function GalleryImage({ img, aspect }: { img: GalleryItem; aspect: string }) {
  return (
    <div
      style={{
        aspectRatio: aspect,
        width: '100%',
        background: `url(${img.src}) center / cover`,
        backgroundColor: 'var(--photo-bg)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(58,47,34,0.1)',
        transition:
          'transform 500ms cubic-bezier(0.4,0,0.2,1), box-shadow 500ms',
      }}
    >
      <div
        className="gallery-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 60%, rgba(20,15,8,0.35) 100%)',
          opacity: 0,
          transition: 'opacity 400ms',
        }}
      />
      {img.label && (
        <div
          className="gallery-caption"
          style={{
            position: 'absolute',
            bottom: 10,
            left: 12,
            right: 12,
            fontFamily: 'var(--sans)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'lowercase',
            color: 'rgba(255,255,255,0.92)',
            opacity: 0,
            transform: 'translateY(4px)',
            transition: 'opacity 400ms, transform 400ms',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}
        >
          {img.label}
        </div>
      )}
    </div>
  )
}

function Lightbox({
  gallery,
  idx,
  onClose,
  onChange,
  ui,
}: {
  gallery: GalleryItem[]
  idx: number
  onClose: () => void
  onChange: (i: number) => void
  ui: Record<string, string>
}) {
  const n = gallery.length
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((idx + 1) % n)
      if (e.key === 'ArrowLeft') onChange((idx - 1 + n) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, n, onChange, onClose])

  const item = gallery[idx]
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        animation: 'fadeIn 300ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1100px, 92%)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <img
          src={item.src}
          alt={item.label ?? ''}
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        />
        {item.label && (
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 12,
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'lowercase',
            }}
          >
            {item.label}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onChange((idx - 1 + n) % n)
        }}
        aria-label="prev"
        style={{
          position: 'absolute',
          left: 32,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 44,
          height: 44,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path
            d="M12 4 L6 10 L12 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onChange((idx + 1) % n)
        }}
        aria-label="next"
        style={{
          position: 'absolute',
          right: 32,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 44,
          height: 44,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path
            d="M8 4 L14 10 L8 16"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        onClick={onClose}
        aria-label="close"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'var(--sans)',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {ui.lightboxClose ?? 'закрыть'}
      </button>
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--sans)',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.5)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </div>
    </div>
  )
}

function GallerySection({ content }: { content: Content }) {
  const [lb, setLb] = useState<number | null>(null)
  return (
    <section
      style={{
        padding: 'clamp(100px, 16vh, 180px) 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Reveal>
        <SectionLabel>{content.ui.galleryLabel ?? 'галерея'}</SectionLabel>
      </Reveal>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 'clamp(10px, 1.4vw, 16px)',
          width: '100%',
          maxWidth: 1000,
        }}
      >
        {content.gallery.map((img, i) => (
          <Reveal key={i} delay={(i % 4) * 80}>
            <button
              onClick={() => setLb(i)}
              className="gallery-tile"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '100%',
                gridRowEnd: img.tall ? 'span 2' : undefined,
              }}
            >
              <GalleryImage img={img} aspect={img.tall ? '3/4' : '4/3'} />
            </button>
          </Reveal>
        ))}
      </div>
      {lb != null && (
        <Lightbox
          gallery={content.gallery}
          idx={lb}
          onClose={() => setLb(null)}
          onChange={setLb}
          ui={content.ui}
        />
      )}
    </section>
  )
}

// ─── Final ──────────────────────────────────────────────────────
function FinalSection({ content }: { content: Content }) {
  const replay = () => {
    try {
      localStorage.removeItem(INTRO_SEEN_KEY)
    } catch {
      /* ignore — privacy mode */
    }
    window.location.reload()
  }

  return (
    <section
      style={{
        padding: 'clamp(140px, 22vh, 220px) 24px',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Reveal>
        <div
          style={{
            width: 1,
            height: 64,
            background: 'var(--muted)',
            opacity: 0.4,
            marginBottom: 64,
          }}
        />
      </Reveal>
      {content.finalLines.map((line, i) => (
        <Reveal key={i} delay={i * 400}>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(22px, 2.2vw, 28px)',
              fontWeight: 400,
              fontStyle: i === content.finalLines.length - 1 ? 'italic' : 'normal',
              lineHeight: 1.6,
              color: 'var(--text)',
              margin: '0 0 20px',
              maxWidth: 560,
            }}
          >
            {line}
          </p>
        </Reveal>
      ))}
      <Reveal delay={content.finalLines.length * 400 + 200}>
        <div style={{ marginTop: 64, width: 1, height: 64, background: 'var(--muted)', opacity: 0.4 }} />
      </Reveal>
      <Reveal delay={content.finalLines.length * 400 + 600}>
        <button
          onClick={replay}
          className="replay-intro"
          aria-label="посмотреть сначала"
          style={{
            marginTop: 48,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 4px',
            fontFamily: 'var(--sans)',
            fontSize: 11,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            opacity: 0.55,
            transition: 'opacity 400ms ease, color 400ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
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

// ─── App ────────────────────────────────────────────────────────
function App() {
  const [content, setContent] = useState<Content | null>(null)
  const [introVisible, setIntroVisible] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(INTRO_SEEN_KEY)
    } catch {
      return true
    }
  })
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/content.json', { cache: 'no-cache' })
      .then((r) => r.json() as Promise<Content>)
      .then((data) => {
        if (!cancelled) setContent(data)
      })
      .catch((err) => {
        console.error('Не удалось загрузить content.json:', err)
        if (!cancelled) setContent(FALLBACK)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (content) document.title = `${content.name} — в память`
  }, [content])

  useEffect(() => {
    if (!introVisible) setHeroVisible(true)
  }, [introVisible])

  const onIntroComplete = useMemo(
    () => () => {
      try {
        localStorage.setItem(INTRO_SEEN_KEY, '1')
      } catch {
        /* ignore */
      }
      setIntroVisible(false)
      setTimeout(() => setHeroVisible(true), 100)
    },
    [],
  )

  if (!content) return null

  return (
    <>
      {introVisible && <IntroOverlay onComplete={onIntroComplete} ui={content.ui} />}
      <main>
        <HeroSection content={content} visible={heroVisible} />
        <AboutSection content={content} />
        <FilmSection content={content} />
        <MemoriesSection content={content} />
        <GallerySection content={content} />
        <FinalSection content={content} />
      </main>
    </>
  )
}

export default App
