import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

export default function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/memory" replace /> : children
}
