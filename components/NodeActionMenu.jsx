'use client'

import { Play, Bookmark, Network, Info } from 'lucide-react'

/**
 * Fixed-size (300px) action menu. Top row: Spotify embed or placeholder, Save. Bottom: Expand, About.
 * Uses Spotify embed for 30s preview (works without login). Expand still uses YouTube Music.
 */
export default function NodeActionMenu({
  onExpand,
  onAbout,
  onSave,
  onClose,
  spotifyId = null,
  isFetchingSpotify = false,
  spotifyUnavailable = false,
  isSaved = false,
}) {
  const embedUrl = spotifyId ? `https://open.spotify.com/embed/track/${spotifyId}?theme=0` : null

  return (
    <div
      className="w-[300px] rounded-xl overflow-hidden bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top row: Spotify embed (30s preview) | Save (icon) */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
              title="Spotify preview"
            />
          ) : isFetchingSpotify ? (
            <div className="flex items-center justify-center gap-2 h-10 rounded-lg bg-gray-600/50 text-gray-400 text-sm">
              <Play className="w-4 h-4 fill-current animate-pulse" />
              <span>Loading preview...</span>
            </div>
          ) : spotifyUnavailable ? (
            <div className="flex items-center justify-center h-10 rounded-lg bg-gray-600/50 text-gray-400 text-xs px-2">
              No preview on Spotify
            </div>
          ) : (
            <div className="flex items-center justify-center h-10 rounded-lg bg-gray-600/50 text-gray-400 text-xs px-2">
              No preview available
            </div>
          )}
        </div>
        {onSave && (
          <button
            onClick={() => onSave?.()}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
              isSaved ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isSaved ? 'Unsave' : 'Save for Sync'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Bottom: darker container - Expand, About */}
      <div className="bg-gray-900/90 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => onExpand?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium"
          title="Expand - spawn similar tracks"
        >
          <Network className="w-4 h-4" />
          <span>Expand</span>
        </button>
        <button
          onClick={() => onAbout?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium"
          title="About - view artist details"
        >
          <Info className="w-4 h-4" />
          <span>About</span>
        </button>
      </div>
    </div>
  )
}
