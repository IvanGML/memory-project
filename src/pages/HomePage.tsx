import { useEffect, useState } from 'react'
import SignOutButton from '../components/auth/SignOutButton'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useContent } from '../content/useContent'
import AboutSection from '../sections/AboutSection'
import FilmSection from '../sections/FilmSection'
import FinalSection from '../sections/FinalSection'
import GallerySection from '../sections/GallerySection'
import HeroSection from '../sections/HeroSection'
import IntroOverlay from '../sections/IntroOverlay'
import MemoriesSection from '../sections/MemoriesSection'

const HERO_REVEAL_DELAY_MS = 100

/**
 * The intro plays once per page load — on every reload of `/` or `/memory`,
 * but not again when the router swaps one variant of this page for the
 * other (login, logout). A module-level flag lives exactly that long.
 */
let introPlayedThisLoad = false

/**
 * `public`  — `/`: Intro + Hero with the auth doorway, nothing below.
 * `private` — `/memory`: Intro + Hero + the full memory space.
 * Route guards in `App.tsx` decide which one renders; this page only lays out.
 */
export default function HomePage({ variant }: { variant: 'public' | 'private' }) {
  const { data: content } = useContent()
  const [introVisible, setIntroVisible] = useState(!introPlayedThisLoad)
  const [heroVisible, setHeroVisible] = useState(introPlayedThisLoad)
  const isPrivate = variant === 'private'

  useEffect(() => {
    if (content) document.title = `${content.name} — в память`
  }, [content])

  if (!content) return null

  const onIntroComplete = () => {
    introPlayedThisLoad = true
    setIntroVisible(false)
    setTimeout(() => setHeroVisible(true), HERO_REVEAL_DELAY_MS)
  }

  return (
    <>
      {introVisible && <IntroOverlay onComplete={onIntroComplete} ui={content.ui} />}
      <main>
        <HeroSection content={content} visible={heroVisible} variant={variant} />
        {isPrivate && (
          <>
            <AboutSection content={content} />
            <FilmSection content={content} />
            <MemoriesSection content={content} />
            <GallerySection content={content} />
            <FinalSection content={content} />
          </>
        )}
      </main>
      {!introVisible && isPrivate && <SignOutButton ui={content.ui} />}
      {!introVisible && <ThemeToggle />}
    </>
  )
}
