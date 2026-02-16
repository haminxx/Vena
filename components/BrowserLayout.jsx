'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Plus, Palette, Home, Play, Square, X } from 'lucide-react'
import { useBrowserState } from '@/context/BrowserState'
import { useTabHistory } from '@/hooks/useTabHistory'
import { useAppStore } from '@/store/useAppStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useSpotifySearch } from '@/hooks/useSpotifySearch'
import DiggingView from './DiggingView'
import SyncView from './SyncView'
import NewTabPage from './NewTabPage'

const TAB_LABELS = {
  'new-tab': 'New Tab',
  digging: 'Digging',
  syncing: 'Syncing',
  future: 'Future',
}

export default function BrowserLayout() {
  const { tabs, activeTabId, setActiveTabId, addTab, closeTab, setTabType, theme, setTheme } = useBrowserState()
  const clearDiggingState = useAppStore((s) => s.clearDiggingState)
  const setDiggingState = useAppStore((s) => s.setDiggingState)
  const {
    history,
    currentIndex,
    currentState,
    canGoBack,
    canGoForward,
    back,
    forward,
    push,
    replace,
    refresh,
    goHome,
    goToIndex,
  } = useTabHistory()

  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)

  const debouncedSearch = useDebounce(searchInput, 50)
  const { results: suggestions } = useSpotifySearch(debouncedSearch, searchInput)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const performSearch = useCallback(async (query, pushToHistory = false, selectedItem = null) => {
    const q = (typeof query === 'string' ? query : searchInput).trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const body = { search: (selectedItem?.query ?? q).trim() }
      const res = await fetch('/api/resolve-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleHome = useCallback(() => {
    clearDiggingState(activeTabId)
    goHome()
  }, [clearDiggingState, activeTabId, goHome])

  const toBreadcrumbLabel = (item) => {
    if (!item || (!item.query && !item.graphData)) return null
    const g = item.graphData
    if (g?.title) {
      const artist = typeof g.artist === 'string' ? g.artist : g.artist?.name ?? ''
      return artist ? `${artist} - ${g.title}` : g.title
    }
    return item.query || 'Search'
  }

  const historySlice = (history ?? []).slice(0, (currentIndex ?? 0) + 1)
  const pathItems = historySlice
    .map((item, i) => ({ index: i, label: toBreadcrumbLabel(item) }))
    .filter((x) => x.label)
  const breadcrumbItems = [
    { index: -1, label: 'Home', isHome: true },
    ...pathItems.map((x) => ({ ...x, isHome: false })),
  ]
  const showBreadcrumb = activeTab?.type === 'digging' && pathItems.length > 0

  const getTabGraphState = useCallback(() => {
    const t = useAppStore.getState().tabs.find((x) => x.id === activeTabId)
    const d = t?.data ?? {}
    return d?.graphNodes?.length ? { nodes: d.graphNodes, links: d.graphLinks, focusNodeId: d.focusNodeId } : null
  }, [activeTabId])

  const handleBack = useCallback(() => {
    if (!canGoBack) return
    const targetIndex = currentIndex - 1
    const histItem = history?.[targetIndex]
    const focusId = histItem?.graphData?.id ?? histItem?.graphData?.spotifyId
    if (focusId) {
      const current = getTabGraphState()
      if (current) setDiggingState(activeTabId, { ...current, focusNodeId: focusId })
    }
    back()
  }, [canGoBack, currentIndex, history, activeTabId, setDiggingState, back, getTabGraphState])

  const handleForward = useCallback(() => {
    if (!canGoForward) return
    const targetIndex = currentIndex + 1
    const histItem = history?.[targetIndex]
    const focusId = histItem?.graphData?.id ?? histItem?.graphData?.spotifyId
    if (focusId) {
      const current = getTabGraphState()
      if (current) setDiggingState(activeTabId, { ...current, focusNodeId: focusId })
    }
    forward()
  }, [canGoForward, currentIndex, history, activeTabId, setDiggingState, forward, getTabGraphState])

  const handleBreadcrumbClick = useCallback(
    (item) => {
      if (item.isHome) {
        handleHome()
      } else {
        goToIndex(item.index)
        const histItem = history?.[item.index]
        const focusId = histItem?.graphData?.id ?? histItem?.graphData?.spotifyId
        if (focusId) {
          const current = getTabGraphState()
          if (current) setDiggingState(activeTabId, { ...current, focusNodeId: focusId })
        }
      }
    },
    [handleHome, goToIndex, history, activeTabId, setDiggingState, getTabGraphState]
  )

  const handleSelectSuggestion = useCallback(
    (item) => {
      setSearchInput(item.query)
      setShowSuggestions(false)
      performSearch(item.query, false, item)
    },
    [performSearch]
  )


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
  const chromeTabInactive = isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-800' : 'bg-gray-300 text-gray-600 hover:bg-gray-400/50'
  const chromeTabActive = isDark ? 'bg-gray-700 text-white rounded-t-lg border-gray-700 border-b-gray-700' : 'bg-white text-black rounded-t-lg'
  const toolbarBg = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const contentBg = isDark ? 'bg-gray-950' : 'bg-white'
  const inputBg = isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'

  return (
    <div className={`w-full max-w-full h-dvh min-h-0 flex flex-col rounded-none sm:rounded-t-xl overflow-hidden shadow-lg ${chromeBg}`}>
      {/* Tab Bar */}
      <div className={`flex items-end flex-wrap px-1 sm:px-2 pt-2 gap-0.5 min-w-0 overflow-hidden ${chromeBg}`}>
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id
          const tabLabel = tab.title || (TAB_LABELS[tab.type] ?? tab.type)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-t-lg -mb-px border border-b-0 transition-none z-0 shrink-0 ${
                isActive ? `${chromeTabActive} shadow-sm z-10` : chromeTabInactive
              }`}
            >
              <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">{tabLabel}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className={`p-0.5 rounded hover:bg-black/10 -mr-1 ${isActive ? 'hover:bg-black/15' : ''}`}
                aria-label="Close tab"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            </button>
          )
        })}
        <button
          onClick={addTab}
          className="p-1.5 sm:p-2 rounded-lg -mb-px hover:bg-gray-600/30 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          aria-label="New tab"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar: Back / Forward / Refresh / Omnibox / Theme */}
      <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-b min-w-0 overflow-hidden ${toolbarBg}`}>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className={`p-2 rounded-full transition-colors ${canGoBack ? 'hover:bg-gray-200/50 text-gray-600' : 'text-gray-400 cursor-not-allowed'}`}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleForward}
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
            aria-label="Reload"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleHome}
            className="p-2 rounded-full transition-colors hover:bg-gray-200/50 text-gray-600"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          {activeTab?.type === 'syncing' && (
            <>
              <button
                onClick={() => useAppStore.getState().setSyncPlaying(true)}
                className="p-2 rounded-full transition-colors hover:bg-gray-200/50 text-gray-600"
                aria-label="Play Sync"
                title="Play Strudel + Spotify"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => useAppStore.getState().setSyncPlaying(false)}
                className="p-2 rounded-full transition-colors hover:bg-gray-200/50 text-gray-600"
                aria-label="Stop Sync"
                title="Stop Strudel + Spotify"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Domain Bar: Single long bar showing path of expanded songs (ellipsis when overflow), or search input */}
        <div className="flex-1 relative flex items-center min-w-0 overflow-hidden">
          {showBreadcrumb ? (
            <div
              className={`flex items-center py-2 px-3 sm:px-4 rounded-full border flex-1 min-w-0 overflow-hidden ${inputBg}`}
            >
              <div
                className={`text-sm truncate min-w-0 flex-1 cursor-default ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                title={breadcrumbItems.map((x) => x.label).join(' › ')}
              >
                {breadcrumbItems.map((x) => x.label).join(' › ')}
              </div>
            </div>
          ) : null}
          <form
            className={`flex items-center gap-2 rounded-full pl-3 sm:pl-4 pr-2 sm:pr-3 py-2 border transition-colors flex-1 min-w-0 overflow-hidden ${inputBg} focus-within:ring-2 focus-within:ring-blue-500 ${showBreadcrumb ? 'hidden' : ''}`}
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
                  key={`${item.spotifyId ?? item.title}-${i}`}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-500/20 transition-colors flex items-center gap-3 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{item.title}</span>
                    {item.artist && (
                      <span className={`text-xs truncate block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.artist}
                      </span>
                    )}
                  </span>
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
      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${contentBg}`}>
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
              onBackToHome={handleHome}
              onSelectTrack={(track) => {
                if (track) {
                  const state = {
                    query: [track.title, track.artist].filter(Boolean).join(' '),
                    graphData: track,
                  }
                  replace(state)
                }
              }}
              onExpandNode={(track) => {
                if (track) {
                  const state = {
                    query: [track.title, track.artist].filter(Boolean).join(' '),
                    graphData: track,
                  }
                  push(state)
                }
              }}
            />
          </div>
        )}
        {activeTab?.type === 'syncing' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <SyncView dark={isDark} />
          </div>
        )}
      </div>
    </div>
  )
}
