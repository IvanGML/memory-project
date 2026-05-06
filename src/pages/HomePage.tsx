import { useEffect, useState } from 'react'
import { useContent } from '../content/useContent'
import { useLocalStorageFlag } from '../hooks/useLocalStorageFlag'
import { INTRO_SEEN_KEY } from '../lib/utils'
import AboutSection from '../sections/AboutSection'
import FilmSection from '../sections/FilmSection'
import FinalSection from '../sections/FinalSection'
import GallerySection from '../sections/GallerySection'
import HeroSection from '../sections/HeroSection'
import IntroOverlay from '../sections/IntroOverlay'
import MemoriesSection from '../sections/MemoriesSection'

const HERO_REVEAL_DELAY_MS = 100

export default function HomePage() {
  const { data: content } = useContent()
  const introSeen = useLocalStorageFlag(INTRO_SEEN_KEY)
  const [introVisible, setIntroVisible] = useState(!introSeen.value)
  const [heroVisible, setHeroVisible] = useState(introSeen.value)

  useEffect(() => {
    if (content) document.title = `${content.name} — в память`
  }, [content])

  if (!content) return null

  const onIntroComplete = () => {
    introSeen.set()
    setIntroVisible(false)
    setTimeout(() => setHeroVisible(true), HERO_REVEAL_DELAY_MS)
  }

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
