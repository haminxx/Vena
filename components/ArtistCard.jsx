'use client'

import { useState, useEffect } from 'react'
import { Play, X } from 'lucide-react'

const PREVIEW_AUDIO_ID = 'preview-audio'

/**
 * Artist Post Card - glassmorphism style, appears when a node is clicked.
 * Uses HTML5 <audio> element to bypass WebGL event capturing (autoplay trap).
 */
export default function ArtistCard({ track, onClose }) {
  const [playingTrackUrl, setPlayingTrackUrl] = useState(null)
  const [genres, setGenres] = useState([])
  const [topTracks, setTopTracks] = useState([])
  const [loading, setLoading] = useState(false)

  const artistName = typeof track?.artist === 'string' ? track.artist : (track?.artist?.name ?? '')
  const avatarUrl = track?.artistImage ?? track?.image ?? `https://i.pravatar.cc/80?u=${track?.id}`

  // Reset: stop any playing audio when opening a new card
  useEffect(() => {
    const el = document.getElementById(PREVIEW_AUDIO_ID)
    if (el) {
      el.pause()
      el.src = ''
    }
    setPlayingTrackUrl(null)
    return () => {
      const el = document.getElementById(PREVIEW_AUDIO_ID)
      if (el) {
        el.pause()
        el.src = ''
      }
    }
  }, [track?.id])

  useEffect(() => {
    const artistId = track?.artistId
    if (!artistId || typeof artistId !== 'string') {
      setGenres([])
      setTopTracks([])
      return
    }
    setLoading(true)
    fetch(`/api/artist-details?artistId=${encodeURIComponent(artistId)}`)
      .then((r) => r.json())
      .then((d) => {
        setGenres(d.genres ?? [])
        setTopTracks(d.topTracks ?? [])
      })
      .catch(() => {
        setGenres([])
        setTopTracks([])
      })
      .finally(() => setLoading(false))
  }, [track?.artistId])

  const handlePlayTrack = (url) => {
    if (!url) return
    const el = document.getElementById(PREVIEW_AUDIO_ID)
    if (!el) return
    if (playingTrackUrl === url) {
      el.pause()
      setPlayingTrackUrl(null)
      return
    }
    el.src = url
    el.play()
    setPlayingTrackUrl(url)
  }

  useEffect(() => {
    const el = document.getElementById(PREVIEW_AUDIO_ID)
    if (!el) return
    const onEnded = () => setPlayingTrackUrl(null)
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [])

  const displayTracks = topTracks.length > 0 ? topTracks : (track?.topTracks ?? []).slice(0, 5).map((t) => ({
    id: t.id ?? t.name,
    name: t.name ?? t.title,
    preview: t.preview ?? t.previewUrl,
  }))

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-[300px] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
    >
      <audio id={PREVIEW_AUDIO_ID} src={playingTrackUrl ?? ''} />
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

        {/* Header: Avatar + Artist Name + Genre Chips */}
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
            ) : genres.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {genres.slice(0, 4).map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200/80 text-gray-700"
                  >
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Popular Tracks Section */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Popular Tracks
          </p>
          <ul
            className="space-y-1 max-h-[150px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {displayTracks.length > 0 ? (
              displayTracks.map((t, i) => (
                <li
                  key={t.id ?? i}
                  className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-white/50 transition-colors group"
                >
                  <span className="text-sm text-gray-800 truncate flex-1">{t.name}</span>
                  <button
                    onClick={() => handlePlayTrack(t.preview)}
                    disabled={!t.preview}
                    className={`p-2 rounded-full shrink-0 transition-colors ${
                      t.preview
                        ? playingTrackUrl === t.preview
                          ? 'text-blue-600 bg-blue-100'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    aria-label={t.preview ? 'Play' : 'No preview'}
                  >
                    <Play className={`w-4 h-4 ${playingTrackUrl === t.preview ? 'fill-current' : ''}`} />
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
