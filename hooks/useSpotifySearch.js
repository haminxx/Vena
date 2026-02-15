'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Spotify search hook with AbortController for instant cancellation.
 * When user types (abortTrigger changes), aborts the previous request immediately
 * to prevent stale data and reduce lag.
 *
 * Light payload: search endpoint returns only id, name, artist_name, image.
 */
export function useSpotifySearch(debouncedQuery, abortTrigger) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)

  // Abort previous request immediately when user types (before debounce settles)
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
