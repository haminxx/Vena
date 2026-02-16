'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

const SPOTIFY_EMBED_SCRIPT = 'https://open.spotify.com/embed/iframe-api/v1'
const YOUTUBE_IFRAME_API = 'https://www.youtube.com/iframe_api'

/**
 * Compact play/pause button for a track. Uses same playback logic as NodeActionMenu:
 * previewUrl (HTML5) > spotifyId (Spotify embed) > videoId (YouTube).
 * Only the active track (playingTrackKey === trackKey) creates the actual player.
 */
export default function TrackPreviewButton({
  track,
  trackKey,
  playingTrackKey,
  onPlayClick,
  title = '',
  artist = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const isActive = playingTrackKey === trackKey
  useEffect(() => {
    if (!isActive) setIsPlaying(false)
  }, [isActive])
  const hasPlayback = !!(
    track?.previewUrl ||
    track?.preview ||
    track?.spotifyId ||
    track?.id ||
    track?.videoId
  )

  const audioRef = useRef(null)
  const embedRef = useRef(null)
  const controllerRef = useRef(null)
  const youtubeRef = useRef(null)
  const youtubePlayerRef = useRef(null)

  const previewUrl = track?.previewUrl ?? track?.preview ?? null
  const spotifyId = track?.spotifyId ?? track?.id ?? null
  const videoId = track?.videoId ?? null

  // When we become active, create player and play
  useEffect(() => {
    if (!isActive || !hasPlayback) return

    if (previewUrl) {
      const audio = new Audio(previewUrl)
      audioRef.current = audio
      audio.play().catch(() => {})
      const onEnded = () => setIsPlaying(false)
      const onPlay = () => setIsPlaying(true)
      const onPause = () => setIsPlaying(false)
      audio.addEventListener('ended', onEnded)
      audio.addEventListener('play', onPlay)
      audio.addEventListener('pause', onPause)
      return () => {
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('play', onPlay)
        audio.removeEventListener('pause', onPause)
        audio.pause()
        audio.src = ''
        audioRef.current = null
      }
    }

    if (spotifyId && !previewUrl) {
      const initEmbed = (IFrameAPI) => {
        if (!IFrameAPI?.createController || !embedRef.current) return
        IFrameAPI.createController(
          embedRef.current,
          { uri: `spotify:track:${spotifyId}`, width: 80, height: 80, theme: 'dark' },
          (EmbedController) => {
            controllerRef.current = EmbedController
            EmbedController.addListener('playback_update', (e) => {
              if (e?.data) setIsPlaying(!e.data.isPaused)
            })
            EmbedController.play()
          }
        )
      }
      if (window.__spotifyIframeAPI) {
        initEmbed(window.__spotifyIframeAPI)
      } else {
        window.onSpotifyIframeApiReady = (api) => {
          window.__spotifyIframeAPI = api
          initEmbed(api)
        }
        if (!document.querySelector(`script[src="${SPOTIFY_EMBED_SCRIPT}"]`)) {
          const s = document.createElement('script')
          s.src = SPOTIFY_EMBED_SCRIPT
          s.async = true
          document.body.appendChild(s)
        }
      }
      return () => {
        if (controllerRef.current?.destroy) controllerRef.current.destroy()
        controllerRef.current = null
      }
    }

    if (videoId && !previewUrl && !spotifyId) {
      const initYt = () => {
        if (!window.YT?.Player || !youtubeRef.current) return
        const player = new window.YT.Player(youtubeRef.current, {
          videoId,
          width: 80,
          height: 80,
          playerVars: { autoplay: 1, controls: 0 },
          events: {
            onReady: (e) => e.target.playVideo(),
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true)
              else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED)
                setIsPlaying(false)
            },
          },
        })
      }
      if (window.YT?.Player) initYt()
      else {
        window.onYouTubeIframeAPIReady = initYt
        if (!document.querySelector(`script[src="${YOUTUBE_IFRAME_API}"]`)) {
          const s = document.createElement('script')
          s.src = YOUTUBE_IFRAME_API
          s.async = true
          document.body.appendChild(s)
        }
      }
      return () => {
        if (youtubePlayerRef.current?.destroy) youtubePlayerRef.current.destroy()
        youtubePlayerRef.current = null
      }
    }
  }, [isActive, hasPlayback, previewUrl, spotifyId, videoId])

  const handleClick = () => {
    if (!hasPlayback) return
    if (isActive && isPlaying) {
      if (audioRef.current) audioRef.current.pause()
      else if (controllerRef.current) controllerRef.current.pause()
      else if (youtubePlayerRef.current?.pauseVideo) youtubePlayerRef.current.pauseVideo()
      setIsPlaying(false)
      onPlayClick?.(null)
    } else {
      onPlayClick?.(trackKey)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!hasPlayback}
        className={`p-2 rounded-full shrink-0 transition-colors ${
          hasPlayback
            ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play preview'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current text-blue-600" />
        ) : (
          <Play className={`w-4 h-4 ${isActive && isPlaying ? 'fill-current text-blue-600' : ''}`} />
        )}
      </button>
      {isActive && spotifyId && !previewUrl && (
        <div className="absolute -left-[9999px] w-0 h-0 overflow-hidden">
          <div ref={embedRef} style={{ width: 80, height: 80 }} />
        </div>
      )}
      {isActive && videoId && !previewUrl && !spotifyId && (
        <div className="absolute -left-[9999px] w-0 h-0 overflow-hidden">
          <div ref={youtubeRef} style={{ width: 80, height: 80 }} />
        </div>
      )}
    </>
  )
}
