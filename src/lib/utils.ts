import type { CSSProperties } from 'react'

export const clamp = (v: number, mn: number, mx: number) =>
  Math.max(mn, Math.min(mx, v))

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export const INTRO_SEEN_KEY = 'memorial:introSeen'

export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

export const cssVars = (
  vars: Record<`--${string}`, string | number>,
): CSSProperties => vars as CSSProperties
