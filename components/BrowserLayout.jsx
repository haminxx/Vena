'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import DiggingView from './DiggingView'

const TABS = [
  { id: 'digging', label: 'Digging' },
  { id: 'syncing', label: 'Syncing' },
]

export default function BrowserLayout() {
  const [activeTab, setActiveTab] = useState('digging')
  const [searchQuery, setSearchQuery] = useState('')
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const performSearch = useCallback(async (query) => {
    const q = (typeof query === 'string' ? query : searchQuery).trim()
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
      setGraphData(data.youtube_metadata)
      setSearchQuery([data.youtube_metadata.title, data.youtube_metadata.artist].filter(Boolean).join(' '))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])


  return (
    <div className="min-h-screen bg-chrome-gray flex flex-col rounded-t-xl overflow-hidden shadow-lg">
      {/* Tab Bar - Digging and Syncing tabs */}
      <div className="flex items-end bg-chrome-gray px-2 pt-2 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-t-lg -mb-px border border-b-0 transition-colors z-0 ${
              activeTab === tab.id
                ? 'bg-white border-gray-200 shadow-sm z-10'
                : 'bg-gray-300 border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
            style={
              activeTab === tab.id
                ? { clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }
                : undefined
            }
          >
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Address Bar (Omnibox) - connected to tab area */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
        {/* Back / Forward / Refresh */}
        <div className="flex items-center gap-0.5">
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
            aria-label="Forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox - Song Search */}
        <form
          className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-3 py-2 hover:bg-white hover:border-gray-300 transition-colors focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
          onSubmit={(e) => { e.preventDefault(); performSearch(searchQuery); }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a track..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 min-w-0"
            disabled={loading}
          />
        </form>
      </div>

      {/* Content Area - switches based on activeTab */}
      <div className="flex-1 bg-white min-h-[400px] flex flex-col overflow-hidden">
        {activeTab === 'digging' && (
          <div className="flex-1 flex flex-col p-4">
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            {loading && (
              <p className="text-gray-500 text-sm mb-2">Searching...</p>
            )}
            <DiggingView
              graphData={graphData}
              onSearch={performSearch}
            />
          </div>
        )}
        {activeTab === 'syncing' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Syncing</h2>
            <p className="text-gray-500">Audio Visualizer view.</p>
          </div>
        )}
      </div>
    </div>
  )
}
