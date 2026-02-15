'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import { parseSearchMetadata } from '@/utils/parseSearchMetadata'
import OmniSearch from './OmniSearch'

const DiggingCube = dynamic(() => import('./DiggingCube'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[300px]">
      Loading 3D...
    </div>
  ),
})

const RECENT_KEY = 'digbrowser-recent-searches'

function getRecentSearches() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addRecentSearch(item) {
  const recent = getRecentSearches()
  const filtered = recent.filter((r) => r.query !== item.query)
  const updated = [item, ...filtered].slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function toArtistString(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v?.name) return String(v.name)
  return ''
}
function metadataToTrack(meta) {
  if (!meta || typeof meta !== 'object') return null
  return {
    id: meta.spotifyId || meta.videoId || `track-${Date.now()}`,
    videoId: meta.videoId ?? null,
    title: meta.title ?? '',
    artist: toArtistString(meta.artist),
    artistId: meta.artistId ?? null,
    artistImage: meta.thumbnail ?? null,
    previewUrl: meta.previewUrl ?? null,
    spotifyId: meta.spotifyId ?? null,
    audioFeatures: meta.audioFeatures ?? null,
  }
}

export default function DiggingView({
  onSelectTrack,
  dark = false,
  initialQuery = '',
  initialGraphData = null,
}) {
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(() =>
    initialGraphData ? metadataToTrack(initialGraphData) : null
  )
  const [recentSearches, setRecentSearches] = useState([])

  const is3DActive = !!selectedTrack

  const performSearch = useCallback(async (query, selectedItem = null) => {
    const q = (typeof query === 'string' ? query : searchInput).trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      let body
      if (selectedItem?.spotifyId && selectedItem?.type === 'track') {
        body = { spotifyId: selectedItem.spotifyId }
      } else {
        const { cleanQuery, filters } = parseSearchMetadata(q)
        body = { search: cleanQuery || q, filters: Object.keys(filters || {}).length ? filters : undefined }
      }
      const res = await fetch('/api/resolve-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      const meta = data.youtube_metadata
      const track = metadataToTrack({
        ...meta,
        previewUrl: data.spotify_preview_url,
        audioFeatures: data.audio_features || meta.audioFeatures,
      })
      addRecentSearch({ query: [meta.title, meta.artist].filter(Boolean).join(' '), ...track })
      setRecentSearches(getRecentSearches())
      setSelectedTrack(track)
      setSearchInput([meta.title, meta.artist].filter(Boolean).join(' '))
      onSelectTrack?.(track)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchInput, onSelectTrack])

  const handleSelectSuggestion = useCallback(
    (item) => {
      const artistStr = typeof item.artist === 'string' ? item.artist : (item.artist?.name ?? '')
      const query = item.query ?? [item.title, artistStr].filter(Boolean).join(' ')
      setSearchInput(query)
      performSearch(query, item)
    },
    [performSearch]
  )

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    if (initialGraphData?.spotifyId || initialGraphData?.videoId) {
      setSelectedTrack(metadataToTrack(initialGraphData))
    }
  }, [initialGraphData?.spotifyId, initialGraphData?.videoId])

  const textClass = dark ? 'text-gray-200' : 'text-gray-800'
  const mutedClass = dark ? 'text-gray-400' : 'text-gray-500'
  const bgClass = dark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = dark ? 'border-gray-600' : 'border-gray-200'

  if (is3DActive) {
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col">
        <DiggingCube
          dark={dark}
          initialTrack={selectedTrack}
          onBack={() => setSelectedTrack(null)}
        />
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <h2 className={`text-2xl font-light mb-2 ${textClass}`}>Discover Music</h2>
      <p className={`text-sm mb-8 ${mutedClass}`}>Search by track, artist, or mood (e.g. &quot;Sad Piano&quot;)</p>

      <div className="w-full max-w-xl">
        <OmniSearch
          value={searchInput}
          onChange={setSearchInput}
          onSelectSuggestion={handleSelectSuggestion}
          onSubmit={performSearch}
          placeholder="Search for a track, artist, or mood..."
          dark={dark}
          disabled={loading}
        />
      </div>

      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      {loading && <p className={`mt-4 ${mutedClass}`}>Searching...</p>}

      <div className="mt-16 w-full max-w-xl">
        <h3 className={`flex items-center gap-2 text-sm font-medium ${mutedClass} mb-4`}>
          <TrendingUp className="w-4 h-4" />
          Recent
        </h3>
        {recentSearches.length === 0 ? (
          <p className={mutedClass}>Your recent searches will appear here</p>
        ) : (
          <div className="space-y-2">
            {recentSearches.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(item)}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-200/50 transition-colors ${textClass}`}
              >
                {item.query}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
