'use client'

import { Network, Info } from 'lucide-react'

/**
 * Floating action menu (Billboarded) - dark-glass pill with Expand and About buttons.
 * Appears next to a node when clicked, before opening the full ArtistCard.
 */
export default function NodeActionMenu({ onExpand, onAbout, onClose, dark = false }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onExpand?.()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors text-white text-sm font-medium"
        title="Expand - spawn similar tracks"
      >
        <Network className="w-4 h-4" />
        <span>Expand</span>
      </button>
      <div className="w-px h-5 bg-white/20" />
      <button
        onClick={() => onAbout?.()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors text-white text-sm font-medium"
        title="About - view artist details"
      >
        <Info className="w-4 h-4" />
        <span>About</span>
      </button>
    </div>
  )
}
