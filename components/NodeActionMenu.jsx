'use client'

import { Play, Bookmark, Network, Info } from 'lucide-react'

/**
 * Fixed-size (300px) action menu. Top row: Play, Save. Bottom: Expand, About.
 * Uses Html without transform for fixed pixel size regardless of zoom.
 */
export default function NodeActionMenu({
  onPlay,
  onExpand,
  onAbout,
  onSave,
  onClose,
  hasPreview = false,
  isFetchingPreview = false,
  isSaved = false,
}) {
  return (
    <div
      className="w-[300px] rounded-xl overflow-hidden bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top row: Play (primary) | Save (icon) */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => onPlay?.()}
          disabled={!hasPreview}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            hasPreview
              ? 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
          }`}
          title={hasPreview ? 'Play 30s preview' : isFetchingPreview ? 'Loading preview...' : 'No preview available'}
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
