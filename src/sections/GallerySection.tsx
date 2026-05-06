import { useState } from 'react'
import GalleryImage from '../components/gallery/GalleryImage'
import Lightbox from '../components/gallery/Lightbox'
import Reveal from '../components/ui/Reveal'
import SectionLabel from '../components/ui/SectionLabel'
import type { Content } from '../types/content'
import styles from './GallerySection.module.scss'

export default function GallerySection({ content }: { content: Content }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  return (
    <section className={styles.section}>
      <Reveal>
        <SectionLabel>{content.ui.galleryLabel ?? 'галерея'}</SectionLabel>
      </Reveal>
      <div className={styles.grid}>
        {content.gallery.map((img, i) => (
          <Reveal key={i} delay={(i % 4) * 80}>
            <GalleryImage img={img} onClick={() => setLightboxIdx(i)} />
          </Reveal>
        ))}
      </div>
      {lightboxIdx != null && (
        <Lightbox
          gallery={content.gallery}
          idx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={setLightboxIdx}
          ui={content.ui}
        />
      )}
    </section>
  )
}
