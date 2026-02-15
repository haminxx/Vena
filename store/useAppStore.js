'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TAB_ID_PREFIX = 'tab-'
const INITIAL_TAB_ID = 'tab-initial'

function createTabId() {
  return TAB_ID_PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2)
}

function createNewTab(type = 'new-tab', id = null) {
  return {
    id: id ?? createTabId(),
    type,
    history: type === 'new-tab' ? [] : [{ query: '', graphData: null }],
    currentIndex: 0,
  }
}

/**
 * navigationSlice: Persists history stack, currentIndex, breadcrumb path.
 * Survives page reload and tab switch. Storage key: music-os-history.
 */
function createNavigationSlice(set, get) {
  return {
    tabs: [createNewTab('new-tab', INITIAL_TAB_ID)],
    activeTabId: INITIAL_TAB_ID,

    setActiveTabId: (id) => set({ activeTabId: id }),

    addTab: () => {
      const tab = createNewTab('new-tab')
      set((s) => ({
        tabs: [...s.tabs, tab],
        activeTabId: tab.id,
      }))
      return tab.id
    },

    removeTab: (tabId) => {
      const { tabs, activeTabId } = get()
      const next = tabs.filter((t) => t.id !== tabId)
      const newTabs = next.length > 0 ? next : [createNewTab('new-tab')]
      const newActive = activeTabId === tabId ? (newTabs[0]?.id ?? null) : activeTabId
      set({ tabs: newTabs, activeTabId: newActive })
    },

    updateTab: (tabId, updater) =>
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tabId ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater }) : t
        ),
      })),

    setTabType: (tabId, type, initialState = null) =>
      set((s) => ({
        tabs: s.tabs.map((t) => {
          if (t.id !== tabId) return t
          const isNewTab = t.type === 'new-tab'
          const history = isNewTab ? [initialState ?? { query: '', graphData: null }] : t.history
          return { ...t, type, history, currentIndex: 0 }
        }),
      })),
  }
}

/**
 * savedTracksSlice: Tracks saved from Digging for use in Sync tab.
 */
function createSavedTracksSlice(set) {
  return {
    savedTracks: [],

    addSavedTrack: (track) =>
      set((s) => {
        const exists = s.savedTracks.some((t) => (t.id ?? t.spotifyId) === (track?.id ?? track?.spotifyId))
        if (exists) return s
        const bpm = track?.audioFeatures?.tempo ?? 120
        return { savedTracks: [...s.savedTracks, { ...track, bpm }] }
      }),

    removeSavedTrack: (trackId) =>
      set((s) => ({ savedTracks: s.savedTracks.filter((t) => (t.id ?? t.spotifyId) !== trackId) })),
  }
}

/**
 * strudelTriggerSlice: Receives beat triggers from Strudel for graph pulse.
 */
function createStrudelTriggerSlice(set) {
  return {
    lastTriggerTime: 0,
    setStrudelTrigger: () => set({ lastTriggerTime: Date.now() }),
  }
}

/**
 * syncPlaybackSlice: Play/Stop state for Sync tab (Strudel + Spotify).
 */
function createSyncPlaybackSlice(set) {
  return {
    syncIsPlaying: false,
    setSyncPlaying: (playing) => set({ syncIsPlaying: !!playing }),
  }
}

/**
 * diggingSlice: Persists graph state per tab.
 */
function createDiggingSlice(set) {
  return {
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

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...createDiggingSlice(set),
      ...createNavigationSlice(set, get),
      ...createSavedTracksSlice(set),
      ...createStrudelTriggerSlice(set),
      ...createSyncPlaybackSlice(set),
    }),
    {
      name: 'music-os-history',
      partialize: (s) => ({
        tabs: s.tabs,
        activeTabId: s.activeTabId,
        diggingByTab: s.diggingByTab,
        savedTracks: s.savedTracks,
      }),
    }
  )
)
