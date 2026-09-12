import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" replace />
}
