import { createContext } from 'react'
import type { AuthUser, RegisterInput } from './authService'

export type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
