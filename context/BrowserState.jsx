'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const TAB_ID_PREFIX = 'tab-'

function createTabId() {
  return TAB_ID_PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2)
}

function createNewTab(type = 'new-tab') {
  return {
    id: createTabId(),
    type,
    history: type === 'new-tab' ? [] : [{ query: '', graphData: null }],
    currentIndex: 0,
  }
}

const BrowserStateContext = createContext(null)

export function BrowserStateProvider({ children }) {
  const [tabs, setTabs] = useState(() => [createNewTab('new-tab')])
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? null)
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('digbrowser-theme') || 'light'
  })

  const setTheme = useCallback((value) => {
    setThemeState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('digbrowser-theme', value)
    }
  }, [])

  const addTab = useCallback(() => {
    const tab = createNewTab('new-tab')
    setTabs((prev) => [...prev, tab])
    setActiveTabId(tab.id)
    return tab.id
  }, [])

  const removeTab = useCallback((tabId) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId)
      if (next.length === 0) return [createNewTab('new-tab')]
      return next
    })
    setActiveTabId((id) => {
      const next = tabs.filter((t) => t.id !== tabId)
      const idx = next.findIndex((t) => t.id === id)
      if (idx >= 0) return id
      return next[0]?.id ?? null
    })
  }, [tabs])

  const updateTab = useCallback((tabId, updater) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater }) : t))
    )
  }, [])

  const setTabType = useCallback((tabId, type, initialState = null) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId) return t
        const isNewTab = t.type === 'new-tab'
        const history = isNewTab
          ? [initialState ?? { query: '', graphData: null }]
          : t.history
        return {
          ...t,
          type,
          history,
          currentIndex: 0,
        }
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      setActiveTabId,
      addTab,
      removeTab,
      updateTab,
      setTabType,
      theme,
      setTheme,
    }),
    [tabs, activeTabId, addTab, removeTab, updateTab, setTabType, theme, setTheme]
  )

  return <BrowserStateContext.Provider value={value}>{children}</BrowserStateContext.Provider>
}

export function useBrowserState() {
  const ctx = useContext(BrowserStateContext)
  if (!ctx) throw new Error('useBrowserState must be used within BrowserStateProvider')
  return ctx
}
