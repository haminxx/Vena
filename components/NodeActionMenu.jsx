'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Bookmark, Network, Info } from 'lucide-react'

const SPOTIFY_EMBED_SCRIPT = 'https://open.spotify.com/embed/iframe-api/v1'

/**
 * Custom preview player: Play button, song/artist, interactive progress bar.
 * Uses previewUrl (HTML5 Audio) when available, else Spotify iframe API with spotifyId.
 */
export default function NodeActionMenu({
  onExpand,
  onAbout,
  onSave,
  onClose,
  spotifyId = null,
  previewUrl = null,
  title = '',
  artist = '',
  isFetchingSpotify = false,
  spotifyUnavailable = false,
  isSaved = false,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(30)
  const [useAudio, setUseAudio] = useState(false)
  const audioRef = useRef(null)
  const embedRef = useRef(null)
  const controllerRef = useRef(null)
  const hasPlayback = !!(previewUrl || spotifyId)

  // HTML5 Audio mode (previewUrl)
  useEffect(() => {
    if (!previewUrl) return
    setUseAudio(true)
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const onTimeUpdate = () => setPosition(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      setIsPlaying(false)
      setPosition(0)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [previewUrl])

  // Spotify iframe API mode (spotifyId only, when previewUrl unavailable)
  useEffect(() => {
    if (!spotifyId || previewUrl) return
    setUseAudio(false)
    setDuration(30)

    const initEmbed = (IFrameAPI) => {
      if (!IFrameAPI?.createController || !embedRef.current) return
      const options = {
        uri: `spotify:track:${spotifyId}`,
        width: 80,
        height: 80,
        theme: 'dark',
      }
      IFrameAPI.createController(embedRef.current, options, (EmbedController) => {
        controllerRef.current = EmbedController
        EmbedController.addListener('playback_update', (e) => {
          if (e?.data) {
            setIsPlaying(!e.data.isPaused)
            setPosition((e.data.position ?? 0) / 1000)
            const d = (e.data.duration ?? 30000) / 1000
            if (d > 0) setDuration(d)
          }
        })
      })
    }

    if (window.__spotifyIframeAPI) {
      initEmbed(window.__spotifyIframeAPI)
    } else {
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        window.__spotifyIframeAPI = IFrameAPI
        initEmbed(IFrameAPI)
      }
      if (!document.querySelector(`script[src="${SPOTIFY_EMBED_SCRIPT}"]`)) {
        const script = document.createElement('script')
        script.src = SPOTIFY_EMBED_SCRIPT
        script.async = true
        document.body.appendChild(script)
      }
    }

    return () => {
      if (controllerRef.current?.destroy) controllerRef.current.destroy()
      controllerRef.current = null
    }
  }, [spotifyId, previewUrl])

  const handlePlayPause = () => {
    if (useAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {})
      }
    } else if (controllerRef.current) {
      controllerRef.current.togglePlay()
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const sec = pct * duration

    if (useAudio && audioRef.current) {
      audioRef.current.currentTime = sec
      setPosition(sec)
    } else if (controllerRef.current) {
      controllerRef.current.seek(Math.floor(sec))
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="w-[300px] rounded-xl overflow-hidden bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top row: Custom player or placeholder | Save */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          {hasPlayback ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center text-white"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm font-medium truncate" title={title}>
                    {title || 'Unknown'}
                  </div>
                  <div className="text-gray-400 text-xs truncate" title={artist}>
                    {artist || 'Unknown artist'}
                  </div>
                </div>
              </div>
              <div
                className="h-1.5 bg-gray-600 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
                role="slider"
                aria-valuenow={position}
                aria-valuemin={0}
                aria-valuemax={duration}
              >
                <div
                  className="h-full bg-[#1DB954] rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(position)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          ) : isFetchingSpotify ? (
            <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-gray-600/50 text-gray-400 text-sm">
              <Play className="w-4 h-4 fill-current animate-pulse" />
              <span>Loading preview...</span>
            </div>
          ) : spotifyUnavailable ? (
            <div className="flex items-center justify-center h-10 rounded-lg bg-gray-600/50 text-gray-400 text-xs px-2">
              No preview on Spotify
            </div>
          ) : (
            <div className="flex items-center justify-center h-10 rounded-lg bg-gray-600/50 text-gray-400 text-xs px-2">
              No preview available
            </div>
          )}
        </div>
        {onSave && (
          <button
            onClick={() => onSave?.()}
            className={`flex-shrink-0 flex items-center justify-center p-2.5 rounded-lg transition-colors ${
              isSaved ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isSaved ? 'Unsave' : 'Save for Sync'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      {/* Hidden embed for Spotify iframe API (spotifyId only, no previewUrl) - off-screen for playback */}
      {spotifyId && !previewUrl && (
        <div className="relative overflow-hidden" style={{ width: 0, height: 0 }}>
          <div ref={embedRef} style={{ position: 'absolute', left: -9999, width: 80, height: 80 }} />
        </div>
      )}

      {/* Bottom: Expand, About */}
      <div className="bg-gray-900/90 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => onExpand?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium"
          title="Expand - spawn similar tracks"
        >
          <Network className="w-4 h-4" />
          <span>Expand</span>
        </button>
        <button
          onClick={() => onAbout?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium"
          title="About - view artist details"
        >
          <Info className="w-4 h-4" />
          <span>About</span>
        </button>
      </div>
    </div>
  )
}
