'use client'

import { useRef, useEffect } from 'react'
import { Play, Bookmark, Network, Info } from 'lucide-react'

/**
 * Fixed-size (300px) action menu. Top row: Play, Save. Bottom: Expand, About.
 * Uses Html without transform for fixed pixel size regardless of zoom.
 * Renders a hidden audio element when previewUrl exists; Play button triggers it directly (user gesture).
 */
export default function NodeActionMenu({
  onPlay,
  onExpand,
  onAbout,
  onSave,
  onClose,
  hasPreview = false,
  previewUrl = null,
  isFetchingPreview = false,
  previewUnavailable = false,
  isSaved = false,
}) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current && previewUrl) {
      audioRef.current.src = previewUrl
    }
  }, [previewUrl])

  const handlePlayClick = () => {
    if (hasPreview && previewUrl && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => console.error('Play failed:', e))
    } else {
      onPlay?.()
    }
  }

  const playTooltip = hasPreview
    ? 'Play 30s preview'
    : isFetchingPreview
      ? 'Loading preview...'
      : previewUnavailable
        ? 'No Preview Available on Spotify'
        : 'No preview available'

  return (
    <div
      className="w-[300px] rounded-xl overflow-hidden bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Hidden audio - play() called directly from click (preserves user gesture) */}
      {previewUrl && <audio ref={audioRef} src={previewUrl} preload="metadata" />}
      {/* Top row: Play (primary) | Save (icon) */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={handlePlayClick}
          disabled={!hasPreview}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            hasPreview
              ? 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
          }`}
          title={playTooltip}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isFetchingPreview ? 'Loading...' : 'Play'}</span>
        </button>
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
