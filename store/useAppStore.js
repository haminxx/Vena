'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TAB_ID_PREFIX = 'tab-'
const INITIAL_TAB_ID = 'tab-initial'

const DEFAULT_TAB_DATA = {
  graphNodes: [],
  graphLinks: [],
  cameraPosition: [0, 0, 10],
  savedTracks: [],
}

function createTabId() {
  return TAB_ID_PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2)
}

function createNewTab(type = 'new-tab', id = null) {
  return {
    id: id ?? createTabId(),
    type,
    title: null,
    history: type === 'new-tab' ? [] : [{ query: '', graphData: null }],
    currentIndex: 0,
    data: { ...DEFAULT_TAB_DATA },
  }
}

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

    closeTab: (tabId) => {
      const { tabs, activeTabId } = get()
      const next = tabs.filter((t) => t.id !== tabId)
      const newTabs = next.length > 0 ? next : [createNewTab('new-tab')]
      const newActive = activeTabId === tabId ? (newTabs[0]?.id ?? null) : activeTabId
      set({ tabs: newTabs, activeTabId: newActive })
    },

    updateTab: (tabId, updater) =>
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id !== tabId ? t : (typeof updater === 'function' ? updater(t) : { ...t, ...updater })
        ),
      })),

    updateTabTitle: (tabId, newTitle) =>
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id !== tabId ? t : { ...t, title: newTitle ?? t.title })),
      })),

    setTabType: (tabId, type, initialState = null) =>
      set((s) => ({
        tabs: s.tabs.map((t) => {
          if (t.id !== tabId) return t
          const isNewTab = t.type === 'new-tab'
          const history = isNewTab ? [initialState ?? { query: '', graphData: null }] : t.history
          const title = initialState?.graphData?.title ?? initialState?.query ?? null
          const data = isNewTab ? { ...DEFAULT_TAB_DATA } : { ...DEFAULT_TAB_DATA, ...t.data }
          return { ...t, type, title, history, currentIndex: 0, data }
        }),
      })),
  }
}

function createTabDataSlice(set) {
  return {
    saveTrackToTab: (tabId, track) =>
      set((s) => {
        const tab = s.tabs.find((t) => t.id === tabId)
        if (!tab) return s
        const saved = tab.data?.savedTracks ?? []
        const exists = saved.some((t) => (t.id ?? t.spotifyId) === (track?.id ?? track?.spotifyId))
        if (exists) return s
        const bpm = track?.audioFeatures?.tempo ?? 120
        const newTrack = { ...track, bpm }
        return {
          tabs: s.tabs.map((t) =>
            t.id !== tabId
              ? t
              : { ...t, data: { ...(t.data ?? DEFAULT_TAB_DATA), savedTracks: [...saved, newTrack] } }
          ),
        }
      }),

    removeSavedTrackFromTab: (tabId, trackId) =>
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id !== tabId
            ? t
            : {
                ...t,
                data: {
                  ...(t.data ?? DEFAULT_TAB_DATA),
                  savedTracks: (t.data?.savedTracks ?? []).filter(
                    (x) => (x.id ?? x.spotifyId) !== trackId
                  ),
                },
              }
        ),
      })),

    updateTabGraph: (tabId, nodes, links, focusNodeId = null) =>
      set((s) => ({
        tabs: s.tabs.map((t) => {
          if (t.id !== tabId) return t
          const d = t.data ?? { ...DEFAULT_TAB_DATA }
          return {
            ...t,
            data: {
              ...d,
              graphNodes: nodes ?? d.graphNodes,
              graphLinks: links ?? d.graphLinks,
              focusNodeId: focusNodeId ?? d.focusNodeId,
            },
          }
        }),
      })),

    setDiggingState: (tabId, state) =>
      set((s) => ({
        tabs: s.tabs.map((t) => {
          if (t.id !== tabId) return t
          const d = t.data ?? { ...DEFAULT_TAB_DATA }
          return {
            ...t,
            data: {
              ...d,
              graphNodes: state.nodes ?? d.graphNodes,
              graphLinks: state.links ?? d.graphLinks,
              focusNodeId: state.focusNodeId ?? d.focusNodeId,
              cameraPosition: state.cameraPosition ?? d.cameraPosition,
            },
          }
        }),
      })),

    clearDiggingState: (tabId) =>
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id !== tabId ? t : { ...t, data: { ...(t.data ?? DEFAULT_TAB_DATA), ...DEFAULT_TAB_DATA } }
        ),
      })),
  }
}

function createStrudelTriggerSlice(set) {
  return {
    lastTriggerTime: 0,
    setStrudelTrigger: () => set({ lastTriggerTime: Date.now() }),
  }
}

function createSyncPlaybackSlice(set) {
  return {
    syncIsPlaying: false,
    setSyncPlaying: (playing) => set({ syncIsPlaying: !!playing }),
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...createNavigationSlice(set, get),
      ...createTabDataSlice(set),
      ...createStrudelTriggerSlice(set),
      ...createSyncPlaybackSlice(set),
    }),
    {
      name: 'music-os-history',
      version: 3,
      partialize: (s) => ({
        tabs: s.tabs,
        activeTabId: s.activeTabId,
      }),
      merge: (persisted, current) => {
        const p = persisted ?? {}
        const tabs = (p.tabs ?? current.tabs ?? []).map((t) => {
          const legacy = t.graphState ?? p.diggingByTab?.[t.id]
          const data = t.data ?? {
            ...DEFAULT_TAB_DATA,
            graphNodes: legacy?.nodes ?? [],
            graphLinks: legacy?.links ?? [],
            focusNodeId: legacy?.focusNodeId,
          }
          return { ...t, data: { ...DEFAULT_TAB_DATA, ...data } }
        })
        return {
          ...current,
          tabs: tabs.length ? tabs : current.tabs,
          activeTabId: p.activeTabId ?? current.activeTabId,
        }
      },
    }
  )
)
