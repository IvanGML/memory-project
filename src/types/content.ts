export type Memory = {
  id: string
  from?: string
  title?: string
  content: string
}

export type GalleryItem = {
  src: string
  label?: string
  tall?: boolean
}

export type Content = {
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

export const FALLBACK: Content = {
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
