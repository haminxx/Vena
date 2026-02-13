import { useState, useEffect, useCallback } from 'react'
import './App.css'
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

interface BrowserTab {
  id: string
  label: string
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
  const [tabs, setTabs] = useState<BrowserTab[]>([{ id: '1', label: 'New Tab' }])
  const [activeTabId, setActiveTabId] = useState('1')
  const [urlInput, setUrlInput] = useState('')
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

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

  const addTab = () => {
    const id = String(Date.now())
    setTabs((prev) => [...prev, { id, label: 'New Tab' }])
    setActiveTabId(id)
    setCurrentUrl(null)
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx === -1) return
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[Math.max(0, idx - 1)].id)
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
      setCurrentUrl(url)
    } catch {
      setCurrentUrl('https://www.google.com/search?q=' + encodeURIComponent(val))
    }
  }

  const openBookmark = (url: string) => {
    setCurrentUrl(url)
    setUrlInput(url)
  }

  return (
    <>
      {/* F11 Landing */}
      {landingVisible && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
          <p className="text-xl text-gray-200">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">F11</kbd> to start
          </p>
        </section>
      )}

      <div className={`min-h-screen bg-white flex flex-col ${landingVisible ? 'invisible' : ''}`}>
        {/* Window controls */}
        <div className="flex items-center gap-2 pl-3 pt-2 pb-1 bg-gray-100">
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
                  ? 'chrome-tab-active bg-white rounded-t-lg shadow-sm -mb-px border border-b-0 border-gray-200 z-10'
                  : 'bg-gray-100/70 hover:bg-gray-200/70 rounded-t-md ml-1'
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
              className="flex flex-col items-center gap-1 group transition-colors hover:opacity-80"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                <b.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[60px]">{b.label.split(' ')[0]}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs">Add shortcut</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-white min-h-[400px]">
          {currentUrl ? (
            <iframe
              src={currentUrl}
              title="Browser content"
              className="w-full h-full min-h-[calc(100vh-220px)] border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)] bg-white">
              <h1 className="text-6xl font-normal text-gray-800 mb-6 tracking-tight">Vena</h1>
              <div className="w-full max-w-xl px-4">
                <form onSubmit={handleUrlSubmit} className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Search Google or type a URL"
                    className="w-full px-5 py-3 pr-12 rounded-full border border-gray-200 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label="Voice search"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
