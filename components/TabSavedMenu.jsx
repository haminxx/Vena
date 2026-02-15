'use client'

import { useState, useRef, useEffect } from 'react'
import { Bookmark, Music, Youtube } from 'lucide-react'
import { useBrowserState } from '@/context/BrowserState'
import { useAppStore } from '@/store/useAppStore'

const EMPTY_ARRAY = []

function getSpotifyUrl(track) {
  const id = track?.spotifyId ?? track?.id
  if (!id) return null
  return `https://open.spotify.com/track/${id}`
}

function getYouTubeUrl(track) {
  const id = track?.videoId
  if (!id) return null
  return `https://www.youtube.com/watch?v=${id}`
}

export default function TabSavedMenu({ dark = false }) {
  const { activeTabId } = useBrowserState()
  const savedTracks = useAppStore((s) => {
    const t = s.tabs.find((x) => x.id === activeTabId)
    return t?.data?.savedTracks ?? EMPTY_ARRAY
  })
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const textClass = dark ? 'text-gray-200' : 'text-gray-800'
  const mutedClass = dark ? 'text-gray-400' : 'text-gray-500'
  const bgClass = dark ? 'bg-gray-800' : 'bg-white'
  const borderClass = dark ? 'border-gray-600' : 'border-gray-200'
  const hoverClass = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'

  return (
    <div ref={menuRef} className="absolute top-4 right-4 z-20">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgClass} border ${borderClass} shadow-md ${hoverClass} transition-colors`}
        aria-label="Saved songs"
        title="Saved songs in this tab"
      >
        <Bookmark className={`w-5 h-5 ${savedTracks.length > 0 ? (dark ? 'text-amber-400' : 'text-amber-600') : mutedClass}`} />
        <span className={`text-sm font-medium ${textClass}`}>
          Saved {savedTracks.length > 0 && `(${savedTracks.length})`}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-full right-0 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border ${borderClass} ${bgClass} shadow-xl`}
        >
          <div className={`px-3 py-2 border-b ${borderClass} font-medium text-sm ${textClass}`}>
            Saved in this tab
          </div>
          <div className="p-2">
            {savedTracks.length === 0 ? (
              <p className={`text-sm ${mutedClass} py-4 text-center`}>
                Save tracks from the graph to see them here.
              </p>
            ) : (
              <ul className="space-y-1">
                {savedTracks.map((track) => {
                  const name = track?.title ?? 'Unknown'
                  const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
                  const spotifyUrl = getSpotifyUrl(track)
                  const youtubeUrl = getYouTubeUrl(track)
                  return (
                    <li
                      key={track?.id ?? track?.spotifyId ?? name}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md ${hoverClass} group`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${textClass}`}>{name}</div>
                        {artist && (
                          <div className={`text-xs truncate ${mutedClass}`}>{artist}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                        {spotifyUrl && (
                          <a
                            href={spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded ${hoverClass} ${mutedClass} hover:text-green-500`}
                            title="Open in Spotify"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Music className="w-4 h-4" />
                          </a>
                        )}
                        {youtubeUrl && (
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded ${hoverClass} ${mutedClass} hover:text-red-500`}
                            title="Open in YouTube"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
