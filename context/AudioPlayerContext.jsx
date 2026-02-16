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
    if (!url || typeof url !== 'string' || url.trim() === '') {
      // #region agent log
      fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playNoUrl',message:'Play called with no URL',data:{},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.log('Fetching preview...')
      return
    }
    // #region agent log
    fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playStart',message:'Play with URL',data:{urlLen:url?.length},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const audio = getOrCreateAudio()
    if (playRef.current === url) {
      if (audio.paused) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => { fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playResumeSuccess',message:'Resume play resolved',data:{},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{}); })
            .catch((e) => { fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playResumeRejected',message:'Resume play rejected',data:{err:String(e?.message||e)},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{}); console.error('Autoplay prevented:', e); })
        }
      } else {
        audio.pause()
        setPlayingUrl(null)
        playRef.current = null
      }
      return
    }
    audio.pause()
    audio.src = url
    audio.volume = 0.5
    audio.preload = 'auto'
    playRef.current = url
    setPlayingUrl(url)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // #region agent log
          fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playSuccess',message:'audio.play() resolved',data:{},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        })
        .catch((e) => {
          // #region agent log
          fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioPlayerContext:playRejected',message:'audio.play() rejected',data:{err:String(e?.message||e?.name||e)},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          console.error('Autoplay prevented:', e)
        })
    }
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
