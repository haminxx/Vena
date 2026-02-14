'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { getPaletteForTrack } from '@/utils/moodColors'

const MoodBackgroundContext = createContext(null)

export function MoodBackgroundProvider({ children }) {
  const [hoverPalette, setHoverPalette] = useState(null)
  const [playingPalette, setPlayingPalette] = useState(null)

  const setHoverTrack = useCallback((track) => {
    setHoverPalette(track ? getPaletteForTrack(track) : null)
  }, [])

  const setPlayingTrack = useCallback((track) => {
    setPlayingPalette(track ? getPaletteForTrack(track) : null)
  }, [])

  const value = {
    setHoverTrack,
    setPlayingTrack,
    hoverPalette,
    playingPalette,
  }

  return (
    <MoodBackgroundContext.Provider value={value}>
      {children}
    </MoodBackgroundContext.Provider>
  )
}

export function useMoodBackground() {
  const ctx = useContext(MoodBackgroundContext)
  return ctx ?? { setHoverTrack: () => {}, setPlayingTrack: () => {}, hoverPalette: null, playingPalette: null }
}
