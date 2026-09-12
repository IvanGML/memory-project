import { useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './authContext'
import { authService, type AuthUser, type RegisterInput } from './authService'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email: string, password: string) => {
        setUser(await authService.login(email, password))
      },
      register: (input: RegisterInput) => authService.register(input),
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
