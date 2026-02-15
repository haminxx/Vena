'use client'

import { BrowserStateProvider } from '@/context/BrowserState'
import { MoodBackgroundProvider } from '@/context/MoodBackgroundContext'
import { AudioPlayerProvider } from '@/context/AudioPlayerContext'
import ThemeSync from './ThemeSync'
import AmbientBackground from './AmbientBackground'

export default function ClientProviders({ children }) {
  return (
    <BrowserStateProvider>
      <AudioPlayerProvider>
      <MoodBackgroundProvider>
        <AmbientBackground />
        <ThemeSync />
        {children}
      </MoodBackgroundProvider>
      </AudioPlayerProvider>
    </BrowserStateProvider>
  )
}
