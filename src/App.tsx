import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './content/queryClient'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  )
}
