import { useQuery } from '@tanstack/react-query'
import type { Content } from '../types/content'

export function useContent() {
  return useQuery({
    queryKey: ['content'],
    queryFn: async (): Promise<Content> => {
      const res = await fetch('/content.json', { cache: 'no-cache' })
      if (!res.ok) throw new Error(`content.json: ${res.status}`)
      return res.json()
    },
    staleTime: Infinity,
  })
}
