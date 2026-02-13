import { useState, useEffect, useCallback } from 'react'
import { search, createPlaylist, getRelatedSongs, type SearchTrack } from './api'
import { RadialMusicMap } from './RadialMusicMap'
import './App.css'

type TabId = 'digging' | 'syncing'
type Theme = 'light' | 'dark'

const DARK_GRADIENT = { from: '#1a1a2e', to: '#16213e', mid: '#0f3460' }
const LIGHT_GRADIENT = { from: '#f8f9fa', to: '#e9ecef', mid: '#dee2e6' }

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const h = Math.max(0, Math.min(255, Math.round(x)))
    return h.toString(16).padStart(2, '0')
  }).join('')
}

function adjustBrightness(hex: string, factor: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor)
}

function setBackgroundFromColor(hex: string | null, theme: Theme) {
  const root = document.documentElement
  const g = theme === 'dark' ? DARK_GRADIENT : LIGHT_GRADIENT
  if (!hex) {
    root.style.setProperty('--bg-gradient-from', g.from)
    root.style.setProperty('--bg-gradient-mid', g.mid)
    root.style.setProperty('--bg-gradient-to', g.to)
    return
  }
  root.style.setProperty('--bg-gradient-from', hex)
  root.style.setProperty('--bg-gradient-mid', adjustBrightness(hex, 0.6))
  root.style.setProperty('--bg-gradient-to', adjustBrightness(hex, 0.35))
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('vena-theme') as Theme | null
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })
  const [landingVisible, setLandingVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [playlistQueue, setPlaylistQueue] = useState<SearchTrack[]>([])
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('digging')
  const [centerTrack, setCenterTrack] = useState<SearchTrack | null>(null)
  const [relatedTracks, setRelatedTracks] = useState<SearchTrack[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

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

  useEffect(() => {
    localStorage.setItem('vena-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    setBackgroundFromColor(null, theme)
  }, [theme])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
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
    setPlaylistQueue(prev => [...prev, track])
  }

  const selectAsCenter = async (track: SearchTrack) => {
    setCenterTrack(track)
    setLoadingRelated(true)
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
    setPlaylistQueue(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreatePlaylist = async () => {
    if (!playlistTitle.trim() || playlistQueue.length === 0) return
    setCreatingPlaylist(true)
    try {
      const videoIds = playlistQueue.map(t => t.yt_video_id)
      await createPlaylist(playlistTitle.trim(), '', videoIds)
      setPlaylistQueue([])
      setPlaylistTitle('')
    } catch {
      // TODO: show error
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const handleHoverColor = (hex: string | null) => () => setBackgroundFromColor(hex, theme)

  const tabs: { id: TabId; label: string; color: string }[] = [
    { id: 'digging', label: 'Music Digging', color: '#4a90d9' },
    { id: 'syncing', label: 'Music Syncing', color: '#2d6a4f' },
  ]

  return (
    <>
      {landingVisible && (
        <section id="landing" className="landing active">
          <div className="landing-chrome">
            <div className="window-controls">
              <span className="win-btn close" />
              <span className="win-btn min" />
              <span className="win-btn max" />
            </div>
            <div className="landing-tabs">
              <div className="landing-tab active">New Tab</div>
              <button type="button" className="tab-plus" aria-label="New tab">+</button>
            </div>
            <div className="landing-omnibox">
              <div className="nav-icons">
                <span className="nav-icon back" aria-hidden>‹</span>
                <span className="nav-icon fwd disabled" aria-hidden>›</span>
                <span className="nav-icon refresh" aria-hidden>↻</span>
              </div>
              <div className="omnibox-input">
                <span className="omnibox-icon">G</span>
                <span className="omnibox-placeholder">Search Google or type a URL</span>
              </div>
              <div className="omnibox-right">
                <span className="omnibox-star" aria-hidden>★</span>
                <span className="omnibox-menu" aria-hidden>⋮</span>
              </div>
            </div>
          </div>
          <div className="landing-content">
            <h1 className="landing-logo">Vena</h1>
            <div className="landing-search-wrap">
              <input
                type="text"
                className="landing-search"
                placeholder="Search Google or type a URL"
                readOnly
              />
              <span className="landing-mic" aria-hidden>🎤</span>
            </div>
            <p className="landing-hint">Press <kbd>F11</kbd> to start</p>
            <div className="landing-shortcuts">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? '☀ Light' : '☽ Dark'}
              </button>
            </div>
          </div>
        </section>
      )}

      <main id="browser-ui" className={`browser-ui ${!landingVisible ? 'active' : ''}`} data-theme={theme}>
        <div className="browser-chrome">
          <div className="chrome-theme-wrap">
            <button
              type="button"
              className="theme-toggle chrome"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
          </div>
          <div className="search-row">
            <div
              className="search-box"
              data-color="#4a90d9"
              onMouseEnter={handleHoverColor('#4a90d9')}
              onMouseLeave={handleHoverColor(null)}
            >
              <span className="search-icon" aria-hidden>⌕</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search or type a URL"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="search-btn" onClick={handleSearch} disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </div>
          </div>
          <div className="tab-bar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                data-color={tab.color}
                onMouseEnter={handleHoverColor(tab.color)}
                onMouseLeave={handleHoverColor(null)}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'digging' && (
            <div className="digging-panel">
              <div className="results-section">
                <h3>Search results</h3>
                <ul className="results-list">
                  {searchResults.map((track, i) => (
                    <li key={`${track.yt_video_id}-${i}`} className="result-item">
                      <span className="result-info">
                        <strong>{track.title}</strong> — {track.artist}
                        {track.duration && <span className="duration">{track.duration}</span>}
                      </span>
                      <div className="result-actions">
                        <button
                          type="button"
                          className="center-btn"
                          onClick={() => selectAsCenter(track)}
                          disabled={loadingRelated}
                          title="Show in radial map"
                          data-color="#4a90d9"
                          onMouseEnter={handleHoverColor('#4a90d9')}
                          onMouseLeave={handleHoverColor(null)}
                        >
                          {loadingRelated && centerTrack?.yt_video_id === track.yt_video_id ? '…' : '⊙'}
                        </button>
                        <button
                          type="button"
                          className="add-btn"
                          onClick={() => addToPlaylist(track)}
                          data-color="#2d6a4f"
                          onMouseEnter={handleHoverColor('#2d6a4f')}
                          onMouseLeave={handleHoverColor(null)}
                        >
                          + Add
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="radial-map-section">
                {centerTrack && relatedTracks.length > 0 ? (
                  <RadialMusicMap
                    centerTrack={centerTrack}
                    relatedTracks={relatedTracks}
                    onAddToPlaylist={addToPlaylist}
                  />
                ) : centerTrack && loadingRelated ? (
                  <div className="radial-map-loading">Loading similar songs…</div>
                ) : centerTrack && relatedTracks.length === 0 ? (
                  <div className="radial-map-empty">No similar songs found</div>
                ) : (
                  <div className="radial-map-placeholder">
                    Search for a song, then click ⊙ to view it in the radial map with similar tracks
                  </div>
                )}
              </div>
              <div className="playlist-section">
                <h3>Current playlist</h3>
                <input
                  type="text"
                  className="playlist-title-input"
                  placeholder="Playlist name"
                  value={playlistTitle}
                  onChange={e => setPlaylistTitle(e.target.value)}
                />
                <ul className="playlist-list">
                  {playlistQueue.map((track, i) => (
                    <li key={`${track.yt_video_id}-${i}`} className="playlist-item">
                      <span>{track.title} — {track.artist}</span>
                      <button type="button" className="remove-btn" onClick={() => removeFromPlaylist(i)}>×</button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="create-playlist-btn"
                  onClick={handleCreatePlaylist}
                  disabled={!playlistTitle.trim() || playlistQueue.length === 0 || creatingPlaylist}
                  data-color="#7b2cbf"
                  onMouseEnter={handleHoverColor('#7b2cbf')}
                  onMouseLeave={handleHoverColor(null)}
                >
                  {creatingPlaylist ? 'Creating…' : 'Create playlist'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'syncing' && (
            <div className="syncing-panel">
              <div className="strudel-controls">
                <p>Strudel live coding — pattern + play</p>
                <a
                  href="https://strudel.cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="strudel-link"
                >
                  Open Strudel in new tab
                </a>
              </div>
              <div className="strudel-embed">
                <iframe
                  src="https://strudel.cc"
                  title="Strudel REPL"
                  className="strudel-iframe"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default App
