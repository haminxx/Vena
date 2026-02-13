'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Plus, Palette } from 'lucide-react'
import { useBrowserState } from '@/context/BrowserState'
import { useTabHistory } from '@/hooks/useTabHistory'
import { useDebounce } from '@/hooks/useDebounce'
import DiggingView from './DiggingView'
import NewTabPage from './NewTabPage'

const TAB_LABELS = {
  'new-tab': 'New Tab',
  digging: 'Digging',
  syncing: 'Syncing',
  future: 'Future',
}

export default function BrowserLayout() {
  const { tabs, activeTabId, setActiveTabId, addTab, setTabType, theme, setTheme } = useBrowserState()
  const {
    currentState,
    canGoBack,
    canGoForward,
    back,
    forward,
    push,
    replace,
    refresh,
  } = useTabHistory()

  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)

  const debouncedSearch = useDebounce(searchInput, 300)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const performSearch = useCallback(async (query, pushToHistory = false) => {
    const q = (typeof query === 'string' ? query : searchInput).trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resolve-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      const metadata = data.youtube_metadata
      const state = { query: [metadata.title, metadata.artist].filter(Boolean).join(' '), graphData: metadata }

      if (activeTab?.type === 'new-tab') {
        setTabType(activeTabId, 'digging', state)
      } else if (pushToHistory) {
        push(state)
      } else {
        replace(state)
      }
      setSearchInput(state.query)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchInput, push, replace, activeTab?.type, activeTabId, setTabType])

  const handleNodeClick = useCallback(
    (query) => {
      performSearch(query, true)
    },
    [performSearch]
  )

  const handleRefresh = useCallback(() => {
    const q = refresh()
    if (q) performSearch(q, false)
  }, [refresh, performSearch])

  const handleSelectSuggestion = useCallback(
    (item) => {
      setSearchInput(item.query)
      setShowSuggestions(false)
      setSuggestions([])
      performSearch(item.query, false)
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
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (currentState?.query) setSearchInput(currentState.query)
    else if (activeTab?.type === 'new-tab') setSearchInput('')
  }, [activeTabId, activeTab?.type])

  const isDark = theme === 'dark'
  const chromeBg = isDark ? 'bg-gray-800' : 'bg-chrome-gray'
  const chromeTabInactive = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-600'
  const chromeTabActive = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const toolbarBg = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const contentBg = isDark ? 'bg-gray-950' : 'bg-white'
  const inputBg = isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'

  return (
    <div className={`min-h-screen flex flex-col rounded-t-xl overflow-hidden shadow-lg ${chromeBg}`}>
      {/* Tab Bar */}
      <div className={`flex items-end px-2 pt-2 gap-0.5 ${chromeBg}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-5 py-2 rounded-t-lg -mb-px border border-b-0 transition-colors z-0 ${
              activeTabId === tab.id ? `${chromeTabActive} shadow-sm z-10` : `${chromeTabInactive} hover:opacity-90`
            }`}
            style={
              activeTabId === tab.id
                ? { clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }
                : undefined
            }
          >
            <span className="text-sm font-medium">{TAB_LABELS[tab.type] ?? tab.type}</span>
          </button>
        ))}
        <button
          onClick={addTab}
          className="p-2 rounded-lg -mb-px hover:bg-gray-600/30 transition-colors text-gray-500 hover:text-gray-700"
          aria-label="New tab"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar: Back / Forward / Refresh / Omnibox / Theme */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${toolbarBg}`}>
        <div className="flex items-center gap-0.5">
          <button
            onClick={back}
            disabled={!canGoBack}
            className={`p-2 rounded-full transition-colors ${canGoBack ? 'hover:bg-gray-200/50 text-gray-600' : 'text-gray-400 cursor-not-allowed'}`}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={forward}
            disabled={!canGoForward}
            className={`p-2 rounded-full transition-colors ${canGoForward ? 'hover:bg-gray-200/50 text-gray-600' : 'text-gray-400 cursor-not-allowed'}`}
            aria-label="Forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={!currentState?.query}
            className={`p-2 rounded-full transition-colors ${currentState?.query ? 'hover:bg-gray-200/50 text-gray-600' : 'text-gray-400 cursor-not-allowed'}`}
            aria-label="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox with autocomplete */}
        <div className="flex-1 relative">
          <form
            className={`flex items-center gap-2 rounded-full pl-4 pr-3 py-2 border transition-colors ${inputBg} focus-within:ring-2 focus-within:ring-blue-500`}
            onSubmit={(e) => {
              e.preventDefault()
              performSearch(searchInput, false)
              setShowSuggestions(false)
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search for a track..."
              className={`flex-1 bg-transparent border-none outline-none text-sm min-w-0 ${isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
              disabled={loading}
            />
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border overflow-hidden z-50 ${
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}
            >
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-500/20 transition-colors ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {item.title}
                  {item.artist ? <span className="text-gray-500"> — {item.artist}</span> : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-gray-200/50 transition-colors text-gray-600"
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Palette className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 min-h-[400px] flex flex-col overflow-hidden ${contentBg}`}>
        {activeTab?.type === 'new-tab' && (
          <NewTabPage
            onSelectCard={(type) => setTabType(activeTabId, type)}
            dark={isDark}
          />
        )}
        {activeTab?.type === 'digging' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <DiggingView
              dark={isDark}
              initialQuery={currentState?.query}
              initialGraphData={currentState?.graphData}
              onSelectTrack={(track) => {
                if (track) {
                  const state = {
                    query: [track.title, track.artist].filter(Boolean).join(' '),
                    graphData: track,
                  }
                  replace(state)
                }
              }}
            />
          </div>
        )}
        {activeTab?.type === 'syncing' && (
          <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Syncing</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Audio Visualizer view.</p>
          </div>
        )}
      </div>
    </div>
  )
}
