import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AuthProvider from './auth/AuthProvider'
import PublicOnly from './auth/PublicOnly'
import RequireAuth from './auth/RequireAuth'
import { queryClient } from './content/queryClient'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <PublicOnly>
                  <HomePage variant="public" />
                </PublicOnly>
              }
            />
            <Route
              path="/memory"
              element={
                <RequireAuth>
                  <HomePage variant="private" />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
