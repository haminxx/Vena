'use client'

import { useRef, useCallback, useState } from 'react'

/**
 * Singleton audio preview hook - avoids React re-renders killing the Audio instance.
 * Play: same song = pause; different song = pause, set src, play.
 * Error handling for browser autoplay policies.
 */
export function useAudioPreview() {
  const audioRef = useRef(null)
  const [playingUrl, setPlayingUrl] = useState(null)

  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => setPlayingUrl(null))
    }
    return audioRef.current
  }, [])

  const playingRef = useRef(null)
  const play = useCallback((url) => {
    if (!url) return
    const audio = getOrCreateAudio()
    if (playingRef.current === url) {
      audio.pause()
      setPlayingUrl(null)
      playingRef.current = null
      return
    }
    audio.pause()
    audio.src = url
    playingRef.current = url
    setPlayingUrl(url)
    const p = audio.play()
    if (p && typeof p.catch === 'function') {
      p.catch((e) => console.error('Autoplay blocked:', e))
    }
  }, [getOrCreateAudio])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      playingRef.current = null
      setPlayingUrl(null)
    }
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
      playingRef.current = null
      setPlayingUrl(null)
    }
  }, [])

  return { play, pause, stop, playingUrl }
}
