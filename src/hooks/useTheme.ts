import { useCallback, useState } from 'react'
import { THEME_KEY } from '../lib/utils'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* privacy mode — ignore */
      }
      document.documentElement.dataset.theme = next
      return next
    })
  }, [])

  return { theme, toggle }
}
