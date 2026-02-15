'use client'

import { Network, Info, Bookmark } from 'lucide-react'

/**
 * Sleek dark-glass pill: Expand, About, Save.
 * Expand: spawn similar tracks in 3D. About: open full ArtistCard.
 */
export default function NodeActionMenu({ onExpand, onAbout, onSave, onClose, isSaved = false }) {
  return (
    <div
      className="flex items-center gap-1 px-3 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onExpand?.()}
        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/15 transition-colors text-white text-sm font-medium"
        title="Expand - spawn similar tracks"
      >
        <Network className="w-4 h-4" />
        <span>Expand</span>
      </button>
      <div className="w-px h-5 bg-white/20" />
      <button
        onClick={() => onAbout?.()}
        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/15 transition-colors text-white text-sm font-medium"
        title="About - view artist details"
      >
        <Info className="w-4 h-4" />
        <span>About</span>
      </button>
      {onSave && (
        <>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={() => onSave?.()}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-white text-sm font-medium ${isSaved ? 'bg-green-500/30' : 'hover:bg-white/15'}`}
            title={isSaved ? 'Saved for Sync' : 'Save for Sync tab'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </>
      )}
    </div>
  )
}
