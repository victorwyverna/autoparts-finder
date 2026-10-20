import { HomePage } from '@/pages/home'

import { StoreProvider } from './providers/store'

export function App() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  )
}
