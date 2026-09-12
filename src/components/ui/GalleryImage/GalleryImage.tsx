import type { GalleryItem } from '../../../types/content'
import { cn, cssVars } from '../../../lib/utils'
import styles from './GalleryImage.module.scss'

export default function GalleryImage({
  img,
  onClick,
}: {
  img: GalleryItem
  onClick?: () => void
}) {
  const aspect = img.tall ? '3/4' : '4/3'
  return (
    <button
      onClick={onClick}
      className={cn(styles.tile, img.tall && styles.tall)}
      style={cssVars({
        '--aspect': aspect,
        '--bg-image': `url(${img.src})`,
      })}
    >
      <div className={styles.overlay} />
      {img.label && <div className={styles.caption}>{img.label}</div>}
    </button>
  )
}
