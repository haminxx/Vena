'use client'

import { BrowserStateProvider } from '@/context/BrowserState'
import { MoodBackgroundProvider } from '@/context/MoodBackgroundContext'
import ThemeSync from './ThemeSync'
import AmbientBackground from './AmbientBackground'

export default function ClientProviders({ children }) {
  return (
    <BrowserStateProvider>
      <MoodBackgroundProvider>
        <AmbientBackground />
        <ThemeSync />
        {children}
      </MoodBackgroundProvider>
    </BrowserStateProvider>
  )
}
