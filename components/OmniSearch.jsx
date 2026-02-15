'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSpotifySearch } from '@/hooks/useSpotifySearch'
import { Search } from 'lucide-react'

/**
 * Google-style autocomplete search bar with debounced suggestions.
 * Uses useSpotifySearch: 200ms debounce, AbortController cancels on every keystroke.
 */
export default function OmniSearch({
  value = '',
  onChange,
  onSelectSuggestion,
  onSubmit,
  placeholder = 'Search for a track, artist, or mood...',
  dark = false,
  disabled = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)

  const debouncedInput = useDebounce(inputValue, 200)
  const { results: suggestions } = useSpotifySearch(debouncedInput, inputValue)

  // Sync external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = useCallback(
    (e) => {
      const v = e.target.value
      setInputValue(v)
      setHighlightedIndex(-1)
      onChange?.(v)
    },
    [onChange]
  )

  const handleSelect = useCallback(
    (item) => {
      const artistStr = typeof item.artist === 'string' ? item.artist : (item.artist?.name ?? '')
      const displayText = item.query ?? [item.title, artistStr].filter(Boolean).join(' ')
      setInputValue(displayText)
      setSuggestions([])
      setHighlightedIndex(-1)
      onChange?.(displayText)
      onSelectSuggestion?.(item)
      onSubmit?.(displayText)
    },
    [onChange, onSelectSuggestion, onSubmit]
  )

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      setSuggestions([])
      onSubmit?.(inputValue)
    },
    [inputValue, onSubmit]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (suggestions.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault()
        handleSelect(suggestions[highlightedIndex])
      }
    },
    [suggestions, highlightedIndex, handleSelect]
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setSuggestions([])
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const textClass = dark ? 'text-gray-200' : 'text-gray-800'
  const mutedClass = dark ? 'text-gray-400' : 'text-gray-500'
  const bgClass = dark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = dark ? 'border-gray-600' : 'border-gray-200'

  const showDropdown = inputValue.length > 0 && suggestions.length > 0

  return (
    <div className={`w-full relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-3 rounded-2xl pl-6 pr-4 py-4 border-2 transition-colors ${bgClass} ${borderClass} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
      >
        <Search className={`w-6 h-6 shrink-0 ${mutedClass}`} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && suggestions.length > 0 && setHighlightedIndex(0)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent border-none outline-none text-lg min-w-0 ${textClass} placeholder-gray-400`}
          disabled={disabled}
          autoComplete="off"
        />
      </form>

      {showDropdown && (
        <div
          ref={suggestionsRef}
          className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border overflow-hidden z-50 ${
            dark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
        >
          {suggestions.map((item, i) => (
            <button
              key={`${item.spotifyId ?? item.title}-${i}`}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`w-full text-left px-5 py-3 text-base transition-colors flex items-center gap-3 ${
                i === highlightedIndex
                  ? dark
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-50 text-blue-700'
                  : dark
                    ? 'text-gray-200 hover:bg-gray-700'
                    : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="font-medium truncate block">{item.title}</span>
                {item.artist && (
                  <span className={`text-sm truncate block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.artist}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
