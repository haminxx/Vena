'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Spotify search hook with AbortController for instant cancellation.
 * - New AbortController before EVERY fetch.
 * - On each keystroke (abortTrigger change), abort previous request immediately.
 * - Light payload: search returns only id, name, artist_name, image (no audio features).
 */
export function useSpotifySearch(debouncedQuery, abortTrigger) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)

  // Critical: abort previous request on every keystroke (before debounce settles)
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [abortTrigger])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    const ctrl = new AbortController()
    abortControllerRef.current = ctrl
    setIsLoading(true)

    fetch(`/api/search-suggestions?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? [])
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResults([])
      })
      .finally(() => {
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
        }
        setIsLoading(false)
      })

    return () => {
      ctrl.abort()
      if (abortControllerRef.current === ctrl) {
        abortControllerRef.current = null
      }
    }
  }, [debouncedQuery])

  return { results, isLoading }
}
