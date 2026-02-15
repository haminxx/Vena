'use client'

import { create } from 'zustand'

/**
 * diggingSlice: Persists graph state per tab so switching between Digging/Syncing
 * tabs does not reset the graph. Restore when nodes.length > 0; only re-fetch on Home/Reload.
 */
function createDiggingSlice(set) {
  return {
    // Per-tab: { [tabId]: { nodes, links, focusNodeId, cameraPosition } }
    diggingByTab: {},

    setDiggingState: (tabId, state) =>
      set((s) => ({
        diggingByTab: {
          ...s.diggingByTab,
          [tabId]: state,
        },
      })),

    clearDiggingState: (tabId) =>
      set((s) => {
        const next = { ...s.diggingByTab }
        delete next[tabId]
        return { diggingByTab: next }
      }),
  }
}

export const useAppStore = create((set, get) => ({
  ...createDiggingSlice(set, get),
}))
