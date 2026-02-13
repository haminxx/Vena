import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Music2,
  User,
} from 'lucide-react'

const SECTIONS = [
  { id: 'digging', label: 'Digging', icon: Search },
  { id: 'syncing', label: 'Syncing', icon: Music2 },
  { id: 'profile', label: 'Profile', icon: User },
]

function BrowserChrome() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('digging')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col rounded-t-xl overflow-hidden shadow-lg">
      {/* Tab Bar - single active tab with trapezoid shape */}
      <div className="flex items-end bg-gray-200 px-2 pt-2 gap-0.5">
        <div
          className="px-5 py-2 bg-white rounded-t-lg shadow-sm -mb-px border border-b-0 border-gray-200 z-10"
          style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }}
        >
          <span className="text-sm text-gray-700 font-medium">New Tab</span>
        </div>
      </div>

      {/* Address Bar Area */}
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
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-3 py-2 hover:bg-white hover:border-gray-300 transition-colors focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a track..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 min-w-0"
          />
        </div>

        {/* Section Navigation (Extensions/Toolbar Icons) */}
        <div className="flex items-center gap-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-2 rounded-full transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={section.label}
            >
              <section.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white min-h-[400px] p-6">
        {activeSection === 'digging' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Digging</h2>
            <p className="text-gray-500">Search and discover tracks. Use the address bar above to search.</p>
          </div>
        )}
        {activeSection === 'syncing' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Syncing</h2>
            <p className="text-gray-500">Library and playlists view.</p>
          </div>
        )}
        {activeSection === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>
            <p className="text-gray-500">Your profile and settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowserChrome
