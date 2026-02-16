'use client'

import { useState, useEffect } from 'react'
import { Play, X, ExternalLink } from 'lucide-react'
import { useAudioPlayer } from '@/context/AudioPlayerContext'
import { useMoodBackground } from '@/context/MoodBackgroundContext'

/**
 * Artist Post Card - YouTube-based, appears when a node is clicked.
 * Uses artist-youtube API for artist info and popular/related tracks.
 */
export default function ArtistCard({ track, onClose }) {
  const { play, stop, playingUrl } = useAudioPlayer()
  const { setPlayingTrack } = useMoodBackground()
  const [popularTracks, setPopularTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [artistImageLarge, setArtistImageLarge] = useState(null)
  const [artistNameFromApi, setArtistNameFromApi] = useState('')

  const artistName = artistNameFromApi || (typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? '')
  const avatarUrl = artistImageLarge ?? track?.artistImageLarge ?? track?.artistImage ?? track?.image ?? `https://i.pravatar.cc/80?u=${track?.id}`

  useEffect(() => {
    stop()
    setPlayingTrack(null)
    return () => {
      stop()
      setPlayingTrack(null)
    }
  }, [track?.id, stop, setPlayingTrack])

  useEffect(() => {
    if (!playingUrl) setPlayingTrack(null)
  }, [playingUrl, setPlayingTrack])

  useEffect(() => {
    const videoId = track?.videoId
    const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
    const trackTitle = track?.title ?? ''

    if (!videoId && !artist && !trackTitle) {
      setPopularTracks([])
      setArtistImageLarge(null)
      setArtistNameFromApi('')
      return
    }

    setLoading(true)
    const params = new URLSearchParams()
    if (videoId) params.set('videoId', videoId)
    if (artist) params.set('artist', artist)
    if (trackTitle) params.set('track', trackTitle)

    fetch(`/api/artist-youtube?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setPopularTracks(d.popularTracks ?? [])
        setArtistImageLarge(d.imageLarge ?? d.image ?? null)
        setArtistNameFromApi(d.artistName ?? '')
      })
      .catch(() => {
        setPopularTracks([])
        setArtistImageLarge(null)
        setArtistNameFromApi('')
      })
      .finally(() => setLoading(false))
  }, [track?.id, track?.videoId, track?.artist, track?.title])

  const handlePlay = (item) => {
    if (item?.preview) {
      play(item.preview)
      setPlayingTrack({ ...track })
    } else if (item?.videoId) {
      window.open(`https://music.youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener,noreferrer')
    }
  }

  const displayTracks = popularTracks.length > 0 ? popularTracks : (track?.topTracks ?? []).slice(0, 5)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="relative w-[300px] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
    >
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white/90"
      />
      <div className="p-4 pt-5">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/50 text-gray-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Avatar + Artist Name */}
        <div className="flex items-start gap-3 mb-4">
          <img
            src={avatarUrl}
            alt={artistName}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate text-base">{artistName}</p>
            {loading ? (
              <p className="text-xs text-gray-400 mt-1">Loading...</p>
            ) : (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200/60 text-gray-500">
                YouTube Music
              </span>
            )}
          </div>
        </div>

        {/* Popular / Related Tracks */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Popular & Related Tracks
          </p>
          <ul
            className="space-y-1 max-h-[150px] overflow-y-auto overscroll-contain pr-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {displayTracks.length > 0 ? (
              displayTracks.map((t, i) => (
                <li
                  key={t.id ?? t.videoId ?? i}
                  className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-white/50 transition-colors group"
                >
                  <span className="text-sm text-gray-800 truncate flex-1">{t.name ?? t.title}</span>
                  <button
                    onClick={() => handlePlay(t)}
                    className="p-2 rounded-full shrink-0 transition-colors text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                    aria-label={t.videoId ? 'Open in YouTube Music' : 'No link'}
                    title={t.videoId ? 'Open in YouTube Music' : ''}
                  >
                    {t.videoId ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <Play className={`w-4 h-4 ${playingUrl === t.preview ? 'fill-current text-blue-600' : 'text-gray-300'}`} />
                    )}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-400 py-4 text-center">No tracks available</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
