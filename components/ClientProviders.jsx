'use client'

import { BrowserStateProvider } from '@/context/BrowserState'
import ThemeSync from './ThemeSync'

export default function ClientProviders({ children }) {
  return (
    <BrowserStateProvider>
      <ThemeSync />
      {children}
    </BrowserStateProvider>
  )
}
