import { useCallback, useState } from 'react'

export function useLocalStorageFlag(key: string) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      return localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  })

  const set = useCallback(() => {
    try {
      localStorage.setItem(key, '1')
    } catch {
      /* privacy mode — ignore */
    }
    setValue(true)
  }, [key])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* privacy mode — ignore */
    }
    setValue(false)
  }, [key])

  return { value, set, clear }
}
