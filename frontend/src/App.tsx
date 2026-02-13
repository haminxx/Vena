import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Star,
  Mic,
  MoreVertical,
  Plus,
  X,
  Github,
  Youtube,
  Mail,
  Chrome,
  Tv,
  ShoppingBag,
} from 'lucide-react'
import { search, createPlaylist, getRelatedSongs, type SearchTrack } from './api'
import { RadialMusicMap } from './RadialMusicMap'
import './App.css'

type TabId = 'digging' | 'syncing' | string

interface BrowserTab {
  id: string
  label: string
  contentId: TabId
}

const BOOKMARKS = [
  { id: 'chrome', label: 'Chrome Web Store', icon: Chrome, url: 'https://chrome.google.com/webstore' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, url: 'https://youtube.com' },
  { id: 'twitch', label: 'Twitch', icon: Tv, url: 'https://twitch.tv' },
  { id: 'aliexpress', label: 'AliExpress', icon: ShoppingBag, url: 'https://aliexpress.com' },
  { id: 'github', label: 'GitHub', icon: Github, url: 'https://github.com' },
  { id: 'gmail', label: 'Gmail', icon: Mail, url: 'https://gmail.com' },
]

function App() {
  const [landingVisible, setLandingVisible] = useState(true)

  const handleF11 = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F11') {
      e.preventDefault()
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
      setLandingVisible(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleF11)
    return () => window.removeEventListener('keydown', handleF11)
  }, [handleF11])

  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: '1', label: 'New Tab', contentId: 'digging' },
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [urlInput, setUrlInput] = useState('')
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [playlistQueue, setPlaylistQueue] = useState<SearchTrack[]>([])
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [contentMode, setContentMode] = useState<TabId>('digging')
  const [centerTrack, setCenterTrack] = useState<SearchTrack | null>(null)
  const [relatedTracks, setRelatedTracks] = useState<SearchTrack[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const addTab = () => {
    const id = String(Date.now())
    setTabs((prev) => [...prev, { id, label: 'New Tab', contentId: 'digging' }])
    setActiveTabId(id)
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx === -1) return
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[Math.max(0, idx - 1)].id)
    } else if (activeTabId === id) {
      setActiveTabId(newTabs[0]?.id ?? '')
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = urlInput.trim()
    if (!val) return
    let url = val
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try {
      new URL(url)
      setIframeUrl(url)
      setContentMode('iframe')
    } catch {
      setSearchQuery(val)
      setSearching(true)
      setContentMode('digging')
      setIframeUrl(null)
      search(val, 20)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setContentMode('digging')
    setIframeUrl(null)
    try {
      const results = await search(searchQuery.trim(), 20)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const addToPlaylist = (track: SearchTrack) => {
    setPlaylistQueue((prev) => [...prev, track])
  }

  const selectAsCenter = async (track: SearchTrack) => {
    setCenterTrack(track)
    setLoadingRelated(true)
    setContentMode('digging')
    setIframeUrl(null)
    try {
      const related = await getRelatedSongs(track.yt_video_id, 24)
      setRelatedTracks(related)
    } catch {
      setRelatedTracks([])
    } finally {
      setLoadingRelated(false)
    }
  }

  const removeFromPlaylist = (index: number) => {
    setPlaylistQueue((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreatePlaylist = async () => {
    if (!playlistTitle.trim() || playlistQueue.length === 0) return
    setCreatingPlaylist(true)
    try {
      const videoIds = playlistQueue.map((t) => t.yt_video_id)
      await createPlaylist(playlistTitle.trim(), '', videoIds)
      setPlaylistQueue([])
      setPlaylistTitle('')
    } catch {
      // no-op
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const openBookmark = (url: string) => {
    setIframeUrl(url)
    setContentMode('iframe')
  }

  return (
    <>
      {/* Landing: Press F11 to start */}
      {landingVisible && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <p className="text-xl text-gray-200 mb-4">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">F11</kbd> to start
            </p>
          </div>
        </section>
      )}

      <div className={`min-h-screen bg-white flex flex-col ${landingVisible ? 'opacity-0 pointer-events-none' : ''}`}>
      {/* Window frame - macOS style */}
      <div className="flex items-center gap-2 pl-3 pt-2 pb-1 bg-gray-100/80">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-end bg-gray-100 border-b border-gray-200 px-2 pt-1 gap-0.5">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              group flex items-center gap-2 pl-5 pr-2 py-1.5 min-w-[120px] max-w-[200px]
              cursor-pointer transition-all duration-200
              ${activeTabId === tab.id
                ? 'chrome-tab bg-white rounded-t-lg shadow-sm -mb-px border border-b-0 border-gray-200 z-10'
                : 'chrome-tab-inactive bg-gray-100/70 hover:bg-gray-200/70 rounded-t-md ml-1'
              }
            `}
          >
            <span className="truncate text-sm text-gray-700 flex-1">{tab.label}</span>
            <button
              onClick={(e) => closeTab(e, tab.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
              aria-label="Close tab"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="p-1.5 mb-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
          aria-label="New tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-0.5">
          <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-400" aria-label="Forward">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600" aria-label="Reload">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-3 py-2 hover:bg-white hover:border-gray-300 transition-colors focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <span className="text-gray-500 font-medium text-sm">G</span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search Google or type a URL"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 min-w-0"
            />
            <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-500" aria-label="Voice search">
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-500" aria-label="Bookmarks">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-500" aria-label="More">
            <MoreVertical className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-300 ml-1" />
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200">
        {BOOKMARKS.map((b) => (
          <button
            key={b.id}
            onClick={() => openBookmark(b.url)}
            className="flex flex-col items-center gap-1 group transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
              <b.icon className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[60px]">{b.label.split(' ')[0]}</span>
          </button>
        ))}
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-gray-400">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs">Add shortcut</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white">
        {contentMode === 'iframe' && iframeUrl ? (
          <iframe
            src={iframeUrl}
            title="Browser content"
            className="w-full h-full min-h-[calc(100vh-280px)] border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="p-6 max-w-7xl mx-auto">
            {/* Mode tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setContentMode('digging')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contentMode === 'digging' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Music Digging
              </button>
              <button
                onClick={() => setContentMode('syncing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contentMode === 'syncing' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Music Syncing
              </button>
            </div>

            {contentMode === 'digging' && (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Search</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search songs..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      {searching ? '…' : 'Search'}
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-80 overflow-auto">
                    {searchResults.map((track, i) => (
                      <li key={`${track.yt_video_id}-${i}`} className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700 truncate flex-1">
                          <strong>{track.title}</strong> — {track.artist}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => selectAsCenter(track)}
                            disabled={loadingRelated}
                            className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs"
                            title="Show in map"
                          >
                            ⊙
                          </button>
                          <button
                            onClick={() => addToPlaylist(track)}
                            className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 text-xs"
                          >
                            + Add
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center min-h-[400px]">
                  {centerTrack && relatedTracks.length > 0 ? (
                    <RadialMusicMap
                      centerTrack={centerTrack}
                      relatedTracks={relatedTracks}
                      onAddToPlaylist={addToPlaylist}
                    />
                  ) : centerTrack && loadingRelated ? (
                    <p className="text-gray-500">Loading similar songs…</p>
                  ) : centerTrack && relatedTracks.length === 0 ? (
                    <p className="text-gray-500">No similar songs found</p>
                  ) : (
                    <p className="text-gray-500 text-center">
                      Search for a song, then click ⊙ to view the radial map with similar tracks
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Playlist</h3>
                  <input
                    type="text"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    placeholder="Playlist name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                  />
                  <ul className="space-y-2 max-h-48 overflow-auto mb-4">
                    {playlistQueue.map((track, i) => (
                      <li key={`${track.yt_video_id}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-gray-700">{track.title} — {track.artist}</span>
                        <button onClick={() => removeFromPlaylist(i)} className="text-red-500 hover:text-red-600">
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!playlistTitle.trim() || playlistQueue.length === 0 || creatingPlaylist}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingPlaylist ? 'Creating…' : 'Create playlist'}
                  </button>
                </div>
              </div>
            )}

            {contentMode === 'syncing' && (
              <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: 500 }}>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <a href="https://strudel.cc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Open Strudel in new tab
                  </a>
                </div>
                <iframe
                  src="https://strudel.cc"
                  title="Strudel REPL"
                  className="w-full h-[500px] border-0"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default App
