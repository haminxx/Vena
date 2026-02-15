'use client'

import { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react'

const AudioPlayerContext = createContext(null)

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [playingUrl, setPlayingUrl] = useState(null)
  const playRef = useRef(null)

  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => {
        setPlayingUrl(null)
        playRef.current = null
      })
    }
    return audioRef.current
  }, [])

  const play = useCallback((url) => {
    if (!url) return
    const audio = getOrCreateAudio()
    if (playRef.current === url) {
      if (audio.paused) {
        audio.play().catch((e) => console.error('Play failed:', e))
      } else {
        audio.pause()
        setPlayingUrl(null)
        playRef.current = null
      }
      return
    }
    audio.pause()
    audio.src = url
    playRef.current = url
    setPlayingUrl(url)
    audio.play().catch((e) => console.error('Autoplay blocked:', e))
  }, [getOrCreateAudio])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      playRef.current = null
      setPlayingUrl(null)
    }
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
      playRef.current = null
      setPlayingUrl(null)
    }
  }, [])

  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
        audioRef.current = null
      }
      playRef.current = null
    }
  }, [])

  const value = { play, pause, stop, playingUrl }

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  return ctx
}
