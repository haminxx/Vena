'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import TrackPreviewButton from './TrackPreviewButton'

/**
 * Artist About Card - Spotify-based, appears when About button is clicked.
 * Shows artist profile picture, name, genres, popular tracks with preview playback.
 * YouTube Music and Spotify icons link to artist profiles.
 */
export default function ArtistCard({ track, onClose }) {
  const [popularTracks, setPopularTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [artistImageLarge, setArtistImageLarge] = useState(null)
  const [artistNameFromApi, setArtistNameFromApi] = useState('')
  const [spotifyArtistId, setSpotifyArtistId] = useState(null)
  const [genres, setGenres] = useState([])
  const [playingTrackKey, setPlayingTrackKey] = useState(null)

  const artistName = artistNameFromApi || (typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? '')
  const avatarUrl = artistImageLarge ?? track?.artistImageLarge ?? track?.artistImage ?? track?.image ?? `https://i.pravatar.cc/80?u=${track?.id}`

  // Fetch artist data from Spotify (artist-details or artist-by-search)
  useEffect(() => {
    const artistId = track?.artistId
    const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
    const trackTitle = track?.title ?? ''

    if (!artistId && !artist && !trackTitle) {
      setPopularTracks([])
      setArtistImageLarge(null)
      setArtistNameFromApi('')
      setSpotifyArtistId(null)
      setGenres([])
      return
    }

    setLoading(true)
    setPlayingTrackKey(null)

    const url = artistId
      ? `/api/artist-details?artistId=${encodeURIComponent(artistId)}`
      : `/api/artist-by-search?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(trackTitle)}`

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        const tracks = d.topTracks ?? []
        if (tracks.length > 0 || d.imageLarge || d.artistId) {
          setPopularTracks(tracks)
          setArtistImageLarge(d.imageLarge ?? d.image ?? null)
          setArtistNameFromApi(d.artistName ?? artist ?? '')
          setSpotifyArtistId(d.artistId ?? null)
          setGenres(Array.isArray(d.genres) ? d.genres : [])
          return
        }
        throw new Error('No Spotify data')
      })
      .catch(() => {
        setPopularTracks([])
        setArtistImageLarge(track?.artistImage ?? track?.artistImageLarge ?? null)
        setArtistNameFromApi(artist || (typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''))
        setSpotifyArtistId(null)
        setGenres([])
      })
      .finally(() => setLoading(false))
  }, [track?.id, track?.artistId, track?.artist, track?.title])

  const getItemKey = (item, i) => item?.id ?? item?.videoId ?? `${item?.name ?? item?.title ?? ''}-${i}`

  const displayTracks = popularTracks

  const spotifyUrl = spotifyArtistId ? `https://open.spotify.com/artist/${spotifyArtistId}` : null
  const youtubeMusicUrl = artistName
    ? `https://music.youtube.com/search?q=${encodeURIComponent(artistName)}`
    : null

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="relative w-[320px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
    >
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white/95"
      />
      <div className="p-4 pt-5">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/50 text-gray-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Avatar + Artist Name + Platform Icons */}
        <div className="flex items-start gap-3 mb-4">
          <img
            src={avatarUrl}
            alt={artistName}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 truncate text-base">{artistName}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {youtubeMusicUrl && (
                  <a
                    href={youtubeMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                    title="Open artist on YouTube Music"
                    aria-label="YouTube Music"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm-1.2 17.28V6.72l6 5.28-6 5.28z" />
                    </svg>
                  </a>
                )}
                {spotifyUrl && (
                  <a
                    href={spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-green-50 text-gray-600 hover:text-[#1DB954] transition-colors"
                    title="Open artist on Spotify"
                    aria-label="Spotify"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.28c-.24.36-.72.48-1.08.24-2.88-1.8-6.48-2.16-10.68-1.2-.42.12-.84-.18-.96-.6-.12-.42.18-.84.6-.96 4.56-1.08 8.64-.72 11.88 1.44.36.24.48.72.24 1.08zm1.44-3.36c-.3.42-.9.54-1.32.24-3.3-2.04-8.34-2.64-12.24-1.44-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.44-1.32 10.02-.66 13.8 1.68.42.3.54.9.24 1.32zm.12-3.48C15.24 8.4 8.82 8.16 5.16 9.42c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.44 11.22-1.2 15.48 1.44.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            {loading ? (
              <p className="text-xs text-gray-400 mt-1">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {genres.length > 0 ? (
                  genres.slice(0, 5).map((g, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200/60 text-gray-600"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200/60 text-gray-500">
                    —
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Popular Tracks */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Popular Tracks
          </p>
          <ul
            className="space-y-1 max-h-[180px] overflow-y-auto overscroll-contain pr-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {displayTracks.length > 0 ? (
              displayTracks.map((t, i) => {
                const itemKey = getItemKey(t, i)
                const hasPlayback = !!(
                  t.previewUrl ||
                  t.preview ||
                  t.spotifyId ||
                  t.id ||
                  t.videoId
                )
                return (
                  <li
                    key={t.id ?? t.videoId ?? i}
                    className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-white/50 transition-colors group"
                  >
                    <span className="text-sm text-gray-800 truncate flex-1">
                      {t.name ?? t.title}
                    </span>
                    <div className="relative flex items-center">
                      <TrackPreviewButton
                        track={t}
                        trackKey={itemKey}
                        playingTrackKey={playingTrackKey}
                        onPlayClick={setPlayingTrackKey}
                        title={t.name ?? t.title}
                        artist={typeof t.artist === 'string' ? t.artist : t?.artist?.name ?? ''}
                      />
                    </div>
                  </li>
                )
              })
            ) : (
              <li className="text-sm text-gray-400 py-4 text-center">No tracks available</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
