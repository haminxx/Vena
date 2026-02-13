'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Search, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import { parseSearchMetadata } from '@/utils/parseSearchMetadata'

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

function metadataToTrack(meta) {
  if (!meta) return null
  return {
    id: meta.spotifyId || meta.videoId || `track-${Date.now()}`,
    title: meta.title,
    artist: meta.artist,
    artistImage: meta.thumbnail,
    previewUrl: meta.previewUrl,
    spotifyId: meta.spotifyId,
    audioFeatures: meta.audioFeatures,
  }
}

export default function DiggingView({
  onSelectTrack,
  dark = false,
  initialQuery = '',
  initialGraphData = null,
}) {
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(() =>
    initialGraphData ? metadataToTrack(initialGraphData) : null
  )
  const [recentSearches, setRecentSearches] = useState([])
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)

  const debouncedSearch = useDebounce(searchInput, 300)

  const is3DActive = !!selectedTrack

  const performSearch = useCallback(async (query) => {
    const q = (typeof query === 'string' ? query : searchInput).trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const { cleanQuery, filters } = parseSearchMetadata(q)
      const searchPayload = cleanQuery || q
      const res = await fetch('/api/resolve-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: searchPayload, filters: Object.keys(filters).length ? filters : undefined }),
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
      setSearchInput(item.query)
      setShowSuggestions(false)
      setSuggestions([])
      performSearch(item.query)
    },
    [performSearch]
  )

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSuggestions([])
      return
    }
    const ctrl = new AbortController()
    fetch(`/api/search-suggestions?q=${encodeURIComponent(debouncedSearch)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setSuggestions(d.results ?? []))
      .catch(() => setSuggestions([]))
    return () => ctrl.abort()
  }, [debouncedSearch])

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    if (initialGraphData?.spotifyId || initialGraphData?.videoId) {
      setSelectedTrack(metadataToTrack(initialGraphData))
    }
  }, [initialGraphData?.spotifyId, initialGraphData?.videoId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      <div className="w-full max-w-xl relative">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            performSearch(searchInput)
            setShowSuggestions(false)
          }}
          className={`flex items-center gap-3 rounded-2xl pl-6 pr-4 py-4 border-2 transition-colors ${bgClass} ${borderClass} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
        >
          <Search className={`w-6 h-6 ${mutedClass}`} />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a track, artist, or mood..."
            className={`flex-1 bg-transparent border-none outline-none text-lg min-w-0 ${textClass} placeholder-gray-400`}
            disabled={loading}
          />
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border overflow-hidden z-50 ${dark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
          >
            {suggestions.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(item)}
                className={`w-full text-left px-5 py-3 text-base hover:bg-blue-500/20 transition-colors ${textClass}`}
              >
                {item.title}
                {item.artist ? <span className={mutedClass}> — {item.artist}</span> : ''}
              </button>
            ))}
          </div>
        )}
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
